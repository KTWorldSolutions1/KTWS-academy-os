'use client';
import {useState} from 'react';
import {BookOpen,FileText,FolderOpen,Globe2,Megaphone,Plus,Search,ShieldCheck,AlertTriangle,Clock3} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {SCHOOL_LIBRARY_CATEGORIES,SCHOOL_LIBRARY_AUDIENCES,schoolKnowledgeNeedsReview} from '../lib/school-knowledge';
type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(rows:R[])=>Promise<boolean>;onNavigate:(page:string)=>void};
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
const blank=(campusId:string):R=>({id:crypto.randomUUID(),kind:'school-knowledge',name:'',status:'Draft',category:'Policies & procedures',audience:'All staff',campusId,body:'',documentVersion:'1.0',effectiveDate:today(),reviewDate:'',externalUrl:'',ackRequired:false,approvedBy:''});
const isManagement=(role:string)=>['Owner','Regional admin','Campus manager'].includes(role);
export default function SchoolKnowledgeHub({records,role,demo,busy,saveMany,onNavigate}:Props){
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const manage=isManagement(role);
 const [scope,setScope]=useState('All locations'),[category,setCategory]=useState('All categories'),[query,setQuery]=useState(''),[chosen,setChosen]=useState(''),[editor,setEditor]=useState<R|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const all=records.filter(r=>r.kind==='school-knowledge');
 const published=all.filter(r=>r.status==='Published');
 const items=all.filter(r=>(manage||r.status==='Published')&&(scope==='All locations'||r.campusId===scope||r.campusId==='__school__')&&(category==='All categories'||r.category===category)&&((r.name+' '+r.category+' '+r.body).toLowerCase().includes(query.toLowerCase())))
  .sort((a,b)=>Number(a.status==='Published')-Number(b.status==='Published')||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
 const current=all.find(r=>r.id===chosen)||items[0]||null;
 async function save(){
  if(!editor||!manage)return;
  setError('');setNotice('');
  if(demo){setError('Leave sample mode to publish real school guidance.');return;}
  if(editor.body?.length<20){setError('Please add a meaningful procedure or announcement before saving.');return;}
  if(editor.externalUrl&&!/^https:\/\//i.test(editor.externalUrl)){setError('External links must start with https://');return;}
  const old=all.find(r=>r.id===editor.id);
  const changed=!!old&&['body','name','status','documentVersion'].some(k=>old[k]!==editor[k]);
  if(changed&&String(editor.documentVersion)===String(old.documentVersion)){setError('Increase the version number when revising a saved document. Previous versions are retained.');return;}
  const pending={...editor,approvedBy:editor.status==='Published'?'School management approval':editor.approvedBy||''};
  const ok=await saveMany([pending]);
  if(!ok){setError('School did not save the document. Check the red error at the top of Academy OS.');return;}
  setChosen(pending.id);setEditor(null);setNotice('Saved '+pending.name+'. '+(pending.status==='Published'?'Published to its approved staff audience.':'Draft remains management-only.')+' No external file was uploaded.');
 }
 const update=(key:string,value:any)=>setEditor(old=>old?{...old,[key]:value}:old);
 return <div className="school-knowledge-hub">
 <section className="panel"><div className="sectionhead"><div><p className="eyebrow">LONE STAR · SCHOOL KNOWLEDGE & DOCUMENTS</p><h2>School Document Center</h2><p className="muted">One searchable home for approved procedures, manuals, training guides, announcements, templates and SharePoint/OneDrive references. Public staff guidance is separate from protected student documents.</p></div><FolderOpen size={28}/></div>
 <div className="curriculum-metrics"><div><strong>{published.length}</strong><small>Published guidance</small></div><div><strong>{manage?all.filter(x=>x.status==='Draft').length:'—'}</strong><small>Management drafts</small></div><div><strong>{published.filter(x=>schoolKnowledgeNeedsReview(x,today())).length}</strong><small>Review dates reached</small></div></div>
 <p className="notice"><ShieldCheck size={16}/> Policy text and metadata are stored in the school records system with campus and audience permissions. <b>Do not paste student SSNs, licenses, health information, employee records or other protected documents into this library.</b> Signed PDFs and private documents require the separate encrypted vault, which remains disabled until key-recovery and privacy acceptance are complete.</p>
 {manage&&<div className="reportactions"><button className="primary" type="button" onClick={()=>{setError('');setEditor(blank(campuses[0]?.id||'__school__'));}}><Plus size={16}/> New school document or procedure</button><button type="button" onClick={()=>onNavigate('school-notices')}><Megaphone size={16}/> Publish a timed school announcement</button></div>}
 </section>
 <section className="panel"><div className="sectionhead"><div><h3>Browse the library</h3><p className="muted">Filter by category or campus. Only staff permitted to read a document will see its contents.</p></div><Search size={20}/></div>
 <div className="formgrid"><label>Search<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search procedures, policies or forms"/></label>
 <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>All categories</option>{SCHOOL_LIBRARY_CATEGORIES.map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Campus<select value={scope} onChange={e=>setScope(e.target.value)}><option>All locations</option><option value="__school__">Schoolwide</option>{campuses.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label></div>
 <div className="grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
 <div>{items.length?items.map(r=><button type="button" key={r.id} className={'reportrow '+(r.id===current?.id?'selected':'')} style={{width:'100%',textAlign:'left'}} onClick={()=>{setChosen(r.id);setEditor(null);setError('');}}><div><b>{r.name}</b><small>{r.category} · {r.status} · v{r.documentVersion}</small><small>{r.campusId==='__school__'?'Schoolwide':campuses.find(c=>c.id===r.campusId)?.name||'Campus'} · {r.audience}</small></div><FileText size={17}/></button>):<p className="muted">No matching school documents. Management can create an approved procedure or publish a campus notice.</p>}</div>
 <div>{current&&!editor?<div className="panel"><p className="eyebrow">{current.category} · {current.status}</p><h3>{current.name}</h3><p className="muted">Version {current.documentVersion} · Effective {current.effectiveDate||'Not set'} · Review by {current.reviewDate||'Not scheduled'}</p><p className="muted">Audience: {current.audience} · {current.campusId==='__school__'?'All authorized campuses':campuses.find(c=>c.id===current.campusId)?.name||'Assigned campus'}</p>{schoolKnowledgeNeedsReview(current,today())&&<p className="error"><AlertTriangle size={15}/> Review due. School management should confirm this procedure is current.</p>}
 <div style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{current.body}</div>
 {current.externalUrl&&<p><a href={current.externalUrl} target="_blank" rel="noopener noreferrer">Open linked OneDrive / SharePoint resource (external)</a></p>}
 <p className="footnote">{current.ackRequired?'Staff acknowledgment required by school policy; individual acknowledgment collection is not enabled in this release.':'No acknowledgment requirement selected.'}</p>
 {manage&&<div className="reportactions"><button onClick={()=>setEditor({...current})}>Edit / publish a new version</button><button type="button" onClick={()=>setEditor({...current,status:'Archived',documentVersion:String(Number(current.documentVersion||1)+1)})}>Prepare archive revision</button></div>}
 {manage&&Array.isArray(current.history)&&current.history.length>0&&<details><summary>Earlier versions ({current.history.length})</summary>{current.history.slice().reverse().map((h:any,i:number)=><div key={i} className="reportrow"><div><b>Version {h.version} · {h.status}</b><small>Previously saved by {h.updatedBy||'School manager'}</small><p style={{whiteSpace:'pre-wrap'}}>{h.body}</p></div></div>)}</details>}</div>:!editor?<p className="muted">Select a school document to read its approved version.</p>:null}</div>
 </div></section>
 {editor&&manage&&<section className="panel"><div className="sectionhead"><div><p className="eyebrow">MANAGEMENT EDITOR · NO SENSITIVE DATA</p><h3>{all.some(r=>r.id===editor.id)?'Revise existing school document':'Create school guidance'}</h3></div><BookOpen size={22}/></div>
 <div className="formgrid"><label>Title<input value={editor.name} maxLength={160} onChange={e=>update('name',e.target.value)} placeholder="e.g. Classroom attendance and permit process"/></label>
 <label>Category<select value={editor.category} onChange={e=>update('category',e.target.value)}>{SCHOOL_LIBRARY_CATEGORIES.map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Campus<select value={editor.campusId} disabled={all.some(x=>x.id===editor.id)} onChange={e=>update('campusId',e.target.value)}><option value="__school__">Schoolwide guidance</option>{campuses.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
 <label>Who can see it?<select value={editor.audience} onChange={e=>update('audience',e.target.value)}>{SCHOOL_LIBRARY_AUDIENCES.map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Status<select value={editor.status} onChange={e=>update('status',e.target.value)}><option>Draft</option><option>Published</option><option>Archived</option></select></label>
 <label>Version<input value={editor.documentVersion} onChange={e=>update('documentVersion',e.target.value)} placeholder="1.0"/></label>
 <label>Effective date<input type="date" value={editor.effectiveDate||''} onChange={e=>update('effectiveDate',e.target.value)}/></label>
 <label>Next review date<input type="date" value={editor.reviewDate||''} onChange={e=>update('reviewDate',e.target.value)}/></label>
 <label>Linked OneDrive / SharePoint URL (optional)<input value={editor.externalUrl||''} onChange={e=>update('externalUrl',e.target.value)} placeholder="https://..."/></label></div>
 <label className="standalone">Procedure, announcement or document content<textarea rows={10} value={editor.body||''} maxLength={18000} onChange={e=>update('body',e.target.value)} placeholder="Purpose, effective date, responsible roles, exact steps, review and escalation process..."/></label>
 <label className="checkboxlabel"><input type="checkbox" checked={!!editor.ackRequired} onChange={e=>update('ackRequired',e.target.checked)}/> This policy requires staff acknowledgment (tracking must be configured separately)</label>
 <p className="footnote">Published entries are visible to the selected staff audience. External URLs are references, not synced or copied documents. Do not paste private school records into the procedure text.</p>
 {error&&<p role="alert" className="error">{error}</p>}
 <div className="reportactions"><button className="primary" disabled={busy||demo} type="button" onClick={()=>void save()}><ShieldCheck size={16}/> {busy?'Saving…':'Save school document'}</button><button type="button" onClick={()=>{setEditor(null);setError('');}}>Cancel</button></div></section>}
 {notice&&<p className="notice" role="status">{notice}</p>}
 <section className="panel"><h3>Related systems</h3><div className="reportactions"><button onClick={()=>onNavigate('document-center')}><FileText size={16}/> Private student files & enrollment agreements</button><button onClick={()=>onNavigate('school-notices')}><Megaphone size={16}/> Time-sensitive announcements & closures</button><button onClick={()=>onNavigate('integrations')}><Globe2 size={16}/> Microsoft and messaging connection status</button><button onClick={()=>onNavigate('compliance')}><Clock3 size={16}/> Launch privacy and recovery acceptance</button></div></section>
 </div>;
}
