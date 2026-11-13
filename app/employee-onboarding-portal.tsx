import {useEffect,useState} from 'react';
import {CheckCircle2,FileText,ShieldCheck,Clock,LogOut} from 'lucide-react';
import EmployeeOnboardingDocuments from './employee-onboarding-documents';
type Self={employee:{id:string;name:string;campusId:string;jobTitle:string;startDate:string;status:string};documents:Array<{form_name:string;group_name:string;verified_at:string|null}>;complete:boolean;};
const official=[
 {name:'Federal W-4 (2026)',url:'https://www.irs.gov/pub/irs-pdf/fw4.pdf',help:'Employee withholding certificate'},
 {name:'North Carolina NC-4',url:'https://www.ncdor.gov/taxes-forms/withholding-tax/withholding-tax-forms-and-instructions/nc-4-employees-withholding-allowance-certificate',help:'State withholding certificate'},
 {name:'Employment Eligibility Verification (I-9)',url:'https://www.uscis.gov/i-9',help:'Employee Section 1 only; employer completes Section 2'}
];
export default function EmployeeOnboardingPortal({inviteToken}:{inviteToken:string}){
 const [data,setData]=useState<Self|null>(null),[error,setError]=useState(''),[working,setWorking]=useState(false),[booted,setBooted]=useState(false);
 async function load(){
  try{const r=await fetch('/api/employee-onboarding/portal',{cache:'no-store'});const b=await r.json();if(!r.ok)throw Error(b.error||'Access unavailable');setData(b);setError('');}catch(e:any){setError(e.message);}finally{setBooted(true)}
 }
 useEffect(()=>{if(!inviteToken)void load();else{void (async()=>{setWorking(true);try{const r=await fetch('/api/employee-onboarding/portal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'redeem',token:inviteToken})}),b=await r.json();if(!r.ok)throw Error(b.error||'Invitation not accepted');await load();}catch(e:any){setError(e.message);setBooted(true);}finally{setWorking(false)}})()}},[inviteToken]);
 async function logout(){await fetch('/api/employee-onboarding/portal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});location.assign('/login')}
 return <main style={{minHeight:'100vh',background:'#edf3f8',padding:'clamp(18px,4vw,45px)',fontFamily:'Inter,system-ui,sans-serif',color:'#173751'}}>
 <div style={{maxWidth:880,margin:'0 auto'}}>
 <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:22}}><div><small style={{letterSpacing:2,color:'#3377a9',fontWeight:800}}>LONE STAR · EMPLOYEE EXPERIENCE</small><h1 style={{margin:'8px 0'}}>New Hire Onboarding</h1></div>{data&&<button type="button" onClick={()=>void logout()} style={button}><LogOut size={16}/> Sign out</button>}</header>
 <section style={{background:'#fff',padding:'clamp(18px,4vw,35px)',borderRadius:20,border:'1px solid #d4e2ec',boxShadow:'0 9px 25px #dce7ef'}}>
 {working||!booted?<p role="status">Securing your employee invitation…</p>:error?<><h2>Access needs attention</h2><p role="alert">{error}</p><p>Contact your school hiring manager to issue a fresh private link. Never share an invitation token by text or email replies.</p></>:data?<><span style={{color:'#327baa',fontWeight:700,fontSize:13}}>WELCOME TO LONE STAR</span><h2 style={{fontSize:29,margin:'10px 0'}}>Hello, {data.employee.name}.</h2><p>Your new role is <strong>{data.employee.jobTitle}</strong>. Expected start: <strong>{data.employee.startDate}</strong>.</p>
 <div style={{padding:15,borderRadius:12,background:'#e6f2fa',margin:'20px 0'}}><ShieldCheck size={22}/><p style={{margin:'8px 0'}}>Your private onboarding session is active. This portal separates your information from the general Academy OS employee and student workspace.</p><p style={{margin:0,fontSize:14}}>Official forms must be completed and signed according to the school-approved process; your protected uploads are available only after school security and signature acceptance.</p></div>
 <h3>Documents to prepare</h3>
 <div style={{display:'grid',gap:10}}>{official.map(f=><div key={f.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,padding:15,border:'1px solid #d9e6ee',borderRadius:12}}><div><strong><FileText size={17} style={{verticalAlign:'middle',marginRight:8}}/>{f.name}</strong><p style={{margin:'5px 0',fontSize:13,color:'#587289'}}>{f.help}</p></div><a href={f.url} target="_blank" rel="noopener noreferrer">Official form</a></div>)}</div>
 <div style={{display:'flex',alignItems:'center',gap:10,marginTop:22}}><Clock size={18}/><span>Case status: <strong>{data.employee.status}</strong></span></div>
 <p style={{fontSize:13,color:'#5b7485',lineHeight:1.6}}>Do not send Social Security numbers, banking details or identity documents by ordinary email or text. Form I-9 Section 2 is completed separately by an authorized employer representative.</p>
 <EmployeeOnboardingDocuments caseId={data.employee.id} status={data.employee.status}/>
 </>:null}
 </section></div></main>;
}
const button:React.CSSProperties={border:'1px solid #bad2e2',padding:'11px 14px',borderRadius:10,color:'#204d71',background:'white',display:'inline-flex',alignItems:'center',gap:8,cursor:'pointer'};
