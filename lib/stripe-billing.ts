/** Cloudflare-compatible Stripe Checkout interface and webhook verification.
 * Secret keys are server-only. Never use frontend metadata to credit tuition.
 */
import {env as runtime} from '../cloudflare/runtime';
import {env as local} from './env';
export function stripeConfig(){
 const pick=(key:string)=>String((runtime as any)[key]||(local as any)[key]||'');
 const secret=pick('STRIPE_SECRET_KEY'),webhook=pick('STRIPE_WEBHOOK_SECRET');
 const enabled=pick('STRIPE_PAYMENTS_ENABLED').toLowerCase()==='true';
 return {secret,webhook,enabled,ready:enabled&&secret.startsWith('sk_')&&webhook.startsWith('whsec_'),testMode:secret.startsWith('sk_test_')};
}
const encoder=new TextEncoder();
export async function verifyStripeSignature(raw:string,header:string,secret:string,nowSeconds=Math.floor(Date.now()/1000)){
 if(!secret||raw.length>500_000||!header)return false;
 const parts=header.split(',').map(x=>x.trim().split('=')),timestamp=Number(parts.find(x=>x[0]==='t')?.[1]||'');
 const signatures=parts.filter(x=>x[0]==='v1').map(x=>x[1]);
 if(!Number.isSafeInteger(timestamp)||Math.abs(nowSeconds-timestamp)>300||!signatures.length)return false;
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const expected=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(timestamp+'.'+raw)));
 const hex=Array.from(expected,x=>x.toString(16).padStart(2,'0')).join('');
 return signatures.some(sig=>{
  if(typeof sig!=='string'||sig.length!==64)return false;
  let mismatch=0;for(let i=0;i<64;i++)mismatch|=sig.charCodeAt(i)^hex.charCodeAt(i);
  return mismatch===0;
 });
}
export function stripePaymentIntent(value:any){
 if(typeof value==='string')return value;
 if(value&&typeof value.id==='string')return value.id;
 return '';
}
export function safeStripeSession(data:any,requestedAmount:number,chargeId:string){
 if(data?.object!=='checkout.session'||typeof data.id!=='string'||!data.id.startsWith('cs_')||typeof data.url!=='string'||!data.url.startsWith('https://checkout.stripe.com/'))throw Error('Payment session response is incomplete or unsafe.');
 if(Number(data.amount_total)!==requestedAmount)throw Error('Payment provider returned the wrong amount.');
 return {id:data.id,url:data.url,expiresAt:Number(data.expires_at||0),chargeId};
}
export async function createStripeCheckout(args:{secret:string;amountCents:number;campusId:string;studentId:string;chargeId:string;description:string;origin:string;idempotencyKey:string}){
 const fields=new URLSearchParams();
 fields.set('mode','payment');
 fields.set('payment_method_types[0]','card');
 fields.set('line_items[0][price_data][currency]','usd');
 fields.set('line_items[0][price_data][unit_amount]',String(args.amountCents));
 fields.set('line_items[0][price_data][product_data][name]',args.description.slice(0,90));
 fields.set('line_items[0][quantity]','1');
 fields.set('metadata[academy_charge_id]',args.chargeId);
 fields.set('metadata[academy_campus_id]',args.campusId);
 fields.set('metadata[academy_student_id]',args.studentId);
 fields.set('client_reference_id',args.chargeId);
 fields.set('success_url',args.origin+'/?checkout=returned&session_id={CHECKOUT_SESSION_ID}');
 fields.set('cancel_url',args.origin+'/?checkout=cancelled');
 fields.set('expires_at',String(Math.floor(Date.now()/1000)+3600));
 const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{
  'Authorization':'Bearer '+args.secret,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':args.idempotencyKey
 },body:fields.toString(),signal:AbortSignal.timeout(15000)});
 const payload=await response.json() as any;
 if(!response.ok)throw Error('Stripe declined Checkout creation ('+response.status+'). Check the server-side Stripe configuration; no student charge was changed.');
 return safeStripeSession(payload,args.amountCents,args.chargeId);
}
