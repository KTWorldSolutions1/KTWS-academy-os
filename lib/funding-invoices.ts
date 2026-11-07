import type {RecordData as R} from './training.ts';
export const INVOICE_STATUSES=['Draft','Approved','Issued — manually confirmed','Void'] as const;
export const BILLABLE_FUNDERS=['WIOA','WRLP','Vocational Rehabilitation','Employer-sponsored','Scholarship','Other outside funding'] as const;
export function invoiceIssue(invoice:R,records:R[]){
 if(invoice.kind!=='funding-invoices')return null;
 if(!INVOICE_STATUSES.includes(invoice.status as any))return 'Choose a draft, approved, manually issued or void invoice status.';
 const student=records.find(r=>r.kind==='students'&&r.id===invoice.studentId&&r.campusId===invoice.campusId);
 if(!student)return 'Funding invoice must belong to a valid student at the same campus.';
 if(!BILLABLE_FUNDERS.includes(invoice.fundingType as any))return 'Choose an outside funding source. Cash payments use the tuition ledger.';
 if(!invoice.funder?.trim()||invoice.funder.length>180)return 'Enter the actual sponsoring agency.';
 if(!invoice.invoiceNumber?.trim()||invoice.invoiceNumber.length>55||!/^[A-Za-z0-9][A-Za-z0-9-]{2,54}$/.test(invoice.invoiceNumber))return 'Enter an invoice number using letters, numbers and dashes.';
 if(!invoice.description?.trim()||invoice.description.length>500)return 'Describe the exact training item being billed.';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(invoice.issueDate||'')||!/^\d{4}-\d{2}-\d{2}$/.test(invoice.dueDate||'')||invoice.dueDate<invoice.issueDate)return 'Provide valid issue and due dates.';
 const amount=Number(invoice.amount);
 if(!Number.isFinite(amount)||amount<0||amount>100000||Math.round(amount*100)!==amount*100)return 'Invoice amount must be a valid dollar-and-cent figure.';
 if(invoice.status!=='Draft'&&(!invoice.authorizationRef?.trim()||invoice.authorizationRef.length>150||!invoice.authorizationVerified))return 'Verify the actual funding authorization reference before approving or issuing an invoice.';
 const dup=records.find(r=>r.kind==='funding-invoices'&&r.id!==invoice.id&&r.invoiceNumber===invoice.invoiceNumber&&r.campusId===invoice.campusId&&r.status!=='Void');
 if(dup)return 'An active invoice with this number already exists at this campus.';
 return null;
}
export function invoicePrintable(invoice:R,student:R,campus:R,klass?:R,trainingHours?:{classroom:number;yard:number;road:number}){
 const safe=(v:any)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const amount=Number(invoice.amount||0).toLocaleString('en-US',{style:'currency',currency:'USD'});
 const header='<div class="top"><div><span class="overline">LONE STAR</span><h1>TRUCK DRIVING ACADEMY</h1><p>'+safe(campus.name)+' · '+safe(campus.address||campus.city||'')+'</p></div><div><h2>INVOICE</h2><p>Invoice # '+safe(invoice.invoiceNumber)+'</p><p>'+safe(invoice.issueDate)+'</p></div></div>';
 const foot=(invoice.status==='Draft'?'DRAFT — NOT APPROVED FOR SUBMISSION':invoice.status==='Approved'?'APPROVED — NOT CONFIRMED SENT':invoice.status)+' · Prepared for secure agency transmission. No automatic delivery or payment collection.';
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>'+safe(invoice.invoiceNumber)+' - Funding invoice</title><style>@page{size:letter;margin:0.65in}body{font:13px Arial;color:#172a3c;margin:35px;line-height:1.5}.top{display:flex;justify-content:space-between;border-bottom:4px solid #1b4c80;padding-bottom:15px}.overline{font-weight:800;color:#245f9e;letter-spacing:3px}h1{font-size:19px;margin:5px 0}h2{font-size:22px}h3{margin-top:25px;color:#214e7d}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{border-bottom:1px solid #aeb9c5;padding:12px;text-align:left}th{background:#e4e9ee}.total{text-align:right;font-size:23px;font-weight:800;color:#163961}.foot{margin-top:45px;color:#607080;border-top:1px solid #bbb;padding-top:16px}p{margin:6px 0}@media print{body{margin:0}}</style></head><body>'+
 header+'<section><h3>Bill to</h3><p><b>'+safe(invoice.funder)+'</b></p><p>'+safe(invoice.billingContact||'Authorized training funding representative')+'</p><p>Authorization reference: '+safe(invoice.authorizationRef||'PENDING')+'</p></section>'+
 '<section><h3>Student & class</h3><p>Student: '+safe(student.name)+' · Student ID: '+safe(student.studentNumber||student.id)+'</p>'+
 '<p>Program: '+safe(student.program)+' · Class: '+safe(klass?.name||student.cohort||'')+'</p><p>Class dates: '+safe(klass?.startDate||'')+' to '+safe(klass?.endDate||'')+'</p><p>Payment type: '+safe(invoice.fundingType)+' · Due: '+safe(invoice.dueDate)+'</p></section>'+
 '<table><thead><tr><th>Training service</th><th>Amount</th></tr></thead><tbody><tr><td>'+safe(invoice.description)+'</td><td>'+amount+'</td></tr></tbody></table><div class="total">TOTAL DUE: '+amount+'</div>'+
 (trainingHours?'<section><h3>Recorded instruction summary (reference only)</h3><p>Classroom: '+trainingHours.classroom+' hrs · Yard instruction: '+trainingHours.yard+' hrs · Road instruction: '+trainingHours.road+' hrs</p><p>Supporting signed training records should be attached if the funding agency requires them. Observation hours must be distinguished separately in the official logs.</p></section>':'')+
 '<div class="foot">'+safe(foot)+'<p>No Social Security number, date of birth, driver license number, drug testing details or medical records are included.</p></div><script>window.onload=()=>window.print();<\/script></body></html>';
}
