import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';
import {campusAllowed} from '../../../lib/enterprise';
import {PAYMENT_ROLES,APPROVAL_ROLES,BILLING_PROVIDERS,calculateStudentLedger,chargeIssue,manualPaymentIssue,publicBillingSummary} from '../../../lib/student-payments';
import {stripeConfig,createStripeCheckout} from '../../../lib/stripe-billing';

const h={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(body:any,status=200)=>Response.json(body,{status,headers:h});
const idOk=(value:any)=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(value);
const changes=(r:any)=>Number(r?.meta?.changes??r?.changes??0);
const isManager=(role:string)=>APPROVAL_ROLES.includes(role as any);
async function audit(db:any,scope:string,student:string,action:string,actor:string,detail:any){
 await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),scope,student,action,new Date().toISOString(),JSON.stringify(detail),actor).run();
}
async function studentFor(db:any,access:any,id:string){
 const row:any=await db.prepare("SELECT payload FROM records WHERE owner=? AND id=? AND kind='students'").bind(access.scope,id).first();
 const student=row?JSON.parse(row.payload):null;
 return student&&campusAllowed(access.role,access.campusIds,student,[student])?student:null;
}
export async function GET(req:Request){
 const access=await getWorkspaceAccess();if(!access)return reply({error:'Sign-in required'},401);
 if(!PAYMENT_ROLES.includes(access.role as any))return reply({error:'Student billing is restricted to finance and enrollment staff'},403);
 const studentId=new URL(req.url).searchParams.get('studentId');
 const config=stripeConfig();
 if(!studentId)return reply({stripe:{ready:config.ready,enabled:config.enabled,testMode:config.testMode},methods:BILLING_PROVIDERS,
   notice:'Stripe auto-reconciliation requires a configured account and signed webhooks. Other methods require verified remittance.'});
 if(!idOk(studentId))return reply({error:'Invalid student'},400);
 const db=database(),student=await studentFor(db,access,studentId);
 if(!student)return reply({error:'Student unavailable or outside permitted campus'},403);
 const [cr,pr]=await Promise.all([db.prepare('SELECT * FROM billing_charges WHERE owner=? AND student=? ORDER BY created DESC').bind(access.scope,student.id).all(),
 db.prepare('SELECT * FROM billing_payments WHERE owner=? AND student=? ORDER BY created DESC').bind(access.scope,student.id).all()]);
 const charges=cr.results||[],payments=pr.results||[],summary=calculateStudentLedger(charges,payments);
 return reply({student:{id:student.id,name:student.name,campus:student.campusId,fundingType:student.fundingType||null},
 summary:publicBillingSummary(summary),charges:summary.charges,payments:payments.map((p:any)=>({
  id:p.id,chargeId:p.charge_id,provider:p.provider,amountCents:p.amount_cents,status:p.status,source:p.source,
  refundedCents:p.refunded_cents,disputedCents:p.disputed_cents,
  reference:p.source==='Stripe'?p.external_ref:String(p.external_ref||'').slice(-10),created:p.created,verifiedAt:p.verified_at})),
 stripe:{ready:config.ready,enabled:config.enabled,testMode:config.testMode},canApprove:isManager(access.role)});
}
export async function POST(req:Request){
 const access=await getWorkspaceAccess();if(!access)return reply({error:'Sign-in required'},401);
 if(!PAYMENT_ROLES.includes(access.role as any))return reply({error:'Student billing requires authorized staff'},403);
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Invalid origin'},403);
 if(Number(req.headers.get('Content-Length')||0)>10000)return reply({error:'Request too large'},413);
 let data:any;try{data=await req.json();}catch{return reply({error:'Invalid billing request'},400);}
 const action=String(data.action||''),studentId=data.studentId;
 if(!idOk(studentId))return reply({error:'Select a valid student'},400);
 const db=database(),student=await studentFor(db,access,studentId);
 if(!student)return reply({error:'Student unavailable or outside your campus'},403);
 const manager=isManager(access.role),now=new Date().toISOString(),actor=access.user.email,scope=access.scope;
 if(action==='create-charge'){
  if(!manager)return reply({error:'Only school management can create tuition charges'},403);
  const problem=chargeIssue(data);if(problem)return reply({error:problem},400);
  const id=crypto.randomUUID(),funding=String(data.fundingType||student.fundingType||'').slice(0,80);
  await db.prepare("INSERT INTO billing_charges(id,owner,campus,student,amount_cents,description,category,due_date,funding_type,status,created,created_by) VALUES (?,?,?,?,?,?,?,?,?,'Open',?,?)")
   .bind(id,scope,student.campusId,student.id,data.amountCents,data.description.trim(),data.category,data.dueDate||now.slice(0,10),funding,now,actor).run();
  await audit(db,scope,student.id,'Tuition charge created',actor,{chargeId:id,amountCents:data.amountCents,category:data.category});
  return reply({created:true,id});
 }
 const chargeId=data.chargeId;
 if(!idOk(chargeId))return reply({error:'Select a charge'},400);
 const charges:any=await db.prepare('SELECT * FROM billing_charges WHERE owner=? AND student=? AND campus=? AND status=?').bind(scope,student.id,student.campusId,'Open').all();
 const payments:any=await db.prepare('SELECT * FROM billing_payments WHERE owner=? AND student=? AND campus=?').bind(scope,student.id,student.campusId).all();
 const summary=calculateStudentLedger(charges.results||[],payments.results||[]);
 const charge=summary.charges.find((c:any)=>c.id===chargeId);
 if(!charge)return reply({error:'Open charge not found for this student'},404);
 if(action==='record-manual'){
  const issue=manualPaymentIssue(data,charge.outstanding_cents);
  if(issue)return reply({error:issue},400);
  const id=crypto.randomUUID();
  await db.prepare("INSERT INTO billing_payments(id,owner,campus,student,charge_id,provider,source,amount_cents,status,external_ref,notes,created,created_by) VALUES(?,?,?,?,?,?,?,?,'Pending',?,?,?,?)")
   .bind(id,scope,student.campusId,student.id,charge.id,data.provider,'Manual',data.amountCents,data.reference.trim(),String(data.note||''),now,actor).run();
  await audit(db,scope,student.id,'Manual remittance awaiting verification',actor,{paymentId:id,chargeId,method:data.provider,amountCents:data.amountCents});
  return reply({recorded:true,id,status:'Pending',notice:'Balance unchanged until management verifies the actual funds.'});
 }
 if(action==='verify-manual'||action==='reject-manual'){
  if(!manager)return reply({error:'Only campus management may verify a payment'},403);
  const paymentId=String(data.paymentId||'');
  if(!idOk(paymentId))return reply({error:'Select a payment'},400);
  const p:any=await db.prepare("SELECT * FROM billing_payments WHERE id=? AND owner=? AND student=? AND campus=? AND charge_id=? AND source='Manual'")
   .bind(paymentId,scope,student.id,student.campusId,charge.id).first();
  if(!p||p.status!=='Pending')return reply({error:'Pending payment not found'},409);
  if(p.created_by===actor&&action==='verify-manual')return reply({error:'A second authorized manager must confirm the funds; the original recorder cannot self-approve'},403);
  if(action==='verify-manual'&&p.amount_cents>charge.outstanding_cents)return reply({error:'The remaining balance changed. Review overpayment before posting funds.'},409);
  const next=action==='verify-manual'?'Confirmed':'Rejected';
  const update:any=await db.prepare("UPDATE billing_payments SET status=?,verified_by=?,verified_at=? WHERE id=? AND owner=? AND status='Pending'")
   .bind(next,actor,now,p.id,scope).run();
  if(!changes(update))return reply({error:'Payment status already updated; reload'},409);
  await audit(db,scope,student.id,'Manual remittance '+next.toLowerCase(),actor,{paymentId:p.id,chargeId,amountCents:p.amount_cents,method:p.provider});
  return reply({updated:true,status:next});
 }
 if(action==='stripe-checkout'){
  if(!manager)return reply({error:'School management must initiate staff checkout sessions'},403);
  const config=stripeConfig();if(!config.ready)return reply({error:'Stripe is not connected. Add owner-approved Stripe secret and verified webhook signing secret in Cloudflare, then enable STRIPE_PAYMENTS_ENABLED.'},503);
  if(!charge.outstanding_cents)return reply({error:'This charge is already paid'},409);
  if(charge.pending_cents>0)return reply({error:'A manual remittance is awaiting verification. Resolve it before launching an online charge to avoid duplicate payment.'},409);
  try{
   const session=await createStripeCheckout({secret:config.secret,amountCents:charge.outstanding_cents,campusId:student.campusId,studentId:student.id,chargeId,description:charge.description,origin:new URL(req.url).origin,idempotencyKey:'academy-'+chargeId+'-'+charge.outstanding_cents});
   await db.prepare("INSERT OR IGNORE INTO billing_stripe_sessions(id,owner,campus,student,charge_id,amount_cents,status,created,expires_at) VALUES(?,?,?,?,?,?,'Open',?,?)")
    .bind(session.id,scope,student.campusId,student.id,chargeId,charge.outstanding_cents,now,session.expiresAt).run();
   await audit(db,scope,student.id,'Stripe Checkout initiated',actor,{chargeId,sessionId:session.id,amountCents:charge.outstanding_cents});
   return reply({checkoutUrl:session.url,testMode:config.testMode,notice:'Payment is not credited until the signed Stripe webhook confirms it.'});
  }catch{return reply({error:'Stripe checkout unavailable; no payment has been credited.'},503);}
 }
 return reply({error:'Unsupported billing action'},400);
}
