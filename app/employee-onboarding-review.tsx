import {useEffect,useState} from 'react';
type Document={id:string;formName:string;group:string;version:number;verifiedAt:string|null;verificationNote:string};
export default function EmployeeOnboardingReview({caseId,role,status,onChange}:{caseId:string;role:string;status:string;onChange:()=>void}){
 const [docs,setDocs]=useState<Document[]>([]),[expanded,setExpanded]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const [hrEmail,setHrEmail]=useState(''),[grantGroup,setGrantGroup]=useState<'payroll'|'eligibility'>('payroll');
 async function load(){
  const r=await fetch('/api/employee-onboarding/documents?caseId='+encodeURIComponent(caseId),{cache:'no-store'}),b=await r.json();
  if(!r.ok)throw Error(b.error||'Unable to open restricted records');
  setDocs(b.documents||[]);
 }
 useEffect(()=>{if(expanded)void load().catch((e:any)=>setError(e.message))},[caseId,expanded]);
 async function action(payload:any){
  setBusy(true);setError('');setMessage('');
  try{
   const r=await fetch('/api/employee-onboarding/documents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId,...payload})}),b=await r.json();
   if(!r.ok)throw Error((b.error||'Action unavailable')+(b.missing?' — '+b.missing.join(', '):'')+(b.unverified?' — '+b.unverified.join(', '):''));
   setMessage('Onboarding record updated and audited.');await load();onChange();
  }catch(e:any){setError(e.message)}finally{setBusy(false)}
 }
 async function uploadI9(file:File|null){
  if(!file)return;setBusy(true);setError('');setMessage('');
  const data=new FormData();data.set('caseId',caseId);data.set('formName','i9-section-2');data.set('file',file);
  try{const r=await fetch('/api/employee-onboarding/documents',{method:'POST',body:data}),b=await r.json();if(!r.ok)throw Error(b.error||'Upload failed');setMessage('Employer I-9 Section 2 saved securely. Authorized HR must verify it.');await load();onChange();}catch(e:any){setError(e.message)}finally{setBusy(false)}
 }
 return <div style={{marginTop:12}}>
 <button type="button" onClick={()=>setExpanded(x=>!x)} style={button}>{expanded?'Close HR review':'Open HR verification and approval'}</button>
 {expanded&&<div style={{borderTop:'1px solid #d4e2eb',marginTop:14,paddingTop:14,display:'grid',gap:12}}>
 {error&&<p role="alert" style={{color:'#a52f38'}}>{error}</p>}
 {message&&<p role="status" style={{color:'#18755f'}}>{message}</p>}
 <p style={{fontSize:13,color:'#54718a'}}>Only authorized HR personnel can open tax, bank and identity documents. Campus managers may review the personnel checklist without automatically receiving access to those files.</p>
 {role==='Owner'&&<form onSubmit={e=>{e.preventDefault();void action({action:'grant',email:hrEmail,group:grantGroup,enabled:true})}} style={{background:'#f2f7fb',padding:12,borderRadius:10,display:'grid',gap:8}}>
  <strong>Owner-controlled restricted HR access</strong>
  <input type="email" placeholder="Authorized HR employee email" required value={hrEmail} onChange={e=>setHrEmail(e.target.value)} style={input}/>
  <select value={grantGroup} onChange={e=>setGrantGroup(e.target.value as any)} style={input}><option value="payroll">Payroll and tax forms</option><option value="eligibility">I-9 and identity records</option></select>
  <div style={{display:'flex',gap:8}}><button type="submit" disabled={busy} style={button}>Grant explicit access</button><button type="button" disabled={busy} onClick={()=>void action({action:'grant',email:hrEmail,group:grantGroup,enabled:false})} style={button}>Revoke access</button></div>
 </form>}
 <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(['personnel','payroll','eligibility'] as const).map(group=><a key={group} target="_blank" rel="noopener noreferrer" href={'/api/employee-onboarding/documents?caseId='+caseId+'&printGroup='+group} style={{padding:'9px 12px',background:'#f0f6fa',borderRadius:9,fontSize:13}}>Print {group==='eligibility'?'separate I-9':group} file index</a>)}</div>
 <div style={{display:'grid',gap:8}}>{docs.map(d=><article key={d.id} style={{border:'1px solid #d5e3ed',borderRadius:10,padding:12}}>
  <strong>{d.formName}</strong> <small>({d.group} · v{d.version})</small>
  <p style={{fontSize:12}}>{d.verifiedAt?'HR verified':'Pending HR verification'} {d.verificationNote}</p>
  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
  <a target="_blank" rel="noopener noreferrer" href={'/api/employee-onboarding/documents?caseId='+caseId+'&documentId='+d.id}>Download private original</a>
  {['Employee submitted','HR review','Corrections requested'].includes(status)&&<><button type="button" disabled={busy} onClick={()=>void action({action:'verify',documentId:d.id,confirmedOriginal:true,note:'Original and signature reviewed'})} style={button}>Verify</button>
  <button type="button" disabled={busy} onClick={()=>{const note=window.prompt('Explain required corrections for the employee:');if(note)void action({action:'reject',documentId:d.id,note})}} style={button}>Request correction</button></>}
  </div>
 </article>)}</div>
 {['Employee submitted','HR review'].includes(status)&&<><label style={{fontSize:13}}>Employer I-9 Section 2 (authorized representative only)
 <input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={e=>{const file=e.target.files?.[0]||null;void uploadI9(file);e.currentTarget.value=''}} style={{display:'block',marginTop:8}}/></label>
 <button type="button" disabled={busy} onClick={()=>void action({action:'hr-verified'})} style={button}>Complete HR verification</button></>}
 {status==='HR verified'&&role==='Campus manager'&&<button type="button" disabled={busy} onClick={()=>void action({action:'final-approve'})} style={{...button,background:'#176fa8',color:'white'}}>Final campus-manager approval</button>}
 <p style={{fontSize:12,color:'#627e90'}}>Final approval does not automatically grant Academy OS account or payroll access. Existing owner-controlled staff activation remains separate.</p>
 </div>}
 </div>;
}
const button:React.CSSProperties={border:'1px solid #bad2e2',padding:'9px 12px',borderRadius:9,color:'#204d71',background:'white',fontWeight:600,cursor:'pointer'};
const input:React.CSSProperties={border:'1px solid #b9cddb',padding:11,borderRadius:9,font:'inherit'};
