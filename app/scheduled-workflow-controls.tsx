'use client';
import {useEffect,useState} from 'react';
type Rule={id:string;campus_id:string;kind:string;enabled:number;updated_at:string};
type Run={rule_id:string;scheduled_for:string;created_count:number;completed_at:string};
const labels:{[key:string]:string}={permit:'Missing permit evidence',tpr:'TPR confirmation pending',admissions:'Overdue admissions follow-ups',fleet:'Out-of-service vehicles'};
export default function ScheduledWorkflowControls({campuses}:{campuses:{id:string;name:string}[]}){
 const [rules,setRules]=useState<Rule[]>([]),[runs,setRuns]=useState<Run[]>([]),[campus,setCampus]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const selected=campus||campuses[0]?.id||'';
 async function refresh(){try{const r=await fetch('/api/scheduled-workflows',{cache:'no-store'}),j=await r.json();if(!r.ok)throw Error(j.error||'Scheduled rules unavailable');setRules(j.rules||[]);setRuns(j.runs||[]);setError('');}catch(e:any){setError(e.message);}}
 useEffect(()=>{void refresh();},[]);
 async function setRule(kind:string,enabled:boolean){if(!selected)return;setBusy(true);setError('');setNotice('');try{
  const r=await fetch('/api/scheduled-workflows',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({campusId:selected,kind,enabled})}),j=await r.json();
  if(!r.ok)throw Error(j.error||'Unable to update scheduled review');
  setNotice((enabled?'Enabled':'Disabled')+' daily '+labels[kind]+' review for the selected campus.');await refresh();
 }catch(e:any){setError(e.message);}finally{setBusy(false);}}
 return <section className="panel" aria-label="Scheduled school workflow rules">
  <h3>Scheduled campus follow-up rules</h3>
  <p className="muted">Owner or campus manager opt-in only. Every day the server checks enabled rules and creates an auditable task for new qualifying records. It does not contact students, modify payroll or transmit to FMCSA. Disable a rule at any time.</p>
  {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
  <label>Managed campus <select value={selected} onChange={e=>setCampus(e.target.value)}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  {Object.entries(labels).map(([kind,label])=>{const rule=rules.find(x=>x.kind===kind&&x.campus_id===selected);return <div className="reportactions" key={kind}><span><strong>{label}</strong> · {rule?.enabled?'Daily task automation on':'Off'}</span><button type="button" disabled={busy||!selected} onClick={()=>setRule(kind,!rule?.enabled)}>{rule?.enabled?'Turn off':'Enable'}</button></div>})}
  <h4>Recent scheduled runs</h4>
  {runs.filter(r=>rules.some(x=>x.id===r.rule_id&&x.campus_id===selected)).slice(0,6).map((r,i)=><p className="muted" key={i}>{r.scheduled_for} · {r.created_count} new review tasks · {labels[rules.find(x=>x.id===r.rule_id)?.kind||'']||'Review'}</p>)}
  <button type="button" disabled={busy} onClick={refresh}>Refresh rule status</button>
 </section>;
}
