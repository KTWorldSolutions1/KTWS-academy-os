import {database} from '../../../../lib/storage';
import {stripeConfig,verifyStripeSignature,stripePaymentIntent} from '../../../../lib/stripe-billing';
const h={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(value:any,status=200)=>Response.json(value,{status,headers:h});
const eventId=(v:any)=>typeof v==='string'&&/^evt_[a-zA-Z0-9]{4,100}$/.test(v);
const piOk=(v:any)=>typeof v==='string'&&/^pi_[a-zA-Z0-9]{4,100}$/.test(v);
function safeInteger(v:any){return typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;}
async function audit(db:any,owner:string,student:string,action:string,payload:any){
 await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES(?,?,?,?,?,?,?)')
 .bind(crypto.randomUUID(),owner,student,action,new Date().toISOString(),JSON.stringify(payload),'Stripe verified webhook').run();
}
export async function POST(req:Request){
 const config=stripeConfig();
 if(!config.ready)return reply({error:'Payment webhooks not configured'},503);
 if(Number(req.headers.get('Content-Length')||0)>500_000)return reply({error:'Payload too large'},413);
 const raw=await req.text();if(raw.length>500_000)return reply({error:'Payload too large'},413);
 if(!await verifyStripeSignature(raw,req.headers.get('stripe-signature')||'',config.webhook))return reply({error:'Invalid webhook signature'},400);
 let event:any;try{event=JSON.parse(raw);}catch{return reply({error:'Invalid webhook event'},400);}
 if(!eventId(event?.id)||typeof event.type!=='string'||!event?.data?.object)return reply({error:'Invalid webhook structure'},400);
 const db=database(),prior:any=await db.prepare('SELECT id,outcome FROM billing_webhook_events WHERE id=?').bind(event.id).first();
 if(prior)return reply({received:true,duplicate:true});
 const object=event.data.object,now=new Date().toISOString();
 const finalize=async(outcome:string,ref:string|null)=>{
  await db.prepare('INSERT OR IGNORE INTO billing_webhook_events(id,type,handled,payment_ref,outcome) VALUES(?,?,?,?,?)')
  .bind(event.id,event.type,now,ref,outcome).run();
  return reply({received:true});
 };
 // Only server-created Stripe Checkout sessions may be credited. Never trust
 // client-supplied receipt screenshots, arbitrary webhook metadata or success URL.
 if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
  if(object.object!=='checkout.session'||typeof object.id!=='string')return reply({error:'Invalid Checkout payload'},400);
  const session:any=await db.prepare('SELECT * FROM billing_stripe_sessions WHERE id=?').bind(object.id).first();
  if(!session)return finalize('Unmatched Stripe session; manually investigate',object.id);
  if(object.mode!=='payment'||object.payment_status!=='paid'||object.currency!=='usd'
   ||!safeInteger(object.amount_total)||object.amount_total!==session.amount_cents
   ||object.metadata?.academy_charge_id!==session.charge_id
   ||object.metadata?.academy_student_id!==session.student
   ||object.metadata?.academy_campus_id!==session.campus){
   return reply({error:'Checkout verification mismatch; payment not credited'},409);
  }
  const pi=stripePaymentIntent(object.payment_intent);
  if(!piOk(pi))return reply({error:'Missing verified Stripe payment intent'},409);
  const charge:any=await db.prepare('SELECT * FROM billing_charges WHERE id=? AND owner=? AND campus=? AND student=?')
  .bind(session.charge_id,session.owner,session.campus,session.student).first();
  if(!charge||charge.status!=='Open')return reply({error:'Linked charge unavailable for matching student'},409);
  const current:any=await db.prepare("SELECT * FROM billing_payments WHERE owner=? AND source='Stripe' AND external_ref=?")
   .bind(session.owner,pi).first();
  if(!current){
   await db.prepare("INSERT OR IGNORE INTO billing_payments(id,owner,campus,student,charge_id,provider,source,amount_cents,status,external_ref,notes,created,created_by,verified_by,verified_at) VALUES(?,?,?,?,?,'Stripe','Stripe',?,'Confirmed',?,'Signed Stripe Checkout event',?,'Stripe','Stripe webhook',?)")
   .bind(crypto.randomUUID(),session.owner,session.campus,session.student,session.charge_id,session.amount_cents,pi,now,now).run();
   await audit(db,session.owner,session.student,'Stripe payment confirmed',{checkoutSession:session.id,paymentIntent:pi,amountCents:session.amount_cents});
  }else if(current.student!==session.student||current.charge_id!==session.charge_id||current.amount_cents!==session.amount_cents)return reply({error:'Conflicting payment-intent allocation; staff review required'},409);
  await db.prepare("UPDATE billing_stripe_sessions SET status='Paid',payment_intent=? WHERE id=? AND status IN ('Open','Paid')")
   .bind(pi,session.id).run();
  return finalize('Confirmed signed Stripe payment',pi);
 }
 // A refund reduces the credited amount instead of deleting the payment record.
 if(event.type==='charge.refunded'&&object.object==='charge'){
  const pi=stripePaymentIntent(object.payment_intent);
  if(!piOk(pi))return finalize('Refund payment intent unavailable',null);
  const p:any=await db.prepare("SELECT * FROM billing_payments WHERE source='Stripe' AND external_ref=?").bind(pi).first();
  if(!p)return finalize('Refund requires finance reconciliation',pi);
  if(!safeInteger(object.amount_refunded))return reply({error:'Invalid Stripe refund amount'},400);
  const refunded=Math.min(p.amount_cents,Math.max(p.refunded_cents||0,object.amount_refunded));
  await db.prepare("UPDATE billing_payments SET refunded_cents=? WHERE id=? AND source='Stripe'").bind(refunded,p.id).run();
  await audit(db,p.owner,p.student,'Stripe refund updated',{paymentIntent:pi,refundedCents:refunded});
  return finalize('Refund reflected in balance',pi);
 }
 if(['charge.dispute.created','charge.dispute.closed','charge.dispute.updated'].includes(event.type)&&object.object==='dispute'){
  const pi=stripePaymentIntent(object.payment_intent);
  if(!piOk(pi))return finalize('Dispute requires manual reconciliation',null);
  const p:any=await db.prepare("SELECT * FROM billing_payments WHERE source='Stripe' AND external_ref=?").bind(pi).first();
  if(!p)return finalize('Dispute on unmatched payment',pi);
  if(!safeInteger(object.amount))return reply({error:'Invalid Stripe disputed amount'},400);
  const active=!['won','warning_closed','lost'].includes(String(object.status||''))||String(object.status||'')==='lost';
  const amount=Math.min(p.amount_cents,active?object.amount:0);
  await db.prepare("UPDATE billing_payments SET disputed_cents=? WHERE id=? AND source='Stripe'").bind(amount,p.id).run();
  await audit(db,p.owner,p.student,'Stripe dispute updated',{paymentIntent:pi,disputedCents:amount,status:String(object.status||'')});
  return finalize('Dispute reflected in balance',pi);
 }
 return finalize('No ledger action required',null);
}
