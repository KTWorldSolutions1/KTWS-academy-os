import {useEffect,useState} from 'react';
import {ArrowLeft,RefreshCcw,ShieldCheck,UserPlus,ClipboardList} from 'lucide-react';
type Case={id:string;campusId:string;name:string;email:string;jobTitle:string;startDate:string;status:string;createdAt:string;};
type Campus={id:string;name:string;status:string;};
export default function EmployeeOnboardingCases({role}:{role:string}){
 const [cases,setCases]=useState<Case[]>([]),[campuses,setCampuses]=useState<Campus[]>([]);
 const [form,setForm]=useState({name:'',email:'',phone:'',jobTitle:'',campusId:'',startDate:'',offerAccepted:false});
 const [loading,setLoading]=useState(true),[working,setWorking]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function load(){
  setLoading(true);setError('');
  try{
   const [a,b]=await Promise.all([fetch('/api/employee-onboarding',{cache:'no-store'}),fetch('/api/records',{cache:'no-store'})]);
   const data=await a.json();if(!a.ok)throw Error(data.error||'Unable to load onboarding cases.');
   setCases(data.cases||[]);
   if(b.ok){const d=await b.json();setCampuses((d.records||[]).filter((x:any)=>x.kind==='campuses'&&x.status==='Active').map((x:any)=>({id:x.id,name:x.name,status:x.status}))); }
  }catch(e:any){setError(e.message)}finally{setLoading(false)}
 }
 useEffect(()=>{void load()},[]);
 async function submit(e:React.FormEvent){e.preventDefault();setWorking(true);setMessage('');setError('');
 try{
  const r=await fetch('/api/employee-onboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',...form,acceptedOfferAt:new Date().toISOString()})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to open case');
  setMessage('Hiring case created. Confidential employee invitations and forms remain locked until verified release acceptance.');
  setForm({name:'',email:'',phone:'',jobTitle:'',campusId:form.campusId,startDate:'',offerAccepted:false});await load();
 }catch(e:any){setError(e.message)}finally{setWorking(false)}
 }
 const mayCreate=['Owner','Regional admin','Campus manager'].includes(role);
 return <main style={{minHeight:'100vh',padding:'clamp(16px,3vw,38px)',fontFamily:'Inter,system-ui,sans-serif',background:'#eef3f8',color:'#19354b'}}>
 <div style={{maxWidth:1150,margin:'0 auto'}}>
 <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:15,flexWrap:'wrap'}}>
 <div><small style={{color:'#3177a5',letterSpacing:2,fontWeight:700}}>LONE STAR · EMPLOYEE OPERATIONS</small><h1 style={{margin:'6px 0'}}>Employee Onboarding Center</h1><p>Accepted offers, campus ownership and accountable next steps.</p></div>
 <div style={{display:'flex',gap:8}}><button onClick={()=>location.assign('/')} style={button}><ArrowLeft size={17}/> Academy OS</button><button onClick={()=>void load()} style={button}><RefreshCcw size={17}/> Refresh</button></div>
 </header>
 <div style={{background:'#e2eff8',border:'1px solid #b6cfe0',borderRadius:12,padding:16,margin:'16px 0'}} role="note"><strong>Secure launch in stages:</strong> This screen records non-financial hiring-case details only. Email/SMS invitations, employee tax/bank/I-9 forms, digital signatures, payroll activation and confidential PDF exports are not yet enabled. Do not paste identity numbers or bank details into the fields.</div>
 {message&&<p role="status" style={{color:'#18715e'}}>{message}</p>}
 {error&&<p role="alert" style={{color:'#a62c36'}}>{error}</p>}
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:16,alignItems:'start'}}>
 {mayCreate&&<section style={panel}><h2 style={{display:'flex',alignItems:'center',gap:10}}><UserPlus size={22}/> Open a hiring case</h2><p style={{fontSize:14,color:'#536b7e'}}>Only after the candidate officially accepts the offer. This is not the employment application.</p>
 <form onSubmit={submit} style={{display:'grid',gap:12}}>
 <label style={field}>Employee name<input required minLength={2} maxLength={120} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={input}/></label>
 <label style={field}>Employee email<input required type="email" maxLength={254} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={input}/></label>
 <label style={field}>Telephone (optional)<input maxLength={40} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={input}/></label>
 <label style={field}>Position<input required minLength={2} maxLength={160} value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})} style={input}/></label>
 <label style={field}>Campus<select required style={input} value={form.campusId} onChange={e=>setForm({...form,campusId:e.target.value})}><option value="">Select an authorized campus</option>{campuses.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
 <label style={field}>Expected start date<input required type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} style={input}/></label>
 <label style={{display:'flex',gap:9,alignItems:'flex-start',fontSize:14}}><input type="checkbox" required checked={form.offerAccepted} onChange={e=>setForm({...form,offerAccepted:e.target.checked})}/> I confirm the candidate has officially accepted the employment offer.</label>
 <button type="submit" disabled={working||!campuses.length} style={{...button,background:'#176fa8',color:'#fff'}}>{working?'Saving…':'Create case'}</button>
 </form></section>}
 <section style={panel}><h2 style={{display:'flex',alignItems:'center',gap:10}}><ClipboardList size={22}/> Active onboarding queue</h2>
 {loading?<p>Loading authorized hiring cases…</p>:cases.length===0?<p>No hiring cases available for your campus.</p>:<div style={{display:'grid',gap:10}}>{cases.map(c=><article key={c.id} style={{padding:14,border:'1px solid #d6e3eb',borderRadius:12}}><strong>{c.name}</strong><p style={{margin:'6px 0',fontSize:14}}>{c.jobTitle} · {campuses.find(x=>x.id===c.campusId)?.name||c.campusId}</p><p style={{margin:'4px 0',fontSize:13,color:'#567083'}}>Start {c.startDate} · {c.email}</p><span style={{fontSize:13,fontWeight:700,color:'#3177a5'}}>{c.status}</span></article>)}</div>}
 <div style={{display:'flex',alignItems:'start',gap:10,marginTop:20,padding:12,background:'#f2f7fb',borderRadius:12,fontSize:13}}><ShieldCheck size={21}/> Manager approval and privacy isolation rules apply. Completion of this queue does not activate an employee or satisfy I-9 verification.</div>
 <button type="button" onClick={()=>location.assign('/onboarding-demo')} style={{...button,marginTop:16}}>Open interactive onboarding demonstration</button>
 </section></div></div></main>;
}
const panel:React.CSSProperties={background:'#fff',border:'1px solid #dce6ed',borderRadius:16,padding:22,boxShadow:'0 3px 18px rgba(20,50,80,.05)'};
const field:React.CSSProperties={display:'grid',gap:6,fontSize:14,fontWeight:600};
const input:React.CSSProperties={border:'1px solid #b9cddb',padding:12,borderRadius:10,font:'inherit',width:'100%',boxSizing:'border-box'};
const button:React.CSSProperties={display:'inline-flex',alignItems:'center',gap:8,padding:'11px 15px',fontWeight:700,border:'1px solid #cbdde9',background:'white',color:'#1f4f70',borderRadius:10,cursor:'pointer'};
