import {self} from '../route';
import {calculateStudentLedger} from '../../../../lib/student-payments';
import {stripeConfig,createStripeCheckout} from '../../../../lib/stripe-billing';
const h={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const response=(value:any,status=200)=>Response.json(value,{status,headers:h});
export async function POST(req:Request){
 const found=await self();
 if(!found)return response({error:'Your authorized student portal session is required.'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return response({error:'Invalid request origin.'},403);
 if(Number(req.headers.get('Content-Length')||0)>1024)return response({error:'Invalid request.'},413);
 const config=stripeConfig();
 if(!config.ready)return response({error:'Online student payments have not been enabled by the school.'},503);
 let data:any;try{data=await req.json();}catch{return response({error:'Invalid request.'},400);}
 const chargeId=data?.chargeId;
 if(typeof chargeId!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(chargeId))return response({error:'Choose a tuition charge.'},400);
 const {db,student,campus,user}=found;
 const row:any=await db.prepare("SELECT * FROM billing_charges WHERE id=? AND owner='academy-owner' AND student=? AND campus=? AND status='Open'")
  .bind(chargeId,student.id,campus.id).first();
 if(!row)return response({error:'This charge is not available on your school account.'},403);
 const p:any=await db.prepare("SELECT p.*,CASE WHEN v.id IS NOT NULL THEN 1 ELSE 0 END AS voided FROM billing_payments p LEFT JOIN billing_payment_reversals v ON v.payment_id=p.id WHERE p.owner='academy-owner' AND p.student=? AND p.campus=? AND p.charge_id=?")
  .bind(student.id,campus.id,chargeId).all();
 const amount=calculateStudentLedger([row],p.results||[]).charges[0];
 if(!amount||amount.outstanding_cents<100)return response({error:'This tuition charge has no outstanding online-payable balance.'},409);
 if(amount.pending_cents>0)return response({error:'A school payment is pending confirmation. Contact your campus before paying again.'},409);
 try{
  const key='academy-student-'+chargeId+'-'+amount.outstanding_cents+'-'+Math.floor(Date.now()/3_600_000);
  const checkout=await createStripeCheckout({secret:config.secret,amountCents:amount.outstanding_cents,
   campusId:campus.id,studentId:student.id,chargeId,description:String(row.description||'Tuition'),
   origin:new URL(req.url).origin,idempotencyKey:key});
  await db.prepare("INSERT OR IGNORE INTO billing_stripe_sessions(id,owner,campus,student,charge_id,amount_cents,status,created,expires_at) VALUES (?,'academy-owner',?,?,?,?,'Open',?,?)")
   .bind(checkout.id,campus.id,student.id,chargeId,amount.outstanding_cents,new Date().toISOString(),checkout.expiresAt).run();
  await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES(?,?,?,?,?,?,?)')
   .bind(crypto.randomUUID(),'academy-owner',student.id,'Student initiated secure Checkout',new Date().toISOString(),
     JSON.stringify({chargeId,checkoutSession:checkout.id,amountCents:amount.outstanding_cents}),user.email).run();
  return response({checkoutUrl:checkout.url,testMode:config.testMode,notice:'Your balance updates only after Stripe confirms the payment. Save your receipt.'});
 }catch{return response({error:'School payment processor is temporarily unavailable; no payment was recorded.'},503);}
}
