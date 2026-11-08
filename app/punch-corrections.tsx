'use client';
import {useEffect,useState} from 'react';
type Punch={id:string;at:string;action:string;campus_id:string};
type Correction={id:string;punch_id:string;original_at:string;proposed_at:string;reason:string;requested_by:string;requested_at:string;status:string;reviewed_by?:string;proposed_action?:string};
const localInput=(utc:string)=>{const d=new Date(utc);const offset=d.getTimezoneOffset();return new Date(d.getTime()-offset*60000).toISOString().slice(0,16);};
const format=(s:string)=>new Date(s).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'});
export default function PunchCorrections({employeeId,punches,self,campuses,onUpdated}:{employeeId:string;punches:Punch[];self:boolean;campuses:{id:string;name:string}[];onUpdated:()=>void}){
 const [missingAction,setMissingAction]=useState('clock_out'),[missingAt,setMissingAt]=useState(''),[missingCampus,setMissingCampus]=useState(''),[missingReason,setMissingReason]=useState('');
 const [items,setItems]=useState<Correction[]>([]),[canReview,setCanReview]=useState(false),[punch,setPunch]=useState(''),[at,setAt]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){
  try{const r=await fetch('/api/punch-corrections?employee='+encodeURIComponent(employeeId),{cache:'no-store'}),j=await r.json();if(!r.ok)throw Error(j.error||'Unable to retrieve corrections');setItems(j.corrections||[]);setCanReview(!!j.canReview);}
  catch(e:any){setError(e.message);}
 }
 useEffect(()=>{void load();setPunch('');setAt('');setReason('');},[employeeId]);
 function selectPunch(id:string){setPunch(id);const found=punches.find(p=>p.id===id);setAt(found?localInput(found.at):'');}
 async function act(body:unknown){
  setBusy(true);setError('');setNotice('');
  try{const r=await fetch('/api/punch-corrections',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),j=await r.json();if(!r.ok)throw Error(j.error||'Correction unavailable');setNotice('Correction '+j.status.toLowerCase()+'.');await load();onUpdated();}
  catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 return <section className="panel" aria-label="Punch correction requests">
  <h3>Missed punch & time corrections</h3><p className="muted">Original timestamps never change. Submit a reason and corrected time for independent manager review. Approved payroll weeks are locked.</p>
  {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
  {self&&<div className="formgrid"><label>Punch to correct<select value={punch} onChange={e=>selectPunch(e.target.value)}><option value="">Choose a recorded punch</option>{punches.map(p=><option value={p.id} key={p.id}>{p.action.replace('_',' ')} · {format(p.at)}</option>)}</select></label>
   <label>Corrected time (your device's local time zone)<input type="datetime-local" value={at} onChange={e=>setAt(e.target.value)}/></label>
   <label>Why must this punch be corrected?<textarea value={reason} onChange={e=>setReason(e.target.value)} rows={3} maxLength={500}/></label>
   <button type="button" className="primary" disabled={busy||!punch||!at||reason.trim().length<12} onClick={()=>act({action:'request',punchId:punch,proposedAt:new Date(at).toISOString(),reason})}>Request manager correction</button>
  </div>}
  {self&&<div className="formgrid"><h4>Missing an entire clock event?</h4><label>Missing action<select value={missingAction} onChange={e=>setMissingAction(e.target.value)}>{['clock_in','break_start','break_end','clock_out'].map(a=><option key={a} value={a}>{a.replace('_',' ')}</option>)}</select></label>
   <label>Work campus<select value={missingCampus||campuses[0]?.id||''} onChange={e=>setMissingCampus(e.target.value)}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label>Time that the missed event occurred (your local time zone)<input type="datetime-local" value={missingAt} onChange={e=>setMissingAt(e.target.value)}/></label>
   <label>Explanation<textarea value={missingReason} onChange={e=>setMissingReason(e.target.value)} maxLength={500} rows={3}/></label>
   <button type="button" disabled={busy||!missingAt||missingReason.trim().length<12||!campuses.length} onClick={()=>act({action:'request_missing',punchAction:missingAction,campusId:missingCampus||campuses[0]?.id,proposedAt:new Date(missingAt).toISOString(),reason:missingReason})}>Request missing punch</button></div>}
  {items.length>0&&<><h4>Correction history</h4><div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Original</th><th>Requested</th><th>Reason</th><th>Status / reviewer</th><th>Action</th></tr></thead><tbody>{items.map(x=><tr key={x.id}><td>{x.punch_id?format(x.original_at):'Missing event'}</td><td>{x.proposed_action?x.proposed_action.replace('_',' ')+' · ':''}{format(x.proposed_at)}</td><td>{x.reason}</td><td>{x.status}{x.reviewed_by?' · '+x.reviewed_by:''}</td><td>{canReview&&x.status==='Pending'?<div className="reportactions"><button disabled={busy} onClick={()=>act({action:'review',id:x.id,decision:'Approved'})}>Approve</button><button disabled={busy} onClick={()=>act({action:'review',id:x.id,decision:'Rejected'})}>Reject</button></div>:null}</td></tr>)}</tbody></table></div></>}
 </section>;
}
