'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,BookOpen,ChevronLeft,ChevronRight,Download,Maximize2,Pause,Play,RotateCcw,Volume2,VolumeX,X,Presentation,CheckCircle2,ShieldCheck} from 'lucide-react';
import {DEMO_SCENES,type DemoScene} from '../lib/presentation-demo';
import {timelineForMode,spokenPitch,CAPABILITY_COUNT,type DemoMode} from '../lib/demo-showcase';
import CapabilityExplorer from './demo-capability-explorer';
import {chapterDetail} from '../lib/owner-demo-review';
import ExecutiveFeedbackBoard from './executive-feedback-board';

type Props={onClose:()=>void;onNavigate:(id:string,sceneId:string)=>void;};
function time(seconds:number){const x=Math.floor(seconds);return Math.floor(x/60)+':'+String(x%60).padStart(2,'0');}
function wrappedText(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,maxWidth:number,lineHeight:number){
 let line='';for(const word of value.split(' ')){const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;line=word;}else line=next;}
 if(line)ctx.fillText(line,x,y);
 return y+lineHeight;
}
function drawScene(ctx:CanvasRenderingContext2D,scene:DemoScene,sequence:number,progress:number){
 const w=1280,h=720;ctx.fillStyle='#080c12';ctx.fillRect(0,0,w,h);
 const gradient=ctx.createLinearGradient(0,0,1160,680);gradient.addColorStop(0,'#10243a');gradient.addColorStop(.52,'#111922');gradient.addColorStop(1,'#070d13');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#1c77b7';ctx.fillRect(0,0,10,h);ctx.fillStyle='#176ba6';ctx.fillRect(68,64,58,58);
 ctx.fillStyle='#ffffff';ctx.font='bold 38px Arial';ctx.fillText('★',78,106);
 ctx.fillStyle='#f5f7fb';ctx.font='bold 30px Arial';ctx.fillText('LONE STAR',146,89);
 ctx.font='14px Arial';ctx.fillStyle='#a7b4c5';ctx.fillText('TRUCK DRIVING ACADEMY  /  ACADEMY OS',148,113);
 ctx.fillStyle='#83bde9';ctx.font='bold 18px Arial';ctx.fillText(scene.kicker,78,178);
 ctx.fillStyle='#ffffff';ctx.font='bold 52px Arial';const y=wrappedText(ctx,scene.title,78,257,1050,64);
 ctx.fillStyle='#c7d0dc';ctx.font='24px Arial';wrappedText(ctx,scene.subtitle,80,y+10,1020,34);
 scene.stats.forEach((stat,i)=>{const x=80+i*375;ctx.fillStyle='#192a3b';ctx.fillRect(x,365,337,97);ctx.strokeStyle='#355879';ctx.lineWidth=1;ctx.strokeRect(x,365,337,97);ctx.fillStyle='#fff';ctx.font='bold 31px Arial';ctx.fillText(stat,x+22,407);ctx.fillStyle='#9db3c7';ctx.font='15px Arial';ctx.fillText(['CURRENT VIEW','VISIBLE EVIDENCE','KEY OUTCOME'][i],x+22,440);});
 ctx.fillStyle='#eef4fa';ctx.font='22px Arial';scene.highlights.forEach((item,i)=>{ctx.fillStyle='#2d95d1';ctx.fillText('✓',85,524+i*48);ctx.fillStyle='#e3ecf5';wrappedText(ctx,item,116,524+i*48,1030,27);});
 ctx.fillStyle='#9eaebe';ctx.font='16px Arial';ctx.fillText('DEMONSTRATION ONLY • COMPLETELY SYNTHETIC RECORDS',80,686);
 ctx.fillStyle='#8bbce4';ctx.fillText(String(sequence+1).padStart(2,'0')+' / '+String(DEMO_SCENES.length).padStart(2,'0'),1140,687);
 ctx.fillStyle='#20334a';ctx.fillRect(0,706,w,14);ctx.fillStyle='#2184c6';ctx.fillRect(0,706,w*progress,14);
}
export default function OwnerDemoFilm({onClose,onNavigate}:Props){
 const [recordedMime,setRecordedMime]=useState('video/webm');
 const [feedbackOpen,setFeedbackOpen]=useState(false),[showGuide,setShowGuide]=useState(false),[explorerOpen,setExplorerOpen]=useState(true),[mode,setMode]=useState<DemoMode>('executive');
 const [playing,setPlaying]=useState(false),[index,setIndex]=useState(0),[fraction,setFraction]=useState(0),[narrate,setNarrate]=useState(true),[speed,setSpeed]=useState(1),[voices,setVoices]=useState<SpeechSynthesisVoice[]>([]),[voiceName,setVoiceName]=useState(''),[voiceReady,setVoiceReady]=useState(false),[recording,setRecording]=useState(false),[recordedUrl,setRecordedUrl]=useState(''),[error,setError]=useState('');
 const speechPendingRef=useRef(false),lastClock=useRef<number>(0),canvasRef=useRef<HTMLCanvasElement|null>(null),videoRef=useRef<HTMLVideoElement|null>(null);
 const timeline=timelineForMode(mode);
 const {scenes,durations,starts,total}=timeline;
 const scene=scenes[Math.min(index,scenes.length-1)];
 const detail=chapterDetail(scene.id);
 const briefNarration=spokenPitch(scene);
 const stages=['Inquiry','Enrollment','Classroom','Yard','Road','Testing','Graduate'];
 const stageIndex=scene.id==='network'||scene.id==='lead'?0:scene.id==='portal'||scene.id==='theory'?2:scene.id==='road'?4:scene.id==='testing'?5:scene.id==='finale'?6:3;
 const clickPaths:Record<string,string>={
  network:'Choose a campus in the top filter → review student and school counts',
  lead:'Admissions → New Inquiries → add applicant → set next contact date',
  funding:'Partners → Funding Approvals → verify written funding source',
  docs:'Students → Secure Document Vault → select student → request a missing file',
  payments:'Payments → Student Payment Center → record a sample charge → verify receipt',
  notices:'Home → Announcements & Closures → publish a campus student banner',
  portal:'Students → Student Portal Demo → Documents → simulate upload → Practice',
  portrait:'Secure Document Vault → add portrait → verify → save ID number → print',
  roster:'Admissions → DMV Roster Packets → select NC class → run preflight',
  theory:'Training → Take Attendance → Week-one planner → view all 30 topics',
  test:'Training → Knowledge Diagnostics → select class → inspect missed objectives',
  yard:'Training → Take Attendance → record yard attendance and maneuvers',
  road:'Training → Daily Training Plan → assign instructor, student and truck',
  testing:'Students → Student 360 → review theory, skills and evidence gaps',
  career:'Home → School Numbers → compare enrollment and completion trends',
  team:'Team → Tasks & Appointments → select campus and assigned employee',
  finale:'Replay the full story or open a module for hands-on practice'
 };

 const indexRef=useRef(index),playingRef=useRef(playing),progressRef=useRef(fraction),speedRef=useRef(speed);
 indexRef.current=index;playingRef.current=playing;progressRef.current=fraction;speedRef.current=speed;
 // Discover installed voices. Prefer natural English voices when available,
 // while preserving an explicit voice selector for browsers with limited TTS.
 useEffect(()=>{
  if(typeof window==='undefined'||!('speechSynthesis' in window))return;
  const synth=window.speechSynthesis;
  const refresh=()=>{
   const found=synth.getVoices().filter(v=>v.lang.toLowerCase().startsWith('en'));
   setVoices(found);
   setVoiceName(current=>{
    if(current&&found.some(v=>v.voiceURI===current))return current;
    const preferred=found.find(v=>/samantha|ava|jenny|aria|natural|google us english|microsoft guy|daniel/i.test(v.name));
    return (preferred||found.find(v=>v.localService)||found[0])?.voiceURI||'';
   });
   setVoiceReady(true);
  };
  refresh();synth.addEventListener('voiceschanged',refresh);
  return()=>synth.removeEventListener('voiceschanged',refresh);
 },[]);
 useEffect(()=>{
  if(!playing)return;
  lastClock.current=performance.now();
  const t=window.setInterval(()=>{
   const now=performance.now(),step=Math.min(450,now-lastClock.current)*speedRef.current;lastClock.current=now;
   const sceneMs=durations[indexRef.current];
   const nextElapsed=progressRef.current*sceneMs+step;
   if(nextElapsed>=sceneMs){
    // Do not cut off a spoken sentence to advance the visual slide.
    if(narrate&&speechPendingRef.current){setFraction(.999);return;}
    if(indexRef.current===scenes.length-1){setFraction(1);setPlaying(false);return;}
    setIndex(indexRef.current+1);setFraction(0);
   }else setFraction(nextElapsed/sceneMs);
  },75);
  return()=>clearInterval(t);
 },[playing,narrate,mode]);
 useEffect(()=>{
  if(typeof window==='undefined'||!('speechSynthesis' in window))return;
  const synth=window.speechSynthesis;
  synth.cancel();
  speechPendingRef.current=false;
  if(!narrate||!playing)return;
  const utterance=new SpeechSynthesisUtterance(briefNarration);
  const chosen=voices.find(v=>v.voiceURI===voiceName);
  if(chosen)utterance.voice=chosen;
  utterance.lang=chosen?.lang||'en-US';
  utterance.rate=Math.max(.9,Math.min(1.28,1.08*speed));
  utterance.pitch=1;utterance.volume=.95;
  speechPendingRef.current=true;
  utterance.onend=()=>{speechPendingRef.current=false;};
  utterance.onerror=()=>{speechPendingRef.current=false;};
  synth.speak(utterance);
  return()=>{speechPendingRef.current=false;synth.cancel();};
 },[index,narrate,playing,voiceName,voices,speed]);
 useEffect(()=>()=>{if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();},[]);
 useEffect(()=>()=>{if(recordedUrl)URL.revokeObjectURL(recordedUrl);},[recordedUrl]);
 useEffect(()=>{function esc(e:KeyboardEvent){if(e.key==='Escape')onClose();if(e.key===' '&&!['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName)){e.preventDefault();setPlaying(p=>!p);}}
  window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc);
 },[onClose]);
 const currentSeconds=(starts[index]+fraction*durations[index])/1000,totalSeconds=total/1000;
 function seek(next:number){speechPendingRef.current=false;if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();setIndex(Math.max(0,Math.min(scenes.length-1,next)));setFraction(0);lastClock.current=performance.now();}
 function restart(){seek(0);setPlaying(true);}
 function start(){if(index===scenes.length-1&&fraction>=.99)restart();else setPlaying(v=>!v);}
 async function saveFilm(){
  setError('');if(recording)return;
  const canvas=canvasRef.current;
  if(!canvas||typeof MediaRecorder==='undefined'||!('captureStream' in canvas)){setError('Video recording is not supported on this browser. The interactive narrated presentation still works.');return;}
  const type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!type){setError('This browser cannot export a video. Use the on-screen walkthrough or record your screen.');return;}
  try{
   setRecording(true);setPlaying(false);if(recordedUrl){URL.revokeObjectURL(recordedUrl);setRecordedUrl('');}
   const context=canvas.getContext('2d');if(!context)throw Error('Video canvas unavailable');
   const stream=canvas.captureStream(20),recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:1600000});
   const blobs:Blob[]=[];
   recorder.ondataavailable=ev=>{if(ev.data.size)blobs.push(ev.data);};
   const result=new Promise<void>((resolve,reject)=>{recorder.onerror=()=>reject(Error('Video recording failed'));recorder.onstop=()=>{
     if(!blobs.length){reject(Error('Browser did not record the walkthrough.'));return;}
     const url=URL.createObjectURL(new Blob(blobs,{type}));setRecordedMime(type);setRecordedUrl(url);resolve();
   };});
   recorder.start(250);
   // Give viewers time to read. Canvas exports are silent: browser voice output cannot be reliably captured as a video audio track.
   const hold=9500;const startAt=performance.now();
   await new Promise<void>(resolve=>{
    let ended=false;
    const render=(now:number)=>{
     if(ended)return;
     const absolute=now-startAt,frame=Math.min(scenes.length-1,Math.floor(absolute/hold));
     const within=Math.min(1,(absolute-frame*hold)/hold);
     drawScene(context,scenes[frame],frame,(frame+within)/scenes.length);
     if(absolute>=scenes.length*hold){ended=true;resolve();return;}
     requestAnimationFrame(render);
    };requestAnimationFrame(render);
   });
   recorder.stop();await result;stream.getTracks().forEach(track=>track.stop());
  }catch(e:any){setError(e.message||'Could not export demo video');}finally{setRecording(false);}
 }
 const openFeature=()=>{setPlaying(false);if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();onClose();onNavigate(scene.destination,scene.id);};
 return <div className="owner-film-overlay" role="dialog" aria-modal="true" aria-label="Lone Star owner presentation video walkthrough">
  <section className="owner-film-dialog">
   <div className="film-top"><div className="film-logo"><span className="film-logo-star">★</span><div><strong>LONE STAR</strong><small>ACADEMY OS • OWNERSHIP PRESENTATION</small></div></div>
    <div className="film-top-actions"><span className="film-demo-label">100 SYNTHETIC STUDENTS • 50 FUNDING APPLICANTS • 3 CAMPUSES</span><button type="button" onClick={onClose} aria-label="Close owner demo"><X size={22}/></button></div></div>
   <div className="film-screen" aria-live="off">
    <div className="film-light-beam" aria-hidden="true"/><div className="film-watermark">DEMO ONLY · NO REAL STUDENT INFORMATION</div>
    <div key={scene.id} className="film-scene">
      <div className="film-eyebrow"><span className="film-step">{String(index+1).padStart(2,'0')} / {String(scenes.length).padStart(2,'0')}</span><span>{scene.kicker}</span></div>
      <div className="film-journey"><span className="film-journey-persona">FOLLOW JORDAN ELLIS <small>FICTIONAL STUDENT STORY</small></span><div className="film-journey-stages" aria-label="Student lifecycle">{stages.map((label,idx)=><span key={label} className={idx===stageIndex?'current':idx<stageIndex?'complete':''}>{label}</span>)}</div></div>
      <h2>{scene.title}</h2><p className="film-subtitle">{scene.subtitle}</p>
      <div className="film-metric-row">{scene.stats.map((stat,i)=><div className="film-metric" key={i}><strong>{stat}</strong><small>{['CURRENT VIEW','VISIBLE EVIDENCE','KEY OUTCOME'][i]}</small></div>)}</div>
      <div className="film-insights">{scene.highlights.map((item,i)=><div key={i}><CheckCircle2 size={18}/><p>{item}</p></div>)}</div>
      <div className="film-click-path"><strong>HOW TO USE IT:</strong> {clickPaths[scene.id]||'Select Open workflow to inspect this module directly.'}</div><div className="film-narrative"><BookOpen size={18}/><p>{briefNarration}</p></div>
    </div>
    <div className="film-features"><span>LIVE WORKFLOW LINK</span><button type="button" onClick={openFeature}>{scene.feature} <ArrowRight size={15}/></button></div>
   </div>
   <section className="panel" style={{margin:'10px 12px',padding:14,display:'grid',gap:10}} aria-label="Detailed owner review for current presentation chapter">
    <div className="reportactions"><strong>{detail.stage} · {detail.department}</strong><span className="badge">{detail.status}</span></div>
    {showGuide&&<><p><strong>What this department can do:</strong></p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8}}>{detail.capabilities.map((line,i)=><p key={i} style={{padding:8,border:'1px solid #34516d',borderRadius:8}}>✓ {line}</p>)}</div><p><strong>Leadership decision:</strong> {detail.ownerDecision}</p><p><strong>Ask Alisha:</strong> {detail.question}</p></>}
    <div className="reportactions"><button type="button" onClick={()=>setShowGuide(x=>!x)}>{showGuide?'Condense chapter notes':'Expand chapter details'}</button><button type="button" className="primary" onClick={()=>{setPlaying(false);setFeedbackOpen(true)}}>Record feedback / request a feature</button></div>
   </section>
   {feedbackOpen&&<ExecutiveFeedbackBoard chapter={scene.id} onClose={()=>setFeedbackOpen(false)}/>}
   <div className="reportactions" style={{margin:'8px 12px'}}><button type="button" onClick={()=>setExplorerOpen(x=>!x)}>{explorerOpen?'Hide':'Explore'} complete system · {CAPABILITY_COUNT} features</button><span className="muted">Search every department; open a working screen or submit a suggestion.</span></div>
   {explorerOpen&&<CapabilityExplorer onNavigate={(page,id)=>{setPlaying(false);onClose();onNavigate(page,id);}} onReview={id=>{setPlaying(false);const pos=scenes.findIndex(x=>x.id===id);if(pos>=0)setIndex(pos);setFeedbackOpen(true);}}/>
   <div className="film-controls"><p className="muted">Choose a concise executive pitch or a complete department walkthrough. Narration gives the headline; details stay on screen for discussion.</p>
    <div className="film-timeline"><span>{time(currentSeconds)}</span><input aria-label="Presentation progress" type="range" min={0} max={total} step={1000} value={starts[index]+fraction*durations[index]} onChange={e=>{const ms=Number(e.target.value);const choice=starts.findIndex((v,i)=>ms>=v&&ms<v+durations[i]);const target=choice<0?scenes.length-1:choice;const point={index:target,fraction:Math.min(.99,Math.max(0,(ms-starts[target])/durations[target]))};speechPendingRef.current=false;if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();setIndex(point.index);setFraction(point.fraction);}}/><span>{time(totalSeconds)}</span></div>
    <div className="reportactions"><label>Presentation format <select aria-label="Presentation format" value={mode} onChange={e=>{setPlaying(false);setMode(e.target.value as DemoMode);setIndex(0);setFraction(0);setShowGuide(e.target.value==='complete');}}><option value="executive">Executive highlights — 8 outcomes</option><option value="complete">Full guided tour — 27 departments</option></select></label><label>Go directly to a department <select aria-label="Choose executive demo chapter" value={index} onChange={e=>{seek(Number(e.target.value));setPlaying(false);}}>{scenes.map((item,i)=><option value={i} key={item.id}>{String(i+1).padStart(2,'0')} · {item.feature}</option>)}</select></label><button type="button" onClick={()=>{setPlaying(false);setFeedbackOpen(true)}}>Leadership feedback board</button></div>
    <div className="film-buttons"><div><button type="button" aria-label="Previous chapter" onClick={()=>seek(index-1)}><ChevronLeft size={22}/></button>
      <button type="button" className="film-play" onClick={start} aria-label={playing?'Pause walkthrough':'Play walkthrough'}>{playing?<Pause size={22}/>:<Play size={22}/>}</button>
      <button type="button" aria-label="Next chapter" onClick={()=>seek(index+1)}><ChevronRight size={22}/></button>
      <button type="button" onClick={restart} title="Replay from the beginning"><RotateCcw size={18}/> Replay</button></div>
     <div><button type="button" aria-pressed={narrate} onClick={()=>setNarrate(v=>!v)} title="Use system speech to narrate the story">{narrate?<Volume2 size={19}/>:<VolumeX size={19}/>} {narrate?'Narration ON':'Narration OFF'}</button>
      <label className="film-speed-label">Narrator<select aria-label="Narrator voice" value={voiceName} onChange={e=>setVoiceName(e.target.value)} disabled={!voiceReady||!voices.length}>
 {voices.length?voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>):<option value="">Browser voice unavailable</option>}
 </select></label><label className="film-speed-label">Speed<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.85}>Relaxed (0.85×)</option><option value={1}>Natural (1×)</option><option value={1.15}>Brisk (1.15×)</option><option value={1.25}>Quick (1.25×)</option></select></label></div>
    </div>
   </div>
   <div className="film-footer">
    <div><b>Explore the real interface</b><p>Every chapter links to the corresponding school workspace. This presentation uses only fictional student records. Leadership feedback is saved separately and remains available for review.</p></div>
    <div className="film-footer-actions"><button type="button" disabled={recording} onClick={saveFilm}><Download size={17}/>{recording?'Recording a video…':'Create playable video file'}</button>
      <button type="button" className="primary" onClick={openFeature}><Presentation size={18}/> Open {scene.feature}</button></div>
   </div>
   {recording&&<p className="film-recording-note">Recording a slower, readable visual-only version in this browser. Leave this window open until it finishes. This export is silent; enable narration for the interactive walkthrough.</p>}
   {recordedUrl&&<div className="film-recorded"><b>Your demo video is ready.</b><video ref={videoRef} src={recordedUrl} controls playsInline aria-label="Recorded student lifecycle video"/><a href={recordedUrl} download={'LoneStar_AcademyOS_Student_Lifecycle.'+(recordedMime.includes('mp4')?'mp4':'webm')}><Download size={16}/> Save video to this device</a><small>Browser-generated visual recording; voice narration is available in the interactive walkthrough, not the exported file.</small></div>}
   {error&&<p className="error" role="alert">{error}</p>}
   <canvas ref={canvasRef} width={1280} height={720} style={{position:'absolute',width:1,height:1,opacity:0,pointerEvents:'none'}} aria-hidden="true"/>
  </section>
 </div>;
}
