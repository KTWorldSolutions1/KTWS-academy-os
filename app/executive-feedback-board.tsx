'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {MessageSquarePlus,Download,CheckCircle2} from 'lucide-react';
import {DEMO_SCENES} from '../lib/presentation-demo';
import {REVIEW_TYPES,REVIEW_PRIORITIES,REVIEW_STATUSES,exportReviewCsv,type OwnerReview,type ReviewPriority,type ReviewType,type ReviewStatus,chapterDetail} from '../lib/owner-demo-review';
export default function ExecutiveFeedbackBoard({chapter,onClose}:{chapter:string;onClose:()=>void}){
 const [items,setItems]=useState<OwnerReview[]>([]),[canManage,setCanManage]=useState(false),[comment,setComment]=useState(''),[priority,setPriority]=useState<ReviewPriority>('Important after pilot'),[kind,setKind]=useState<ReviewType>('Missing feature'),[selected,setSelected]=useState(chapter),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
 useEffect(()=>setSelected(chapter),[chapter]);
 const load=useCallback(async()=>{
  setLoading(true);try{const res=await fetch('/api/demo-feedback',{cache:'no-store'}),j=await res.json();if(!res.ok)throw Error(j.error||'Review board not available');setItems(j.reviews||[]);setCanManage(!!j.canManage);setError('');}
  catch(e:any){setError(e.message||'Review board unavailable');}finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load()},[load]);
 const active=items.filter(item=>item.status!=='Resolved'&&item.status!=='Deferred');
 const launchBlockers=active.filter(x=>x.priority==='Must have before launch');
 const selection=items.filter(x=>x.chapter===selected);
 async function save(){
  if(saving||comment.trim().length<12)return;setSaving(true);setError('');setNote('');
  try{const response=await fetch('/api/demo-feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',chapter:selected,type:kind,priority,comment:comment.trim()})});const j=await response.json();if(!response.ok)throw Error(j.error||'Feedback was not saved');setComment('');await load();setNote('Feedback saved for leadership review. No student data was changed.');}
  catch(e:any){setError(e.message||'Feedback could not be saved');}finally{setSaving(false);}
 }
 async function decide(id:string,status:ReviewStatus){
  setSaving(true);setError('');setNote('');
  try{const response=await fetch('/api/demo-feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status',id,status})});const j=await response.json();if(!response.ok)throw Error(j.error||'Decision was not saved');await load();setNote('Leadership review status updated.');}
  catch(e:any){setError(e.message||'Could not update review');}finally{setSaving(false);}
 }
 function download(){
  const content=exportReviewCsv(items);
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='AcademyOS_Executive_Review_Feedback.csv';link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1500);
 }
 return <section className="panel" aria-label="Executive demo feedback and launch decisions" style={{maxHeight:'55vh',overflowY:'auto',border:'1px solid #3f6f93',margin:12,padding:16}}>
  <div className="sectionhead"><div><p className="eyebrow">LEADERSHIP REVIEW • PERMANENT FEEDBACK</p><h3>Owner Feedback & Launch Decisions</h3><p className="muted">Capture what Alisha wants changed, what's missing and what must be ready before transition. Entries save to Academy OS—not to fictional student records.</p></div><button type="button" onClick={onClose}>Close review</button></div>
  <div className="formgrid"><div className="panel"><strong>{items.length}</strong><p className="muted">Total comments</p></div><div className="panel"><strong>{launchBlockers.length}</strong><p className="muted">Open launch blockers</p></div><div className="panel"><strong>{items.filter(x=>x.status==='Accepted').length}</strong><p className="muted">Accepted priorities</p></div></div>
  {error&&<p className="error" role="alert">{error}</p>}{note&&<p className="notice" role="status">{note}</p>}
  <div className="formgrid"><label>Chapter being reviewed<select value={selected} onChange={e=>setSelected(e.target.value)}>{DEMO_SCENES.map((s,i)=><option key={s.id} value={s.id}>{String(i+1).padStart(2,'0')} · {s.title}</option>)}</select></label>
  <label>What type of feedback?<select value={kind} onChange={e=>setKind(e.target.value as ReviewType)}>{REVIEW_TYPES.map(x=><option key={x}>{x}</option>)}</select></label>
  <label>Priority for transition<select value={priority} onChange={e=>setPriority(e.target.value as ReviewPriority)}>{REVIEW_PRIORITIES.map(x=><option key={x}>{x}</option>)}</select></label></div>
  <p className="muted"><strong>Question for leadership:</strong> {chapterDetail(selected).question}</p>
  <label>What should be added, fixed or reconsidered?<textarea rows={4} maxLength={1500} placeholder="Example: Campus managers need a weekly view of unresolved student paperwork before class starts." value={comment} onChange={e=>setComment(e.target.value)} /></label>
  <div className="reportactions"><button type="button" className="primary" disabled={saving||comment.trim().length<12} onClick={save}><MessageSquarePlus size={16}/> Save review feedback</button><button type="button" disabled={loading} onClick={()=>void load()}>Refresh</button><button type="button" disabled={!items.length} onClick={download}><Download size={16}/> Export owner review</button></div>
  <h4>Saved feedback for this chapter ({selection.length})</h4>
  {!selection.length&&<p className="muted">Nothing recorded yet. Alisha can add requirements without stopping the rest of the presentation.</p>}
  {selection.map(x=><div className="panel" key={x.id} style={{padding:12,marginTop:8}}>
   <div className="reportactions"><strong>{x.type}</strong><span>{x.priority} · {x.status}</span></div>
   <p style={{whiteSpace:'pre-wrap'}}>{x.comment}</p><p className="muted">By {x.reviewer} · {new Date(x.created_at).toLocaleDateString()}</p>
   {canManage&&<div className="reportactions"><label>Leadership decision<select value={x.status} disabled={saving} onChange={e=>void decide(x.id,e.target.value as ReviewStatus)}>{REVIEW_STATUSES.map(s=><option key={s}>{s}</option>)}</select></label></div>}
  </div>)}
  {launchBlockers.length>0&&<><h4>Current go-live blockers ({launchBlockers.length})</h4>{launchBlockers.slice(0,8).map(x=><p key={x.id} className="muted"><CheckCircle2 size={14}/> {DEMO_SCENES.find(s=>s.id===x.chapter)?.feature}: {x.comment.slice(0,180)}</p>)}</>}
 </section>;
}
