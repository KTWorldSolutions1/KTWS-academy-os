/** Tuition ledger math. Dollar values are stored as integer USD cents.
 * This module never collects cardholder or bank credentials.
 */
export const BILLING_PROVIDERS=[
 'Stripe','Cash','Check','Money order','Bank transfer / ACH','Zelle',
 'Cash App','PayPal','WIOA','WRLP','Vocational Rehabilitation',
 'Employer sponsor','Scholarship / grant','Other verified source'
] as const;
export const CHARGE_TYPES=['Tuition','Enrollment fee','Endorsements','Refresher training','Other approved school charge'] as const;
export const APPROVAL_ROLES=['Owner','Regional admin','Campus manager'] as const;
export const PAYMENT_ROLES=[...APPROVAL_ROLES,'Enrollment specialist','Admin assistant'] as const;
export function moneyCents(value:any){return typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=10_000_000;}
export function dollar(value:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value/100);}
export function providerValid(value:any){return BILLING_PROVIDERS.includes(value);}
export type LedgerCharge={id:string;student:string;campus:string;amount_cents:number;description:string;category:string;due_date:string;status:string;funding_type?:string;external_invoice?:string;};
export type LedgerPayment={id:string;student:string;campus:string;charge_id:string;provider:string;amount_cents:number;refunded_cents:number;disputed_cents:number;status:string;external_ref?:string;source:string;created:string;verified_at?:string;};
export function creditedPayment(p:LedgerPayment){
 if(p.status!=='Confirmed')return 0;
 const amount=Number(p.amount_cents)||0;
 return Math.max(0,amount-Math.min(amount,Math.max(0,Number(p.refunded_cents)||0)+Math.max(0,Number(p.disputed_cents)||0)));
}
export function calculateStudentLedger(charges:LedgerCharge[],payments:LedgerPayment[]){
 const active=charges.filter(c=>c.status==='Open');
 const entries=active.map(c=>{
  const linked=payments.filter(p=>p.charge_id===c.id);
  const paid=linked.reduce((n,p)=>n+creditedPayment(p),0),outstanding=Math.max(0,c.amount_cents-paid);
  const pending=linked.filter(p=>p.status==='Pending').reduce((n,p)=>n+p.amount_cents,0);
  return {...c,paid_cents:paid,outstanding_cents:outstanding,pending_cents:pending,
   label:outstanding===0?'Paid':paid>0?'Partial payment':pending>0?'Awaiting verification':'Unpaid'};
 });
 const total=entries.reduce((n,c)=>n+c.amount_cents,0),paid=entries.reduce((n,c)=>n+c.paid_cents,0);
 return {charges:entries,total_cents:total,paid_cents:paid,outstanding_cents:Math.max(0,total-paid),
  pending_cents:entries.reduce((n,c)=>n+c.pending_cents,0)};
}
export function chargeIssue(body:any){
 if(!moneyCents(body.amountCents)||body.amountCents<100)return 'Charge amount must be between $1.00 and $100,000.00.';
 if(!CHARGE_TYPES.includes(body.category))return 'Select a supported school charge type.';
 if(typeof body.description!=='string'||body.description.trim().length<4||body.description.length>200)return 'Describe the service being billed.';
 if(body.dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate))return 'Use a valid YYYY-MM-DD due date.';
 return null;
}
export function manualPaymentIssue(body:any,remaining:number){
 if(!providerValid(body.provider)||body.provider==='Stripe')return 'Stripe payments must be verified by a signed provider event.';
 if(!moneyCents(body.amountCents)||body.amountCents<1||body.amountCents>remaining)return 'Amount must be positive and cannot exceed the outstanding charge balance.';
 if(typeof body.reference!=='string'||body.reference.trim().length<4||body.reference.length>140)return 'Enter a meaningful bank, receipt, check or agency remittance reference.';
 if(typeof body.note!=='string'||body.note.length>500)return 'Payment notes cannot exceed 500 characters.';
 return null;
}
export function publicBillingSummary(summary:ReturnType<typeof calculateStudentLedger>){
 return {totalCents:summary.total_cents,paidCents:summary.paid_cents,outstandingCents:summary.outstanding_cents,
  charges:summary.charges.map(c=>({id:c.id,description:c.description,category:c.category,dueDate:c.due_date,
   amountCents:c.amount_cents,paidCents:c.paid_cents,outstandingCents:c.outstanding_cents,label:c.label})),
  notice:'Balance based on school-posted payments and verified processor events. Manual remittances may require staff review. This page does not display card numbers or banking details.'};
}
