'use client';
import {useState} from 'react';
import {BookOpen,CalendarDays,CheckCircle2,ClipboardCheck,MapPinned,ShieldAlert} from 'lucide-react';
import type {RecordData} from '../lib/training';
import {CLASS_A_THEORY_TOPICS,CLASSROOM_WEEK_ONE,CLASSROOM_HOURS_TARGET,createClassroomWeekPlans,suggestedClassroomHours,topicsForDay,theoryTopicGaps} from '../lib/classroom-curriculum';

type Props={
 records:RecordData[]; plans:RecordData[]; instructor:string; busy:boolean; readOnly:boolean;
 onSave:(updates:RecordData[])=>Promise<boolean>;
};
export default function ClassroomCurriculum({records,plans,instructor,busy,readOnly,onSave}:Props){
 const [dayNumber,setDayNumber]=useState(1);
 const [campusSelection,setCampusSelection]=useState('');
 const [mappingDraft,setMappingDraft]=useState<Record<string,string>>({});
 const [feedback,setFeedback]=useState('');
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const campus=campuses.find(c=>c.id===campusSelection)||campuses[0];
 const campusPlans=plans.filter(p=>p.campusId===campus?.id&&p.program==='Class A'&&p.curriculumKey);
 const chosen=CLASSROOM_WEEK_ONE.find(d=>d.day===dayNumber)!;
 const savedPlan=campusPlans.find(p=>p.curriculumKey==='class-a-week1-day'+chosen.day);
 const topics=topicsForDay(chosen.day);
 const mapped=CLASS_A_THEORY_TOPICS.filter(t=>{const plan=campusPlans.find(p=>p.curriculumKey==='class-a-week1-day'+t.day);return String(plan?.jjKellerModuleMap?.[t.code]||'').trim().length>0;}).length;
 const plannedDays=CLASSROOM_WEEK_ONE.filter(d=>campusPlans.some(p=>p.curriculumKey==='class-a-week1-day'+d.day)).length;
 const gaps=theoryTopicGaps();
 async function install(){
  setFeedback('');
  if(!campus){setFeedback('Create or select an active campus before saving the plan.');return;}
  try{
   const fresh=createClassroomWeekPlans(plans,campus.id,instructor);
   if(!fresh.length){setFeedback('All five day plans already exist for '+campus.name+'.');return;}
   if(await onSave(fresh))setFeedback('Added '+fresh.length+' draft day plan(s) to Lesson Plans for '+campus.name+'.');
   else setFeedback('Could not save plans. Review the message above.');
  }catch(e){setFeedback(e instanceof Error?e.message:'Could not build plans.');}
 }
 async function saveMapping(){
  if(!savedPlan){setFeedback('Add the draft five-day plan first, then attach your J. J. Keller course identifiers.');return;}
  const entries={...(savedPlan.jjKellerModuleMap||{})};
  for(const topic of topics){if(Object.hasOwn(mappingDraft,topic.code))entries[topic.code]=mappingDraft[topic.code].trim();}
  if(await onSave([{...savedPlan,jjKellerModuleMap:entries,jjKellerMappingVerified:false}])){
   setMappingDraft({});
   setFeedback('J. J. Keller reference entries saved for '+chosen.label+'. School verification is still required.');
  }else setFeedback('Could not save J. J. Keller references.');
 }
 return <section className="classroom-curriculum panel" aria-label="Class A week one classroom guide">
  <div className="sectionhead"><div><p className="eyebrow">LONE STAR • CLASS A THEORY</p><h3>Week 1 classroom teaching guide</h3>
   <p className="muted">All 30 FMCSA standard theory units organized across five days, with J. J. Keller instruction and practical driver-readiness labs. This is an editable <b>proposal</b> until the academy validates its licensed course sequence and instructional timing.</p></div><BookOpen size={25}/></div>
  <div className="curriculum-metrics">
   <div><strong>{CLASS_A_THEORY_TOPICS.length}/30</strong><small>Federal topics in proposed schedule (not yet delivered)</small></div>
   <div><strong>{suggestedClassroomHours()}/{CLASSROOM_HOURS_TARGET}</strong><small>Net classroom hours allocated for planning (not attendance)</small></div>
   <div><strong>{mapped}/30</strong><small>J. J. Keller module references entered</small></div>
   <div><strong>{plannedDays}/5</strong><small>Day plans saved at this campus</small></div>
  </div>
  <p className="notice">Federal theory requires all applicable Appendix A subjects and a minimum 80% theory assessment score. NC's standard commercial truck driving course requires 50 classroom instructional hours including testing. A saved plan or vendor module reference is <b>not</b> evidence of instruction, attendance, a passed assessment, or TPR reporting.</p>
  <div className="formgrid classroom-campus-choice"><label>Plan for campus<select value={campus?.id||''} onChange={e=>{setCampusSelection(e.target.value);setMappingDraft({});setFeedback('');}}>{!campuses.length&&<option value="">No active campus</option>}{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <div className="classroom-plan-action"><button type="button" className="primary" disabled={busy||readOnly||!campus||plannedDays===5} onClick={install}><CalendarDays size={17}/> {plannedDays===5?'Draft plans saved':'Add missing days to Lesson Plans'}</button></div></div>
  {feedback&&<p className="notice" role="status">{feedback}</p>}
  <div className="subtabs classroom-day-tabs" role="group" aria-label="Select classroom day">
   {CLASSROOM_WEEK_ONE.map(d=><button key={d.day} type="button" className={d.day===chosen.day?'active':''} onClick={()=>{setDayNumber(d.day);setMappingDraft({});setFeedback('');}}>Day {d.day} • {d.label}{campusPlans.some(p=>p.curriculumKey==='class-a-week1-day'+d.day)?' ✓':''}</button>)}
  </div>
  <div className="sectionhead"><div><h3>{chosen.label}: {chosen.title}</h3><p className="muted">{chosen.focus}</p></div><span className="badge">{chosen.blocks.reduce((n,b)=>n+b.hours,0)} proposed net hrs</span></div>
  <div className="classroom-blocks">
  {chosen.blocks.map((block,index)=><div className="classroom-block" key={index}><span className="badge">Block {index+1} • {block.hours}h</span><div><strong>{block.title}</strong><small>{block.method}</small></div></div>)}
  </div>
  <h4>FMCSA standard theory units scheduled for discussion</h4>
  <p className="muted">Enter the corresponding licensed J. J. Keller lesson or course identifier from your actual course catalog. Blank references remain unverified, and an entered reference does not certify completion.</p>
  <div className="classroom-topic-list">{topics.map(t=><label key={t.code} className="classroom-topic"><div><b>{t.code} — {t.title}</b><small>{t.category}</small></div><input aria-label={'J. J. Keller reference for '+t.code} placeholder="J. J. Keller module ID / title (verify)" disabled={readOnly||busy||!savedPlan} value={mappingDraft[t.code]??savedPlan?.jjKellerModuleMap?.[t.code]??''} onChange={e=>setMappingDraft(p=>({...p,[t.code]:e.target.value}))}/></label>)}</div>
  {savedPlan&&<button type="button" disabled={readOnly||busy||!Object.keys(mappingDraft).length} onClick={saveMapping}><ClipboardCheck size={16}/> Save J. J. Keller references</button>}
  {chosen.workshop&&<div className="classroom-workshop">
    <div className="sectionhead"><div><p className="eyebrow">LONE STAR PRACTICAL LAB</p><h4>{chosen.workshop.title}</h4></div><MapPinned size={24}/></div>
    <p><b>Scenario:</b> {chosen.workshop.scenario}</p>
    <p><b>Student learning objectives</b></p><ol>{chosen.workshop.objectives.map((item,i)=><li key={i}>{item}</li>)}</ol>
    <p><b>Instructor-led steps</b></p><ol>{chosen.workshop.steps.map((item,i)=><li key={i}>{item}</li>)}</ol>
    <p><b>Evidence / assessment:</b> {chosen.workshop.assessment}</p>
  </div>}
  <div className="classroom-attachments"><div><h4>Materials to prepare</h4><ul>{chosen.materials.map(s=><li key={s}>{s}</li>)}</ul></div><div><h4>Instruction evidence to retain</h4><ul>{chosen.evidence.map(s=><li key={s}>{s}</li>)}</ul></div></div>
  <p className="notice"><ShieldAlert size={16}/> <span><b>Instructor review:</b> {chosen.instructorNotes}</span></p>
  <details className="classroom-coverage"><summary><CheckCircle2 size={17}/> View all 30 FMCSA theory topics and scheduled days</summary>
   <div className="tablewrap"><table><thead><tr><th>FMCSA unit</th><th>Required subject</th><th>Proposed day</th><th>J. J. Keller mapping</th></tr></thead><tbody>
    {CLASS_A_THEORY_TOPICS.map(t=>{const p=campusPlans.find(x=>x.curriculumKey==='class-a-week1-day'+t.day);return <tr key={t.code}><td>{t.code}</td><td>{t.title}</td><td>Day {t.day}</td><td>{p?.jjKellerModuleMap?.[t.code]||'Pending'}</td></tr>;})}
   </tbody></table></div>
  </details>
  {gaps.length>0&&<p className="error">Missing federal topic assignments: {gaps.join(', ')}</p>}
  <p className="footnote">Sources: 49 CFR Part 380, Appendix A (Class A standard theory); 19A NCAC 03J .0306 (NC standard course). The academy must verify the actual J. J. Keller course list, course durations, instructor credentials, student attendance and assessments before adopting this as an approved syllabus. Class B-to-A upgrade students may need the separately applicable upgrade curriculum.</p>
 </section>;
}
