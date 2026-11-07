'use client';
import {useEffect,useState} from 'react';
import {Bell,BookOpen,CheckCircle2,FileText,Upload} from 'lucide-react';
type Request={category:string;status:string;required:boolean;requested:boolean;uploadedAt?:string|null};
type Props={documents:Request[];notices:{category:string;message:string;requestedAt:string}[];onUploaded:()=>Promise<void>};
export default function StudentLearningDocuments({documents,notices,onUploaded}:Props){
 const [category,setCategory]=useState(''),[resources,setResources]=useState<any[]>([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const toUpload=documents.filter(d=>d.requested&&d.status!=='Verified');
 useEffect(()=>{setCategory(p=>toUpload.some(d=>d.category===p)?p:toUpload[0]?.category||'');},[documents.map(d=>d.category+d.status+d.requested).join('|')]);
 useEffect(()=>{(async()=>{try{
  const campusRes=await fetch('/api/student/resources',{cache:'no-store'});
  // Optional resource listing: fallback to no documents until staff publishes a resource.
  if(campusRes.ok){const d=await campusRes.json();setResources(d.files||[]);}
 }catch{}})();},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');setMessage('');setBusy(true);
  try{if(!category)throw Error('Your campus has not requested a document yet.');
   const body=new FormData(e.currentTarget);body.set('category',category);
   const res=await fetch('/api/files',{method:'POST',body}),payload=await res.json();
   if(!res.ok)throw Error(payload.error||'Encrypted upload unavailable');
   setMessage('Uploaded successfully. Your campus can review it in the student file vault.');e.currentTarget.reset();await onUploaded();
  }catch(e:any){setError(e.message||'Upload failed');}finally{setBusy(false);}
 }
 async function submitPortrait(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');setMessage('');setBusy(true);
  try{
   const form=e.currentTarget,body=new FormData(form);
   const file=body.get('file');
   if(!(file instanceof File)||!['image/jpeg','image/png'].includes(file.type)||file.size>2_000_000)throw Error('Select a JPG/PNG portrait smaller than 2 MB.');
   body.set('category','Student profile photo');
   const res=await fetch('/api/files',{method:'POST',body}),payload=await res.json();
   if(!res.ok)throw Error(payload.error||'School photo uploads are not enabled.');
   setMessage('Portrait uploaded privately. Campus management must review and approve it before your photo appears on your profile or badge.');
   form.reset();await onUploaded();
  }catch(e:any){setError(e.message||'Photo upload was not saved.');}finally{setBusy(false);}
 }
 return <><section className="panel student-file-panel"><div className="sectionhead"><div><h2><Bell size={20}/> My enrollment documents</h2><p className="muted">Only your own authorized document checklist is visible here. Documents you submit go directly to your campus's encrypted record vault for review.</p></div><span className={'badge '+(notices.length?'warn':'')}>{notices.length} requested</span></div>
 {notices.length>0&&<div className="student-file-alerts">{notices.map(n=><p key={n.category}><Bell size={15}/> <b>{n.category} requested</b> — {n.message}</p>)}</div>}
 {documents.map(d=><div className="reportrow" key={d.category}><div><b>{d.category}</b><small>{d.required?'Standard enrollment item':'Additional requested item'}{d.uploadedAt?' • Uploaded '+d.uploadedAt.slice(0,10):''}</small></div><span className={'badge '+(d.status==='Verified'?'good':d.status.startsWith('Submitted')?'':'warn')}>{d.status}</span></div>)}
 <section className="student-photo-upload"><h3>📸 My student profile picture</h3><p className="muted">Upload your own clear head-and-shoulders portrait. It will be private until the school reviews it and can then appear on your student portal and school ID card. The campus prints and issues ID badges.</p><p className="badge">{documents.find(d=>d.category==='Student profile photo')?.status||'No photo submitted'}</p><form onSubmit={submitPortrait}><label>Photo — JPG/PNG under 2 MB<input type="file" name="file" accept="image/jpeg,image/png" required/></label><button type="submit" disabled={busy}><Upload size={16}/> Submit profile photo for campus review</button></form></section>
 {toUpload.length>0?<form onSubmit={submit} className="student-file-upload"><h3><Upload size={16}/> Upload a requested file</h3><label>Requested document<select value={category} onChange={e=>setCategory(e.target.value)}>{toUpload.map(d=><option key={d.category}>{d.category}</option>)}</select></label><label>PDF or photo (10 MB maximum)<input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" required/></label><button type="submit" disabled={busy} className="primary">{busy?'Uploading securely…':'Upload securely'}</button></form>:<p className="muted"><CheckCircle2 size={16}/> No outstanding document upload requests. Your campus may still be reviewing previously submitted items.</p>}
 {message&&<p className="notice">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}<p className="footnote">Do not send Social Security cards or driver licenses by ordinary email or text. Use this private school portal only. Document reviews are completed by authorized campus personnel.</p></section>
 {resources.length>0&&<section className="panel"><h2><FileText size={20}/> Campus forms & classroom resources</h2>{resources.map(file=><div className="reportrow" key={file.key}><b>{file.name}</b><a href={'/api/files?key='+encodeURIComponent(file.key)}>Open</a></div>)}</section>}</>;
}
type Quiz={id:string;name:string;subject:string;completedToday:boolean;questions:{id:string;prompt:string;subject:string;objective:string;options:string[]}[]};
export function StudentPracticeDiagnostics(){
 const [quizzes,setQuizzes]=useState<Quiz[]>([]),[attempts,setAttempts]=useState<any[]>([]),[progress,setProgress]=useState<any[]>([]),[active,setActive]=useState<Quiz|null>(null),[answers,setAnswers]=useState<Record<string,number>>({}),[result,setResult]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function load(){try{const res=await fetch('/api/student/exams',{cache:'no-store'});if(!res.ok)return;const data=await res.json();setQuizzes(data.quizzes||[]);setProgress(data.progress||[]);setAttempts(data.attempts||[]);}catch{}}
 useEffect(()=>{load();},[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(!active)return;setBusy(true);setError('');
  try{const res=await fetch('/api/student/exams',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({quizId:active.id,answers})});const body=await res.json();if(!res.ok)throw Error(body.error||'Cannot save answers.');setResult(body);setActive(null);setAnswers({});await load();}catch(e:any){setError(e.message);}finally{setBusy(false);}
 }
 return <section className="panel student-diagnostic-practice"><div className="sectionhead"><div><h2><BookOpen size={20}/> My knowledge checks</h2><p className="muted">Practice quizzes created and approved by your instructors. Identify weaknesses in general knowledge, air brakes, combination vehicles and the subjects your class is studying.</p></div></div>
 {progress.length>0&&<div className="diagnostic-subjects">{progress.map(s=><div className="diagnostic-subject" key={s.subject}><b>{s.subject}: {s.percent}%</b><small>{s.correct} of {s.total} correct</small>{s.percent<80&&<small>Review: {s.missedObjectives.slice(0,3).join('; ')}</small>}</div>)}</div>}
 {result&&<div className="notice" role="status"><b>Saved: {result.score}% ({result.correct}/{result.total})</b>{result.reviewTopics?.length>0&&<p>Review with your instructor: {result.reviewTopics.slice(0,5).join('; ')}</p>}</div>}
 {!active?<>{quizzes.map(q=><div className="reportrow" key={q.id}><div><b>{q.name}</b><small>{q.questions.length} questions • {q.completedToday?'Completed for today':'Ready for practice'}</small></div><button disabled={q.completedToday} onClick={()=>{setActive(q);setAnswers({});setResult(null);}}>Start quiz</button></div>)}{!quizzes.length&&<p className="muted">No instructor-published practice quizzes for your class yet. Ask your instructor when the first knowledge check will be available.</p>}
 {attempts.length>0&&<details><summary>Recent practice results</summary>{attempts.map((a,i)=><div key={i} className="reportrow"><span>{a.date} · {a.name}</span><b>{a.score}%</b></div>)}</details>}</>:
 <form onSubmit={submit}><h3>{active.name}</h3><p className="footnote">The school records your answers and subject accuracy. You can complete one attempt per quiz per day. These are not official CDL knowledge tests.</p>
 {active.questions.map((q,i)=><fieldset className="question" key={q.id}><legend>{i+1}. {q.prompt}</legend><small>{q.subject}</small>{q.options.map((option,j)=><label key={j} className="checkboxlabel"><input type="radio" name={q.id} required checked={answers[q.id]===j} onChange={()=>setAnswers(p=>({...p,[q.id]:j}))}/>{String.fromCharCode(65+j)}. {option}</label>)}</fieldset>)}
 <button className="primary" disabled={busy||Object.keys(answers).length!==active.questions.length}>Submit knowledge check</button><button type="button" onClick={()=>{setActive(null);setAnswers({});}}>Exit without submitting</button></form>}
 {error&&<p className="error" role="alert">{error}</p>}
 </section>;
}
