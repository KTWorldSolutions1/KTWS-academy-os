'use client';
import {useState} from 'react';
import {BookOpen,CheckCircle2,ClipboardCheck,History,Plus,ShieldCheck} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {activeSessions,today} from '../lib/training';
import {activeLessonCheckoffs,lessonProgress,lessonPhases,validateLessonRecord} from '../lib/lesson-checkoffs';
type Props={records:R[];role:string;busy:boolean;demo:boolean;saveMany:(records:R[])=>Promise<boolean>};
type EvidenceChoice={type:string;id:string;label:string;date?:string};
function evidenceOptions(s:R,phase:string):EvidenceChoice[]{
 const attendance=activeSessions(s).filter(e=>e.phase===phase&&Number(e.hours)>0&&['Present','Late','Left early'].includes(e.attendance)&&e.instructor).map(e=>({type:'Daily attendance',id:e.id,label:e.date+' · '+e.hours+' hrs attendance',date:e.date}));
 const skills=(s.evaluations||[]).filter((e:any)=>e.phase===phase).map((e:any)=>({type:'Skill evaluation',id:e.id,label:(e.date||'Recorded')+' · '+e.skill+' · '+e.level,date:e.date}));
 const exams=phase==='Classroom'?(s.assessments||[]).map((e:any)=>({type:'Assessment',id:e.id,label:(e.date||'Recorded')+' · '+e.type+' · '+e.score+'%',date:e.date})):[];
 return [...attendance,...skills,...exams].filter(e=>e.id);
}
export default function LessonCheckoffs({records,role,busy,demo,saveMany}:Props){
 const manager=['Owner','Campus manager'].includes(role);
 const [campusId,setCampusId]=useState(''),[studentId,setStudentId]=useState(''),[mode,setMode]=useState<'students'|'lessons'>('students'),[newUnit,setNewUnit]=useState<R|null>(null),[feedback,setFeedback]=useState(''),[message,setMessage]=useState(''),[draft,setDraft]=useState<any>(null);
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const campus=campuses.find(c=>c.id===campusId)||campuses[0];
 const students=records.filter(x=>x.kind==='students'&&x.campusId===campus?.id&&!['Withdrawn'].includes(x.status));
 const student=students.find(x=>x.id===studentId)||students[0];
 const units=records.filter(x=>x.kind==='curriculum-units'&&x.campusId===campus?.id).sort((a,b)=>Number(a.sequence)-Number(b.sequence)||a.name.localeCompare(b.name));
 const eligible=units.filter(x=>x.status==='Approved'&&x.program===student?.program);
 const progress=student?lessonProgress(records,student):[];
 const total=progress.length,done=progress.filter(x=>x.status==='Completed').length;
 async function persist(row:R,success:string){
  setFeedback('');setMessage('');
  if(demo){setFeedback('This is practice mode. Return to your saved school before recording lessons.');return;}
  const problem=validateLessonRecord(row);
  if(problem){setFeedback(problem);return;}
  const ok=await saveMany([row]);if(ok){setDraft(null);setNewUnit(null);setMessage(success);}
  else setFeedback('Could not save the lesson. Review the school message for the exact reason; the entry remains here.');
 }
 function openCheckoff(unit:R){
  if(!student)return;
  const options=evidenceOptions(student,unit.phase);
  setDraft({id:crypto.randomUUID(),kind:'unit-evidence',name:student.name+' — '+unit.name,status:'Needs practice',studentId:student.id,campusId:student.campusId,unitId:unit.id,date:today(),sourceType:options[0]?.type||'Daily attendance',sourceId:options[0]?.id||'',notes:''});
  setFeedback('');setMessage('');
 }
 const draftUnit=units.find(x=>x.id===draft?.unitId);
 const availableSources=draft&&student?evidenceOptions(student,draftUnit?.phase||'Classroom'):[];
 function changeSource(key:string){const opt=availableSources.find(x=>x.id===key);if(opt)setDraft((v:any)=>({...v,sourceId:key,sourceType:opt.type,date:opt.date||today()}));}
 function addUnit(){if(!campus)return;setMode('lessons');setNewUnit({id:crypto.randomUUID(),kind:'curriculum-units',status:'Draft',name:'',campusId:campus.id,program:student?.program||'Class A',phase:'Classroom',code:'',version:1,sequence:units.length+1,objective:'',notes:''});setFeedback('');}
 return <div className="lesson-checkoffs">
 <section className="panel">
  <div className="sectionhead"><div><p className="eyebrow">CDL LESSON TRACKER</p><h2>Lessons & Student Checkoffs</h2><p className="muted">Create your own school-approved lesson list, then record how each student did using an actual instructor entry. Nothing here adds driving hours or submits to FMCSA.</p></div><BookOpen size={27}/></div>
  <div className="formgrid"><label>Campus<select value={campus?.id||''} onChange={e=>{setCampusId(e.target.value);setStudentId('');setDraft(null);setNewUnit(null);}}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Student<select value={student?.id||''} onChange={e=>{setStudentId(e.target.value);setDraft(null);}}>{!students.length&&<option value="">Add students to this campus first</option>}{students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.program||'Program pending'}</option>)}</select></label></div>
  <div className="subtabs" role="group" aria-label="Lesson tracker pages"><button type="button" className={mode==='students'?'active':''} onClick={()=>{setMode('students');setNewUnit(null);}}>Student progress</button><button type="button" className={mode==='lessons'?'active':''} onClick={()=>{setMode('lessons');setDraft(null);}}>Lesson list</button></div>
 </section>
 {mode==='students'&&<section className="panel">
  <div className="sectionhead"><div><h2>{student?.name||'Select a student'}</h2><p className="muted">{student?.program||'Training program not recorded'} · {done} of {total} school-approved lessons checked off</p></div><ClipboardCheck size={25}/></div>
  {!total&&<p className="muted">No approved lessons match this student's campus and program. A manager can open Lesson list and create the school's approved curriculum.</p>}
  {progress.map(p=>{const unit=units.find(x=>x.id===p.unitId)!;const history=student?activeLessonCheckoffs(records,student.id,p.unitId):[];return <div className="lesson-progress-row" key={p.unitId}><span className={'lesson-marker '+(p.status==='Completed'?'done':p.status==='Needs review'?'attention':'')}><CheckCircle2 size={19}/></span><div><b>{p.name}</b><small>{p.phase} · Lesson {p.sequence} · Version {p.version}</small><small>{p.status}{p.completedOn?' · Recorded '+p.completedOn:''}</small>{history.length>0&&<small>{history.length} active instructor review(s) · Original and corrected checkoffs are retained in school history</small>}</div><button type="button" disabled={busy||!student} onClick={()=>openCheckoff(unit)}>Check student</button></div>})}
 </section>}
 {mode==='lessons'&&<section className="panel">
  <div className="sectionhead"><div><h2>School lesson list</h2><p className="muted">Each campus approves its own version. Approved lessons cannot be silently rewritten.</p></div>{manager&&<button className="primary" disabled={!campus} onClick={addUnit}><Plus size={17}/> Add lesson</button>}</div>
  {units.map(u=><div className="lesson-progress-row" key={u.id}><span className={'lesson-marker '+(u.status==='Approved'?'done':'')}><BookOpen size={18}/></span><div><b>{u.name}</b><small>{u.program} · {u.phase} · {u.code} v{u.version}</small><small>{u.status}{u.approvedBy?' · Approved by '+u.approvedBy:''}</small><small>{u.objective}</small></div>{manager&&u.status==='Draft'&&<button onClick={()=>setNewUnit({...u})}>Edit</button>}{manager&&u.status==='Approved'&&<button disabled={busy} onClick={()=>persist({...u,status:'Retired'},'The old approved lesson was retired and preserved. Create a new version to replace it.')}>Retire</button>}</div>)}
  {!units.length&&<p className="muted">No school lessons have been entered. A campus manager can add the first classroom, yard, or road lesson.</p>}
 </section>}
 {newUnit&&manager&&<section className="panel lesson-editor"><h2>{newUnit.revision?'Edit lesson':'Add a lesson'}</h2><div className="formgrid"><label>Lesson name<input maxLength={200} value={newUnit.name||''} onChange={e=>setNewUnit({...newUnit,name:e.target.value})}/></label><label>Program<input maxLength={120} value={newUnit.program||''} onChange={e=>setNewUnit({...newUnit,program:e.target.value})}/></label><label>Training area<select value={newUnit.phase} onChange={e=>setNewUnit({...newUnit,phase:e.target.value})}>{lessonPhases.map(x=><option key={x}>{x}</option>)}</select></label><label>Lesson code<input maxLength={30} placeholder="e.g. CDL-A-YARD-01" value={newUnit.code||''} onChange={e=>setNewUnit({...newUnit,code:e.target.value})}/></label><label>Version<input type="number" min="1" max="99" value={newUnit.version||1} onChange={e=>setNewUnit({...newUnit,version:Number(e.target.value)})}/></label><label>Lesson order<input type="number" min="1" max="9999" value={newUnit.sequence||1} onChange={e=>setNewUnit({...newUnit,sequence:Number(e.target.value)})}/></label></div><label>What should the student learn?<textarea minLength={12} maxLength={2000} rows={3} value={newUnit.objective||''} onChange={e=>setNewUnit({...newUnit,objective:e.target.value})}/></label><label>Instructor guidance (optional)<textarea maxLength={3000} rows={2} value={newUnit.notes||''} onChange={e=>setNewUnit({...newUnit,notes:e.target.value})}/></label><div className="formactions"><button disabled={busy} onClick={()=>persist({...newUnit,status:'Draft'},'Lesson draft saved; it will not appear as required student progress until approved.')}>Save draft</button><button className="primary" disabled={busy} onClick={()=>persist({...newUnit,status:'Approved'},'Lesson approved for this campus. Instructor checkoffs can now be recorded.')}>Approve lesson</button><button onClick={()=>setNewUnit(null)}>Cancel</button></div><p className="footnote">Do not claim an FMCSA curriculum approval without reviewing the actual current federal and state requirements. To change an approved version, retire it and issue a new version.</p></section>}
 {draft&&student&&<section className="panel lesson-editor"><h2>Check student progress</h2><p className="muted">{student.name} · {draftUnit?.name||'Select lesson'}. Choose real existing attendance, skill evaluation or assessment evidence first.</p><div className="formgrid"><label>Lesson<select value={draft.unitId} onChange={e=>{const unit=eligible.find(x=>x.id===e.target.value);if(unit){const options=evidenceOptions(student,unit.phase);setDraft({...draft,unitId:unit.id,name:student.name+' — '+unit.name,sourceType:options[0]?.type||'Daily attendance',sourceId:options[0]?.id||''});}}}>{eligible.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Instructor evidence<select value={draft.sourceId||''} onChange={e=>changeSource(e.target.value)}><option value="">Choose an existing training entry</option>{availableSources.map(x=><option key={x.type+x.id} value={x.id}>{x.label} ({x.type})</option>)}</select></label><label>Result<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option>Needs practice</option><option>Completed</option></select></label><label>Date reviewed<input type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></label></div><label>What did the student demonstrate?<textarea rows={3} maxLength={3000} placeholder="Describe what you saw, the progress made, and what to practice next." value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label><div className="formactions"><button className="primary" disabled={busy||!draft.sourceId} onClick={()=>persist(draft,'Lesson checkoff saved with the current employee, date and supporting school record. No hours were added.')}>Save checkoff</button><button disabled={busy} onClick={()=>setDraft(null)}>Cancel</button></div><p className="footnote">Saved checkoffs are permanent. To correct one, a manager must record a new linked correction. A skill marked complete requires an already signed Proficient evaluation; a passing classroom exam must meet the school's 80% rule.</p></section>}
 {feedback&&<p className="error" role="alert">{feedback}</p>}{message&&<p className="notice" role="status">{message}</p>}
 </div>;
}
