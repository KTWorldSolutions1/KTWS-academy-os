'use client';
import {useEffect,useMemo,useState} from 'react';
import {BadgeCheck,Banknote,CheckCircle2,CircleDollarSign,CreditCard,FileText,LockKeyhole,Receipt,RefreshCcw,ShieldCheck,WalletCards} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {BILLING_PROVIDERS,CHARGE_TYPES,calculateStudentLedger,dollar,type LedgerCharge,type LedgerPayment} from '../lib/student-payments';
type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(items:R[])=>Promise<boolean>;initialStudentId?:string};
type Charge={id:string;description:string;category:string;amountCents:number;paidCents:number;outstandingCents:number;label:string;dueDate:string;fundingType?:string;};
type Payment={id:string;chargeId:string;provider:string;amountCents:number;status:string;source:string;reference?:string;created:string;verifiedAt?:string;refundedCents?:number;disputedCents?:number;voided?:boolean;reversalReason?:string;reversedAt?:string;};
type Ledger={student?:any;charges:Charge[];payments:Payment[];summary:{totalCents:number;paidCents:number;outstandingCents:number;charges:Charge[]};stripe:{ready:boolean;enabled:boolean;testMode:boolean};canApprove:boolean;canReverse:boolean;};
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
const asCents=(value:string)=>{if(!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(value))return 0;return Math.round(Number(value)*100);};
const unique=(list:Payment[],id:string)=>list.find(p=>p.id===id);
export default function StudentPaymentCenter({records,role,demo,busy,saveMany,initialStudentId}:Props){
 const students=records.filter(r=>r.kind==='students'&&r.status!=='Withdrawn').sort((a,b)=>a.name.localeCompare(b.name));
 const campuses=records.filter(r=>r.kind==='campuses');
 const [studentId,setStudentId]=useState(initialStudentId||''),[ledger,setLedger]=useState<Ledger|null>(null),[loading,setLoading]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const [amount,setAmount]=useState('3000.00'),[category,setCategory]=useState<string>('Tuition'),[description,setDescription]=useState('Class A CDL tuition'),[due,setDue]=useState(today()),[chargeId,setChargeId]=useState('');
 const [reversalReason,setReversalReason]=useState(''),[reversalId,setReversalId]=useState(''),[voidId,setVoidId]=useState('');
 const [method,setMethod]=useState('Cash'),[payAmount,setPayAmount]=useState(''),[reference,setReference]=useState(''),[note,setNote]=useState('');
 const selected=students.find(s=>s.id===studentId)||students[0];const sid=selected?.id;
 const canApprove=['Owner','Regional admin','Campus manager'].includes(role);
 useEffect(()=>{if(initialStudentId&&students.some(s=>s.id===initialStudentId))setStudentId(initialStudentId);},[initialStudentId,records.length]);
 useEffect(()=>{setChargeId('');setMessage('');setError('');if(!sid){setLedger(null);return;}
  if(demo){const bills=(selected.demoBilling?.charges||[]) as any[];const receipts=(selected.demoBilling?.payments||[]) as any[];
   const summary=calculateStudentLedger(bills.map(x=>({...x,amount_cents:x.amount_cents??x.amountCents,status:x.status||'Open',student:sid})),receipts.map(x=>({...x,charge_id:x.charge_id??x.chargeId,amount_cents:x.amount_cents??x.amountCents,refunded_cents:0,disputed_cents:0,source:'Demo'})));
   const billsUi=summary.charges.map(c=>({id:c.id,category:c.category,description:c.description,amountCents:c.amount_cents,paidCents:c.paid_cents,
    outstandingCents:c.outstanding_cents,label:c.label,dueDate:c.due_date,fundingType:c.funding_type}));
   const paymentsUi=receipts.map(x=>({id:x.id,chargeId:x.charge_id,provider:x.provider,amountCents:x.amount_cents,status:x.status,
    source:x.source||'Demo',reference:x.external_ref||'FICTIONAL',created:x.created,verifiedAt:x.verified_at,voided:!!x.voided,reversalReason:x.reversalReason}));
   setLedger({student:selected,charges:billsUi,payments:paymentsUi,summary:{totalCents:summary.total_cents,paidCents:summary.paid_cents,outstandingCents:summary.outstanding_cents,charges:billsUi},
    stripe:{ready:false,enabled:false,testMode:true},canApprove:true,canReverse:true});return;
  }
  let cancelled=false;setLoading(true);
  fetch('/api/billing?studentId='+encodeURIComponent(sid),{cache:'no-store'}).then(async res=>{const body=await res.json();if(!res.ok)throw Error(body.error||'Could not load the tuition ledger');if(!cancelled)setLedger(body);})
   .catch(err=>{if(!cancelled){setLedger(null);setError(err.message);}}).finally(()=>{if(!cancelled)setLoading(false);});
  return()=>{cancelled=true;};
 },[sid,demo,records]);
 useEffect(()=>{const first=ledger?.charges.find(c=>c.outstandingCents>0);setChargeId(first?.id||'');setPayAmount(first?(first.outstandingCents/100).toFixed(2):'');},[ledger?.charges.map(c=>c.id+':'+c.outstandingCents).join('|')]);
 async function reversePayment(p:Payment){
  const reason=reversalReason.trim();
  if(reason.length<15){setError('Enter at least 15 characters explaining why this receipt is incorrect.');return;}
  if(!window.confirm('Reverse this manually recorded payment credit? This will change the student balance. No bank/Stripe refund will be issued. The original receipt stays in the audit record.'))return;
  await action('reverse-manual',{chargeId:p.chargeId,paymentId:p.id,reason,confirm:'REVERSE INCORRECT MANUAL PAYMENT'});
  setReversalId('');setReversalReason('');
 }
 async function voidCharge(c:Charge){
  const reason=reversalReason.trim();
  if(reason.length<15){setError('Enter at least 15 characters explaining why the charge is incorrect.');return;}
  if(!window.confirm('Void this entire charge? It will disappear from the active balance but remain in audit history. This does not refund or cancel any payment through a bank.'))return;
  await action('void-charge',{chargeId:c.id,reason,confirm:'VOID INCORRECT CHARGE'});
  setVoidId('');setReversalReason('');
 }
 async function reload(){
  if(!sid||demo)return;
  setLoading(true);
  try{const response=await fetch('/api/billing?studentId='+encodeURIComponent(sid),{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error||'Billing service unavailable');setLedger(data);}
  catch(e:any){setError(e.message);}finally{setLoading(false);}
 }
 async function action(name:string,extra:any={}){
  if(!selected)return;
  setMessage('');setError('');const data={action:name,studentId:selected.id,...extra};
  if(demo){
   const bill={...selected.demoBilling,charges:[...(selected.demoBilling?.charges||[])],payments:[...(selected.demoBilling?.payments||[])]};
   const charge=bill.charges.find((r:any)=>r.id===extra.chargeId);
   const now=new Date().toISOString();
   if(name==='create-charge'){bill.charges.push({id:'demo-charge-'+crypto.randomUUID(),campus:selected.campusId,student:selected.id,description:extra.description,
     amount_cents:extra.amountCents,category:extra.category,due_date:extra.dueDate,status:'Open',funding_type:selected.fundingType,created:now});}
   if(name==='record-manual'){
    if(!charge)return setError('Choose an open charge.');bill.payments.push({id:'demo-payment-'+crypto.randomUUID(),student:selected.id,campus:selected.campusId,charge_id:extra.chargeId,provider:extra.provider,
      amount_cents:extra.amountCents,refunded_cents:0,disputed_cents:0,status:'Pending',source:'Demo',external_ref:extra.reference,created:now,created_by:'Demo cashier'});}
   if(name==='verify-manual'||name==='reject-manual'){
    const p=bill.payments.find((x:any)=>x.id===extra.paymentId);if(!p||p.status!=='Pending')return setError('Choose a pending demo remittance');
    p.status=name==='verify-manual'?'Confirmed':'Rejected';p.verified_at=now;
   }
   if(name==='reverse-manual'){
    const p=bill.payments.find((x:any)=>x.id===extra.paymentId);
    if(!p||p.status!=='Confirmed'||p.source==='Stripe'||p.voided)return setError('Choose an eligible confirmed manual demo payment.');
    p.voided=true;p.reversalReason=extra.reason;p.reversedAt=now;
   }
   if(name==='void-charge'){
    const c=bill.charges.find((x:any)=>x.id===extra.chargeId);
    if(!c||bill.payments.some((p:any)=>p.charge_id===c.id&&p.status==='Pending'||p.charge_id===c?.id&&p.status==='Confirmed'&&!p.voided))
     return setError('Resolve any pending or credited demo payments before voiding the charge.');
    c.status='Voided';
   }
   if(name==='stripe-checkout'){
    if(!charge)return setError('Create a demo charge first.');
    bill.payments.push({id:'demo-stripe-'+crypto.randomUUID(),student:selected.id,campus:selected.campusId,charge_id:charge.id,provider:'Stripe',
     amount_cents:extra.amountCents||charge.amount_cents,refunded_cents:0,disputed_cents:0,status:'Confirmed',source:'Demo',external_ref:'DEMO STRIPE TEST ONLY',created:now,created_by:'Fictional signed event'});
   }
   if(await saveMany([{...selected,demoBilling:bill}])){
    setMessage(name==='stripe-checkout'?'Sample only: simulated a signed Stripe test event. No checkout opened and no money moved.':name==='verify-manual'?'Sample remittance marked verified by demonstration finance role.':'Saved in the synthetic demo ledger. No real payment was initiated.');
   }else setError('Could not update the sample ledger');
   return;
  }
  setLoading(true);
  try{const response=await fetch('/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Payment action unavailable');
   setMessage(result.notice||'Billing record updated.');await reload();
   if(name==='stripe-checkout'&&result.checkoutUrl){window.open(result.checkoutUrl,'_blank','noopener,noreferrer');setMessage('Hosted Stripe payment page opened. The student balance updates only after verified payment confirmation.');}
  }catch(e:any){setError(e.message);}finally{setLoading(false);}
 }
 const outstanding=ledger?.charges.filter(c=>c.outstandingCents>0)||[];
 const chosen=outstanding.find(c=>c.id===chargeId);
 const pending=ledger?.payments.filter(p=>p.status==='Pending')||[];
 return <section className="student-payment-center"><div className="panel"><div className="sectionhead"><div><p className="eyebrow">TUITION • THIRD-PARTY FUNDING • PAYMENT RECONCILIATION</p><h2><WalletCards size={25}/> Student Payment Center</h2><p className="muted">Each student has a separate campus-restricted tuition ledger. Charges, confirmed payments, partial balances, remittance verification and Stripe events are linked to the same account.</p></div><ShieldCheck size={28}/></div>
 <div className="formgrid"><label>Student account<select value={sid||''} onChange={e=>setStudentId(e.target.value)}>{students.map(s=><option value={s.id} key={s.id}>{s.name} • {campuses.find(c=>c.id===s.campusId)?.name||'Campus'} • {s.studentNumber||s.id.slice(0,6)}</option>)}</select></label><label>Payment source from enrollment<input value={selected?.fundingType||'Not entered'} disabled/></label></div>
 {demo&&<p className="notice">SANDBOX: Payment demonstrations change only fictitious student records in this browser. Stripe, banks and funding agencies receive nothing.</p>}
 {!demo&&<p className="notice">{ledger?.stripe.ready?(ledger?.stripe.testMode?'Stripe TEST environment ready':'Stripe LIVE environment configured'):'Stripe is currently disconnected. Cash, checks and agency remittances require verification.'}</p>}
 {loading&&<p>Loading student ledger…</p>}
 <div className="curriculum-metrics payment-metrics"><div><strong>{dollar(ledger?.summary.totalCents||0)}</strong><small>Open student charges</small></div><div><strong>{dollar(ledger?.summary.paidCents||0)}</strong><small>Confirmed payments</small></div><div><strong>{dollar(ledger?.summary.outstandingCents||0)}</strong><small>Balance due</small></div><div><strong>{pending.length}</strong><small>Awaiting proof and approval</small></div></div>
 <div className="payment-table tablewrap"><table><thead><tr><th>Charge</th><th>Due</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th></tr></thead><tbody>{(ledger?.charges||[]).map(c=><tr key={c.id}><td><b>{c.description}</b><small>{c.category} • {c.fundingType||'Payer not selected'}</small></td><td>{c.dueDate||'—'}</td><td>{dollar(c.amountCents)}</td><td>{dollar(c.paidCents)}</td><td>{dollar(c.outstandingCents)}</td><td><span className={'badge '+(c.outstandingCents===0?'good':'warn')}>{c.label}</span>{(demo||ledger?.canReverse)&&<button type="button" disabled={busy||loading} onClick={()=>{setVoidId(c.id);setReversalId('');setReversalReason('')}}>Correct charge</button>}</td></tr>)}</tbody></table>{!ledger?.charges.length&&<p className="notice">No school-posted tuition charges yet. Create an approved charge to start a student payment plan.</p>}</div>
 <div className="payment-actions"><button onClick={reload} disabled={demo||loading}><RefreshCcw size={15}/> Refresh verified balances</button></div>
 </div>
 <div className="payment-side"><section className="panel"><h3><FileText size={18}/> Add tuition or school charge</h3><p className="muted">Only management roles can approve charges. A charge does not collect money.</p><div className="formgrid"><label>Charge type<select value={category} onChange={e=>setCategory(e.target.value)}>{CHARGE_TYPES.map(c=><option key={c}>{c}</option>)}</select></label>
 <label>Amount in USD<input value={amount} inputMode="decimal" onChange={e=>setAmount(e.target.value)} placeholder="3000.00"/></label><label>Description<input value={description} onChange={e=>setDescription(e.target.value)} maxLength={200}/></label><label>Due date<input type="date" value={due} onChange={e=>setDue(e.target.value)}/></label></div>
 <button className="primary" disabled={busy||loading||!canApprove||!sid||asCents(amount)<100} onClick={()=>action('create-charge',{category,description,amountCents:asCents(amount),dueDate:due})}><CircleDollarSign size={16}/> Create tuition charge</button></section>
 <section className="panel"><h3><Banknote size={18}/> Cash, bank, employer & workforce funds</h3><p className="muted">Record only funds actually received. Agency authorization alone is not a payment. A second manager confirms the supporting remittance.</p><div className="formgrid"><label>Apply to charge<select value={chargeId} onChange={e=>{setChargeId(e.target.value);const c=outstanding.find(x=>x.id===e.target.value);setPayAmount(c?(c.outstandingCents/100).toFixed(2):'');}}>{outstanding.map(c=><option value={c.id} key={c.id}>{c.description} • {dollar(c.outstandingCents)} due</option>)}</select></label><label>Payment type<select value={method} onChange={e=>setMethod(e.target.value)}>{BILLING_PROVIDERS.filter(x=>x!=='Stripe').map(x=><option key={x}>{x}</option>)}</select></label><label>Amount received<input value={payAmount} onChange={e=>setPayAmount(e.target.value)} inputMode="decimal"/></label><label>Receipt/check/remittance reference<input value={reference} onChange={e=>setReference(e.target.value)} maxLength={140} placeholder="Receipt / agency claim ID"/></label></div><label>Internal reconciliation note<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500}/></label>
 <button disabled={busy||loading||!chosen||!reference.trim()||asCents(payAmount)<1||asCents(payAmount)>chosen.outstandingCents} onClick={()=>action('record-manual',{chargeId,amountCents:asCents(payAmount),provider:method,reference,note})}><Receipt size={16}/> Log payment for verification</button></section>
 <section className="panel"><h3><CreditCard size={18}/> Stripe Online Checkout</h3><p className="muted">{ledger?.stripe.ready?'Secure hosted Checkout, with signed webhook reconciliation and refunds tracking.':'The payment option will activate after Stripe keys and a verified webhook endpoint are configured by the school owner.'}</p>
 <button disabled={!chosen||loading||busy||(!demo&&!ledger?.stripe.ready)||!canApprove} onClick={()=>action('stripe-checkout',{chargeId,amountCents:chosen?.outstandingCents})}><CreditCard size={16}/> {demo?'Simulate a Stripe payment':'Open hosted Stripe checkout'}</button>
 <p className="footnote">Do not collect card numbers in Academy OS. Live bank and credit-card payments are processed only by the connected payment provider; a successful browser redirect never counts as proof of payment.</p></section></div>
 <section className="panel"><h3><BadgeCheck size={18}/> Receipts & reconciliation queue</h3>{!ledger?.payments.length&&<p className="notice">No receipts or verified transactions recorded.</p>}
 {(ledger?.payments||[]).map(p=><div className="vault-doc-row" key={p.id}><div><b>{dollar(p.amountCents)} • {p.provider}</b><small>{p.created?.slice(0,10)} • {p.reference||'reference withheld'} • {p.source}{p.refundedCents?' • Refunded '+dollar(p.refundedCents):''}{p.disputedCents?' • Disputed '+dollar(p.disputedCents):''}</small></div><div><span className={'badge '+(p.status==='Confirmed'&&!p.voided?'good':p.status==='Pending'?'warn':'')}>{p.voided?'Reversed':p.status}</span>
 {(demo||ledger?.canReverse)&&p.source!=='Stripe'&&p.status==='Confirmed'&&!p.voided&&<button type="button" disabled={busy||loading} onClick={()=>{setReversalId(p.id);setVoidId('');setReversalReason('')}}>Reverse incorrect payment</button>}
 {p.status==='Pending'&&canApprove&&<><button disabled={loading||busy} onClick={()=>action('verify-manual',{chargeId:p.chargeId,paymentId:p.id})}><CheckCircle2 size={15}/> Verify proof</button><button disabled={loading||busy} onClick={()=>action('reject-manual',{chargeId:p.chargeId,paymentId:p.id})}>Reject</button></>}</div></div>)}
 </section>
 {(reversalId||voidId)&&<section className="panel" aria-label="Correct a mistaken test billing entry"><h3>{reversalId?'Reverse incorrect manual payment':'Void erroneous tuition charge'}</h3><p className="muted">This action adjusts the school ledger but does not issue a refund or erase financial records. Only a school owner can perform it on actual student accounts.</p>
 <label>Reason for accounting correction <textarea rows={3} maxLength={400} value={reversalReason} onChange={e=>setReversalReason(e.target.value)} placeholder="Example: Training demonstration recorded in error; no funds were actually received."/></label>
 <div className="reportactions"><button type="button" onClick={()=>{setReversalId('');setVoidId('');setReversalReason('')}}>Cancel</button>
 {reversalId&&<button className="primary" type="button" disabled={loading||busy||reversalReason.trim().length<15} onClick={()=>{const payment=ledger?.payments.find(x=>x.id===reversalId);if(payment)void reversePayment(payment)}}>Confirm ledger reversal</button>}
 {voidId&&<button className="primary" type="button" disabled={loading||busy||reversalReason.trim().length<15} onClick={()=>{const charge=ledger?.charges.find(x=>x.id===voidId);if(charge)void voidCharge(charge)}}>Confirm charge void</button>}</div></section>}
 {message&&<p className="notice" role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}
 <div className="panel"><h3><LockKeyhole size={17}/> Connection & compliance checklist</h3><p>Stripe is the only processor designed for automatic settlement reconciliation in this build. Cash, Zelle, Cash App, PayPal, checks, WIOA, WRLP, vocational rehabilitation and other funding sources can be tracked through verified manual remittances. They are not falsely labeled as live API integrations.</p><p className="footnote">Each manager must verify agency acceptance, refund rules, transaction receipts, credit card processor credentials and privacy standards before enabling production collection. Payment data never includes raw card information.</p></div>
 </section>;
}
