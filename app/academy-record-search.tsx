'use client';
import {useState} from 'react';
type Source={citation:string;id:string;kind:string;name:string;status:string};
const suggestions=['Which students need a permit-record review?','Which TPR records are pending confirmation?','Which trucks are listed?','Which admissions leads need attention?','Which instructor credentials are expiring?'];
export default function AcademyRecordSearch({onNavigate}:{onNavigate:(page:string,id?:string)=>void}){
 const [q,setQ]=useState(''),[ai,setAi]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<{answer:string;mode:string;sources:Source[];evidenceMetadataSentToAI:boolean}|null>(null);
 async function ask(text=q){setBusy(true);setError('');setResult(null);
  try{const r=await fetch('/api/academy-search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:text,ai})}),j=await r.json();
   if(!r.ok)throw Error(j.error||'Search unavailable');setResult(j);
  }catch(e:any){setError(e.message||'School search unavailable');}finally{setBusy(false);}
 }
 return <section className="panel" aria-label="Evidence-grounded school search">
  <h3>Ask Academy OS · Verified School Records</h3>
  <p className="muted">Answers come from permitted school records only. References open the actual source. Generative synthesis is optional and receives only anonymized categories, states and evidence labels—not names, permit numbers, birthdates, notes or documents.</p>
  <div className="reportactions">{suggestions.map(s=><button type="button" key={s} onClick={()=>{setQ(s);void ask(s)}} disabled={busy}>{s}</button>)}</div>
  <label>Question <input value={q} onChange={e=>setQ(e.target.value)} maxLength={300} placeholder="Ask about student milestones, permits, vehicles or TPR"/></label>
  <label><input type="checkbox" checked={ai} onChange={e=>setAi(e.target.checked)}/> Use optional anonymized AI synthesis (sends limited metadata to configured provider)</label>
  <button className="primary" type="button" disabled={busy||q.trim().length<4} onClick={()=>ask()}>{busy?'Searching…':'Search authorized school records'}</button>
  {error&&<p className="error" role="alert">{error}</p>}
  {result&&<><p className="notice" role="status"><strong>{result.mode}</strong> · {result.answer}</p>
   <p className="muted">{result.evidenceMetadataSentToAI?'Limited categorized evidence metadata was sent to the configured AI provider; it excludes identities and free-text record fields.':'No evidence metadata was sent to an external AI provider.'}</p>
   <h4>Evidence links ({result.sources.length})</h4>
   {result.sources.map(s=><div key={s.citation} className="reportactions"><span><strong>[{s.citation}] {s.name}</strong> · {s.kind} · {s.status}</span><button type="button" onClick={()=>onNavigate(s.kind==='students'?'students':s.kind==='leads'?'leads':s.kind==='fleet'?'fleet':s.kind==='staff-credentials'?'credentials':s.kind==='training-assignments'?'dispatch':s.kind==='tpr'?'tpr':'tasks',s.id)}>Open record</button></div>)}
  </>}
 </section>;
}
