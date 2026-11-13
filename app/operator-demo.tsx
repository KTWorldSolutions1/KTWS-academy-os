'use client';
import {useEffect,useRef,useState} from 'react';
import {Play,Pause,ChevronLeft,ChevronRight,X,RotateCcw,MousePointer2,Volume2,VolumeX,Video,Download,Maximize2,Minimize2,CheckCircle2,Camera,Hand,ShieldCheck} from 'lucide-react';
import type {RecordData as R} from '../lib/training';
import {OPERATOR_STEPS,applyOperatorExample,sampleOperatorStudent,type OperatorStep} from '../lib/operator-demo';

type Props={
 records:R[];role:string;demo:boolean;onNavigate:(page:string)=>void;onSelectCampus:(name:string)=>void;
 onStudent:(id:string)=>void;onTrainingView:(name:string)=>void;saveMany:(rows:R[])=>Promise<boolean>;
 onClose:()=>void;onTrailer:()=>void;
};
const STEP_LENGTH=30000;
function findTarget(step:OperatorStep):HTMLElement|null{
 const match=document.querySelector(step.selector) as HTMLElement|null;
 if(match)return match;
 return document.querySelector('.titlebar h1, .content .panel h2, .section-chooser') as HTMLElement|null;
}
function setSelect(select:HTMLSelectElement,value:string){
 const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value')?.set;
 if(setter)setter.call(select,value);else select.value=value;
 select.dispatchEvent(new Event('change',{bubbles:true}));
}
function activatePortalStudent(studentId:string){
 const portal=document.querySelector('.demo-student-portal');
 const studentSelect=portal?.querySelector('section.panel select') as HTMLSelectElement|null;
 if(studentSelect&&[...studentSelect.options].some(option=>option.value===studentId))setSelect(studentSelect,studentId);
}
function portalClick(tab:'Documents'|'Practice'){
 const candidates=[...document.querySelectorAll('.demo-student-sidebar button')] as HTMLButtonElement[];
 const found=candidates.find(x=>x.textContent?.trim()===tab);
 found?.click();return !!found;
}
function runVisiblePortalAction(step:OperatorStep,studentId:string):boolean{
 activatePortalStudent(studentId);
 if(step.id==='portal-upload'){
  portalClick('Documents');
  window.setTimeout(()=>{
   const rows=[...document.querySelectorAll('.demo-student-main .vault-doc-row')];
   const agreement=rows.find(r=>r.textContent?.includes('Enrollment agreement'));
   const button=agreement?.querySelector('button') as HTMLButtonElement|null;
   button?.click();
  },450);
  return true;
 }
 if(step.id==='student-balance'){
  portalClick('Payments');
  return true;
 }
 if(step.id==='knowledge-test'){
  portalClick('Practice');
  window.setTimeout(()=>{
   const q=[...document.querySelectorAll('.demo-student-question')];
   if(q.length<6)return;
   const selections=[0,1,0,0,0,0]; // 4/6, misses coupling and low air warning.
   for(let k=0;k<Math.min(q.length,selections.length);k++){
    const choices=q[k].querySelectorAll('input[type="radio"]');
    (choices[selections[k]] as HTMLInputElement|undefined)?.click();
   }
   window.setTimeout(()=>{
    const submit=[...document.querySelectorAll('.demo-student-main button')]
      .find(el=>el.textContent?.includes('Submit practice quiz')) as HTMLButtonElement|undefined;
    if(submit&&!submit.disabled)submit.click();
   },500);
  },450);
  return true;
 }
 return false;
}
function clickRealPreflight(){
 const buttons=[...document.querySelectorAll('.compliance-rosters button')] as HTMLButtonElement[];
 const btn=buttons.find(x=>x.textContent?.includes('Check first-day packet readiness'));
 if(btn&&!btn.disabled){btn.click();return true;}
 return false;
}
export default function OperatorDemo({records,role,demo,onNavigate,onSelectCampus,onStudent,onTrainingView,saveMany,onClose,onTrailer}:Props){
 const [position,setPosition]=useState(0),[playing,setPlaying]=useState(false),[voice,setVoice]=useState(true),[speed,setSpeed]=useState(.85),[minimized,setMinimized]=useState(false);
 const [note,setNote]=useState('Ready for a guided real-workspace walkthrough. Press Play to start. Every record is synthetic.'),[touched,setTouched]=useState(0),[clicking,setClicking]=useState(false);
 const [pointer,setPointer]=useState({left:-80,top:-80,visible:false}),[fileUrl,setFileUrl]=useState(''),[fileType,setFileType]=useState('video/webm'),[recording,setRecording]=useState(false),[error,setError]=useState('');
 const latest=useRef({records,onNavigate,onSelectCampus,onStudent,onTrainingView,saveMany,onClose,onTrailer,role,demo});
 latest.current={records,onNavigate,onSelectCampus,onStudent,onTrainingView,saveMany,onClose,onTrailer,role,demo};
 const done=useRef(new Set<string>()),recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]),urlRef=useRef('');
 const step=OPERATOR_STEPS[position],isEnd=position===OPERATOR_STEPS.length-1;
 function stopCapture(){
  const r=recorder.current;if(r&&r.state!=='inactive')r.stop();
  stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
 }
 function close(){
  setPlaying(false);
  stopCapture();
  if(typeof window!=='undefined'&&'speechSynthesis'in window)window.speechSynthesis.cancel();
  latest.current.onClose();
 }
 function focusOn(step:OperatorStep){
  const target=findTarget(step);if(!target){setPointer(p=>({...p,visible:false}));return;}
  if(!target.classList.contains('operator-focus-target'))target.classList.add('operator-focus-target');
  const bounds=target.getBoundingClientRect();
  if(bounds.bottom<90||bounds.top>window.innerHeight-110){
   target.scrollIntoView({behavior:'smooth',block:'center'});
  }
  window.setTimeout(()=>{
   const rect=target.getBoundingClientRect();
   setPointer({left:Math.max(14,Math.min(window.innerWidth-32,rect.left+Math.min(rect.width*.24,200))),top:Math.max(88,Math.min(window.innerHeight-45,rect.top+Math.min(rect.height*.28,65))),visible:true});
   setClicking(true);window.setTimeout(()=>setClicking(false),450);
  },320);
 }
 useEffect(()=>{
  if(!playing||!demo)return;
  let cancelled=false,t1=0,t2=0,t3=0,t4=0;
  const active=OPERATOR_STEPS[position];
  const props=latest.current;
  if(active.tourRole==='Owner'&&!['Owner','Regional admin'].includes(props.role)){
   setNote('Owner-only control is unavailable to this campus-level account. The tour respects staff access permissions.');
   t3=window.setTimeout(()=>setPosition(i=>Math.min(i+1,OPERATOR_STEPS.length-1)),3400);
   return()=>{cancelled=true;window.clearTimeout(t3);};
  }
  props.onNavigate(active.page);
  if(active.campus)props.onSelectCampus(active.campus);
  if(active.trainingView)props.onTrainingView(active.trainingView);
  setNote('Operator: '+active.operatorAction);
  setPointer(p=>({...p,visible:false}));
  // Wait until React has rendered the real module, then visibly target its controls.
  t1=window.setTimeout(async()=>{
   if(cancelled)return;
   const person=sampleOperatorStudent(latest.current.records);
   if(active.studentDrawer&&person)props.onStudent(person.id);
   if(active.id==='first-day')window.setTimeout(clickRealPreflight,550);
   if((active.id==='portal-upload'||active.id==='knowledge-test'||active.id==='student-balance')&&person){
    runVisiblePortalAction(active,person.id);
    setNote('The operator is clicking the actual student-portal controls using fictional data.');
   }else if(active.action&&!done.current.has(active.id)){
    done.current.add(active.id);
    const example=applyOperatorExample(active.action,latest.current.records);
    if(example.updates.length){
     const okay=await latest.current.saveMany(example.updates);
     if(!cancelled){
      setNote(okay?'✓ '+example.message:'Save was rejected by the demo validation. Review the school notice.');
      if(okay)setTouched(n=>n+example.updates.length);
     }
    }else setNote(example.message);
   }
   if(!cancelled)focusOn(active);
  },850);
  t2=window.setTimeout(()=>{
   if(cancelled)return;
   if(isEnd){setPlaying(false);stopCapture();setNote('Tour complete. The visible changes were made only in synthetic sample mode.');}
   else setPosition(p=>Math.min(p+1,OPERATOR_STEPS.length-1));
  },Math.round(STEP_LENGTH/speed));
  return()=>{cancelled=true;for(const id of [t1,t2,t3,t4])window.clearTimeout(id);
   document.querySelectorAll('.operator-focus-target').forEach(el=>el.classList.remove('operator-focus-target'));
  };
 },[position,playing,speed,demo]);
 useEffect(()=>{
  if(!voice||!playing||!demo||!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  const line=new SpeechSynthesisUtterance(step.voice);
  line.lang='en-US';line.rate=Math.max(.7,Math.min(1.18,.88*speed));line.pitch=1;line.volume=.96;
  window.speechSynthesis.speak(line);
  return()=>window.speechSynthesis.cancel();
 },[position,playing,voice,speed,demo]);
 useEffect(()=>()=>{
  const r=recorder.current;if(r&&r.state!=='inactive')r.stop();stream.current?.getTracks().forEach(t=>t.stop());
  if(urlRef.current)URL.revokeObjectURL(urlRef.current);
  if('speechSynthesis'in window)window.speechSynthesis.cancel();
  document.querySelectorAll('.operator-focus-target').forEach(el=>el.classList.remove('operator-focus-target'));
 },[]);
 function seek(n:number){setPosition(Math.max(0,Math.min(OPERATOR_STEPS.length-1,n)));setNote('Opening '+OPERATOR_STEPS[Math.max(0,Math.min(OPERATOR_STEPS.length-1,n))].title);}
 function replay(){done.current.clear();setTouched(0);setPosition(0);setPlaying(true);}
 async function startRecording(){
  setError('');
  if(!demo){setError('Enter the fictional Academy OS sandbox before recording.');return;}
  if(!navigator.mediaDevices?.getDisplayMedia||typeof MediaRecorder==='undefined'){setError('This browser does not support recording a shared tab. Use desktop Chrome or Edge, or your device screen recorder. The live tour remains available.');return;}
  try{
   // User actively chooses which tab to share. This is not silent surveillance.
   const captured=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:24},audio:true} as DisplayMediaStreamOptions);
   const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4'].find(x=>MediaRecorder.isTypeSupported(x));
   if(!mime){captured.getTracks().forEach(t=>t.stop());throw Error('This browser cannot export the captured tab as a video.');}
   if(fileUrl){URL.revokeObjectURL(fileUrl);setFileUrl('');}
   stream.current=captured;setFileType(mime);chunks.current=[];
   const r=new MediaRecorder(captured,{mimeType:mime,videoBitsPerSecond:2800000});recorder.current=r;
   r.ondataavailable=event=>{if(event.data.size)chunks.current.push(event.data);};
   r.onstop=()=>{
    if(chunks.current.length){const blob=new Blob(chunks.current,{type:mime});const link=URL.createObjectURL(blob);urlRef.current=link;setFileUrl(link);}
    setRecording(false);stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;
   };
   captured.getVideoTracks()[0]?.addEventListener('ended',()=>{if(r.state!=='inactive')r.stop();},{once:true});
   r.start(600);setRecording(true);
   // Reset to step 1 and drive the actual application's sample workspace.
   done.current.clear();setTouched(0);setPosition(0);setPlaying(true);
   setNote('Recording the real Academy OS screens. Share THIS browser tab, not a tab containing private student information.');
  }catch(e:any){setError(e.message||'Tab recording was declined.');setRecording(false);}
 }
 if(!demo)return <div className="operator-tour-error" role="alert">Interactive walkthrough stopped: only synthetic demonstration data may be used. <button onClick={close}>Close</button></div>;
 return <>
  <div aria-hidden="true" className={'operator-live-pointer'+(clicking?' is-clicking':'')} style={{left:pointer.left,top:pointer.top,opacity:pointer.visible?1:0}}><MousePointer2 size={26}/><span>OPERATOR</span></div>
  <section className={'operator-tour'+(minimized?' minimized':'')} aria-label="Live Academy OS user walkthrough" role="region">
   <header><div><span className="operator-rec-dot" aria-hidden="true"/><b>LIVE WORKSPACE OPERATOR</b><small>100 FICTIONAL STUDENTS · 50 PENDING FUNDING</small></div><div className="operator-header-actions"><button onClick={()=>setMinimized(x=>!x)} aria-label={minimized?'Expand walkthrough':'Minimize walkthrough'}>{minimized?<Maximize2 size={16}/>:<Minimize2 size={16}/>}</button><button onClick={close} aria-label="Close live walkthrough"><X size={18}/></button></div></header>
   {!minimized&&<>
   <div className="operator-tour-progress"><span>STEP {position+1} OF {OPERATOR_STEPS.length}</span><span>{step.stage}</span></div>
   <progress value={position+1} max={OPERATOR_STEPS.length} aria-label="Tour completion"/>
   <div className="operator-tour-body"><h3>{step.title}</h3><p>{step.operatorAction}</p><div className="operator-example"><CheckCircle2 size={16}/><span><b>WHAT YOU CAN VERIFY ON THIS SCREEN</b>{step.evidence}</span></div>
   <div className="operator-live-note" role="status"><MousePointer2 size={17}/><span>{note}</span></div></div>
   <div className="operator-primary-controls">
    <button aria-label="Previous step" onClick={()=>seek(position-1)} disabled={position===0}><ChevronLeft size={20}/></button>
    <button className="operator-play" onClick={()=>{if(isEnd&&!playing)replay();else setPlaying(x=>!x);}}>{isEnd&&!playing?<RotateCcw size={18}/>:playing?<Pause size={18}/>:<Play size={18}/>} {isEnd&&!playing?'Replay full tour':playing?'Pause / try it yourself':'Resume automatic operator'}</button>
    <button aria-label="Next step" onClick={()=>seek(position+1)} disabled={isEnd}><ChevronRight size={20}/></button>
   </div>
   <div className="operator-secondary-controls"><button onClick={()=>setVoice(x=>!x)} aria-pressed={voice}>{voice?<Volume2 size={16}/>:<VolumeX size={16}/>} {voice?'Narration on':'Voice narration'}</button>
    <label>Speed <select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.65}>Gentle · 0.65×</option><option value={.85}>Relaxed · 0.85×</option><option value={1}>Standard · 1×</option><option value={1.2}>Quick · 1.2×</option></select></label>
    <button onClick={onTrailer}><Play size={15}/> Story trailer</button>
   </div>
   <div className="operator-capture"><div><b><Camera size={17}/> Record the actual interface</b><p>On desktop, select <b>This Tab</b> in the browser sharing dialog. Your video will capture the real Academy OS screens, operator cursor and demonstration actions—not a slide deck.</p></div>
    {!recording?<button onClick={startRecording}><Video size={16}/> Record full click-through</button>:<button onClick={stopCapture}><Pause size={16}/> Stop & save recording</button>}
    {fileUrl&&<a href={fileUrl} download={'LoneStar_Actual_Operator_Walkthrough.'+(fileType.includes('mp4')?'mp4':'webm')}><Download size={16}/> Download recorded real-screen video</a>}
   </div>
   <div className="operator-footer"><span><ShieldCheck size={14}/> Sample-only actions · {touched} example record changes</span><button onClick={replay}><RotateCcw size={14}/> Restart</button></div>
   {error&&<div className="error" role="alert">{error}</div>}
   </>}
   {minimized&&<button className="operator-minimized-continue" onClick={()=>setMinimized(false)}><Hand size={16}/> {step.stage}: {step.title} · {playing?'Playing':'Paused'}</button>}
  </section>
 </>;
}
