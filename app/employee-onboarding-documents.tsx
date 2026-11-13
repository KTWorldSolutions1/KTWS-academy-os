import {useEffect,useState} from 'react';
type Doc={id:string;formName:string;group:string;version:number;verifiedAt:string|null;verificationNote:string};
type Props={caseId:string;status:string};
const forms=[
 {id:'emergency-contact',label:'Emergency contact form'},
 {id:'handbook-acknowledgement',label:'Employee handbook acknowledgment'},
 {id:'policy-acknowledgement',label:'Workplace policy acknowledgment'},
 {id:'federal-w4',label:'Completed federal W-4'},
 {id:'nc4',label:'Completed North Carolina NC-4'},
 {id:'nc4-ez',label:'NC-4 EZ (alternative to NC-4)'},
 {id:'i9-section-1',label:'Employee I-9 Section 1'},
 {id:'direct-deposit',label:'Direct deposit authorization'},
 {id:'role-credential',label:'Instructor / recruiter credentials, if applicable'}
];
export default function EmployeeOnboardingDocuments({caseId,status}:Props){
 const [docs,setDocs]=useState<Doc[]>([]),[missing,setMissing]=useState<string[]>([]),[busy,setBusy]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
 async function load(){
  const r=await fetch('/api/employee-onboarding/documents?caseId='+encodeURIComponent(caseId),{cache:'no-store'});
  const b=await r.json();if(!r.ok)throw Error(b.error||'Unable to load documents');
  setDocs(b.documents||[]);setMissing(b.missingEmployeeForms||[]);
 }
 useEffect(()=>{void load().catch((e:any)=>setError(e.message))},[caseId]);
 async function upload(formName:string,file:File|null){
  if(!file)return;
  setBusy(formName);setError('');setMessage('');
  try{
   const data=new FormData();data.set('caseId',caseId);data.set('formName',formName);data.set('file',file);
   const r=await fetch('/api/employee-onboarding/documents',{method:'POST',body:data}),b=await r.json();
   if(!r.ok)throw Error(b.error||'Unable to upload');
   setMessage('Encrypted '+formName+' evidence received for HR verification.');await load();
  }catch(e:any){setError(e.message)}finally{setBusy('')}
 }
 async function submit(){
  setBusy('submit');setError('');setMessage('');
  try{
   const r=await fetch('/api/employee-onboarding/documents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit',caseId})}),b=await r.json();
   if(!r.ok)throw Error(b.error+(b.missing?' — '+b.missing.join(', '):''));
   setMessage('Your documents have been submitted. HR will review them and may request corrections.');
   await load();
  }catch(e:any){setError(e.message)}finally{setBusy('')}
 }
 const open=['In progress','Corrections requested'].includes(status);
 return <section style={{marginTop:25,borderTop:'1px solid #dae5ee',paddingTop:18}}>
  <h3>Your secure document checklist</h3>
  <p style={{fontSize:14,color:'#546f83'}}>Complete the official forms, then upload the signed documents privately. Your information is encrypted before storage. Never email tax forms, identity records or bank details.</p>
  {error&&<p role="alert" style={{color:'#a43a38'}}>{error}</p>}
  {message&&<p role="status" style={{color:'#187c69'}}>{message}</p>}
  <div style={{display:'grid',gap:10}}>
   {forms.map(f=>{
    const done=docs.find(d=>d.formName===f.id);
    const optional=(f.id==='nc4'&&docs.some(d=>d.formName==='nc4-ez'))||(f.id==='nc4-ez'&&docs.some(d=>d.formName==='nc4'));
    return <div key={f.id} style={{border:'1px solid #d7e4ee',borderRadius:12,padding:15,display:'grid',gap:8}}>
     <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><strong>{f.label}</strong><small style={{color:done?.verifiedAt?'#187c69':'#54738b'}}>{done?.verifiedAt?'HR verified':done?'Uploaded · review pending':optional?'Alternative satisfied':'Not uploaded'}</small></div>
     {done&&<a href={'/api/employee-onboarding/documents?caseId='+encodeURIComponent(caseId)+'&documentId='+encodeURIComponent(done.id)} target="_blank" rel="noopener noreferrer">Download your submitted copy (v{done.version})</a>}
     {done?.verificationNote?.startsWith('Correction:')&&<p style={{color:'#943b3b'}}>{done.verificationNote}</p>}
     {open&&!done?.verifiedAt&&<label style={{fontSize:13}}>Upload completed file (PDF, JPG or PNG, maximum 8 MB)
      <input type="file" accept="application/pdf,image/jpeg,image/png" disabled={!!busy} onChange={e=>{const file=e.target.files?.[0]||null;void upload(f.id,file);e.currentTarget.value='';}} style={{display:'block',marginTop:8,maxWidth:'100%'}}/>
     </label>}
    </div>
   })}
  </div>
  {open&&<div style={{marginTop:18}}><p style={{fontSize:13}}>Missing for submission: {missing.length?missing.join(', '):'None'}. The employer must still verify I-9 Section 2.</p><button type="button" disabled={!!busy||missing.length>0} onClick={()=>void submit()} style={{border:0,background:'#176fa8',color:'white',padding:'12px 18px',borderRadius:10,cursor:'pointer'}}>Submit packet for HR review</button></div>}
 </section>;
}
