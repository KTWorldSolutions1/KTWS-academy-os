'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,BookOpen,ChevronLeft,ChevronRight,Download,Maximize2,Pause,Play,RotateCcw,Volume2,VolumeX,X,Presentation,CheckCircle2,ShieldCheck} from 'lucide-react';
import {DEMO_SCENES,DEMO_FRAME_MS,DEMO_RUNTIME_SECONDS,type DemoScene} from '../lib/presentation-demo';

type Props={onClose:()=>void;onNavigate:(id:string)=>void;};
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
 const [playing,setPlaying]=useState(true),[index,setIndex]=useState(0),[fraction,setFraction]=useState(0),[narrate,setNarrate]=useState(false),[speed,setSpeed]=useState(1),[recording,setRecording]=useState(false),[recordedUrl,setRecordedUrl]=useState(''),[error,setError]=useState('');
 const lastClock=useRef<number>(0),canvasRef=useRef<HTMLCanvasElement|null>(null),videoRef=useRef<HTMLVideoElement|null>(null);
 const scene=DEMO_SCENES[index];
 const indexRef=useRef(index),playingRef=useRef(playing),progressRef=useRef(fraction),speedRef=useRef(speed);
 indexRef.current=index;playingRef.current=playing;progressRef.current=fraction;speedRef.current=speed;
 useEffect(()=>{
  if(!playing)return;
  lastClock.current=performance.now();
  const t=window.setInterval(()=>{
   const now=performance.now(),step=Math.min(450,now-lastClock.current)*speedRef.current;lastClock.current=now;
   const absolute=(indexRef.current+progressRef.current)*DEMO_FRAME_MS+step;
   if(absolute>=DEMO_SCENES.length*DEMO_FRAME_MS){setIndex(DEMO_SCENES.length-1);setFraction(1);setPlaying(false);return;}
   const next=Math.floor(absolute/DEMO_FRAME_MS);setIndex(next);setFraction((absolute/DEMO_FRAME_MS)-next);
  },75);
  return()=>clearInterval(t);
 },[playing]);
 useEffect(()=>{
  if(!narrate||!playing||typeof speechSynthesis==='undefined')return;
  speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(scene.narration);
  utterance.rate=Math.min(1.25,Math.max(.85,speed));utterance.pitch=1;utterance.volume=.9;
  speechSynthesis.speak(utterance);
  return()=>speechSynthesis.cancel();
 },[index,narrate,playing,speed]);
 useEffect(()=>()=>{if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();},[]);
 useEffect(()=>()=>{if(recordedUrl)URL.revokeObjectURL(recordedUrl);},[recordedUrl]);
 useEffect(()=>{function esc(e:KeyboardEvent){if(e.key==='Escape')onClose();if(e.key===' '){e.preventDefault();setPlaying(p=>!p);}}
  window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc);
 },[onClose]);
 const currentSeconds=(index+fraction)*DEMO_FRAME_MS/1000,totalSeconds=DEMO_SCENES.length*DEMO_FRAME_MS/1000;
 function seek(next:number){setIndex(Math.max(0,Math.min(DEMO_SCENES.length-1,next)));setFraction(0);lastClock.current=performance.now();}
 function restart(){seek(0);setPlaying(true);}
 function start(){if(index===DEMO_SCENES.length-1&&fraction>=.99)restart();else setPlaying(v=>!v);}
 async function saveFilm(){
  setError('');if(recording)return;
  const canvas=canvasRef.current;
  if(!canvas||typeof MediaRecorder==='undefined'||!('captureStream' in canvas)){setError('Video recording is not supported on this browser. The narrated on-screen walkthrough still works.');return;}
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
     const url=URL.createObjectURL(new Blob(blobs,{type}));setRecordedUrl(url);resolve();
   };});
   recorder.start(250);
   // Fast-export film is approximately 30 seconds and has readable on-screen text.
   const hold=2200;const startAt=performance.now();
   await new Promise<void>(resolve=>{
    let ended=false;
    const render=(now:number)=>{
     if(ended)return;
     const absolute=now-startAt,frame=Math.min(DEMO_SCENES.length-1,Math.floor(absolute/hold));
     const within=Math.min(1,(absolute-frame*hold)/hold);
     drawScene(context,DEMO_SCENES[frame],frame,(frame+within)/DEMO_SCENES.length);
     if(absolute>=DEMO_SCENES.length*hold){ended=true;resolve();return;}
     requestAnimationFrame(render);
    };requestAnimationFrame(render);
   });
   recorder.stop();await result;stream.getTracks().forEach(track=>track.stop());
  }catch(e:any){setError(e.message||'Could not export demo video');}finally{setRecording(false);}
 }
 const openFeature=()=>{setPlaying(false);if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();onClose();onNavigate(scene.destination);};
 return <div className="owner-film-overlay" role="dialog" aria-modal="true" aria-label="Lone Star owner presentation video walkthrough">
  <section className="owner-film-dialog">
   <div className="film-top"><div className="film-logo"><span className="film-logo-star">★</span><div><strong>LONE STAR</strong><small>ACADEMY OS • OWNERSHIP PRESENTATION</small></div></div>
    <div className="film-top-actions"><span className="film-demo-label">100 SYNTHETIC STUDENTS • 50 FUNDING APPLICANTS • 3 CAMPUSES</span><button type="button" onClick={onClose} aria-label="Close owner demo"><X size={22}/></button></div></div>
   <div className="film-screen" aria-live="off">
    <div className="film-light-beam" aria-hidden="true"/><div className="film-watermark">DEMO ONLY · NO REAL STUDENT INFORMATION</div>
    <div key={scene.id} className="film-scene">
      <div className="film-eyebrow"><span className="film-step">{scene.step} / {String(DEMO_SCENES.length).padStart(2,'0')}</span><span>{scene.kicker}</span></div>
      <h2>{scene.title}</h2><p className="film-subtitle">{scene.subtitle}</p>
      <div className="film-metric-row">{scene.stats.map((stat,i)=><div className="film-metric" key={i}><strong>{stat}</strong><small>{['CURRENT VIEW','VISIBLE EVIDENCE','KEY OUTCOME'][i]}</small></div>)}</div>
      <div className="film-insights">{scene.highlights.map((item,i)=><div key={i}><CheckCircle2 size={18}/><p>{item}</p></div>)}</div>
      <div className="film-narrative"><BookOpen size={18}/><p>{scene.narration}</p></div>
    </div>
    <div className="film-features"><span>LIVE WORKFLOW LINK</span><button type="button" onClick={openFeature}>{scene.feature} <ArrowRight size={15}/></button></div>
   </div>
   <div className="film-controls">
    <div className="film-timeline"><span>{time(currentSeconds)}</span><input aria-label="Video progress" type="range" min={0} max={DEMO_SCENES.length*1000} value={(index+fraction)*1000} onChange={e=>{const x=Number(e.target.value)/1000;setIndex(Math.min(DEMO_SCENES.length-1,Math.floor(x)));setFraction(Math.min(.999,x%1));}}/><span>{time(totalSeconds)}</span></div>
    <div className="film-buttons"><div><button type="button" aria-label="Previous chapter" onClick={()=>seek(index-1)}><ChevronLeft size={22}/></button>
      <button type="button" className="film-play" onClick={start} aria-label={playing?'Pause walkthrough':'Play walkthrough'}>{playing?<Pause size={22}/>:<Play size={22}/>}</button>
      <button type="button" aria-label="Next chapter" onClick={()=>seek(index+1)}><ChevronRight size={22}/></button>
      <button type="button" onClick={restart} title="Replay from the beginning"><RotateCcw size={18}/> Replay</button></div>
     <div><button type="button" aria-pressed={narrate} onClick={()=>setNarrate(v=>!v)} title="Use system speech to narrate the story">{narrate?<Volume2 size={19}/>:<VolumeX size={19}/>} {narrate?'Narration ON':'Narration OFF'}</button>
      <label className="film-speed-label">Speed<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={.75}>0.75×</option><option value={1}>1×</option><option value={1.25}>1.25×</option><option value={1.5}>1.5×</option></select></label></div>
    </div>
   </div>
   <div className="film-footer">
    <div><b>Explore the real interface</b><p>Every chapter links to the corresponding school workspace. This presentation uses only fictional records.</p></div>
    <div className="film-footer-actions"><button type="button" disabled={recording} onClick={saveFilm}><Download size={17}/>{recording?'Recording a video…':'Create playable video file'}</button>
      <button type="button" className="primary" onClick={openFeature}><Presentation size={18}/> Open {scene.feature}</button></div>
   </div>
   {recording&&<p className="film-recording-note">Recording the animated story to a local video file in this browser. Leave this window open until it finishes. This export is silent; enable narration for the interactive walkthrough.</p>}
   {recordedUrl&&<div className="film-recorded"><b>Your demo video is ready.</b><video ref={videoRef} src={recordedUrl} controls playsInline aria-label="Recorded student lifecycle video"/><a href={recordedUrl} download={'LoneStar_AcademyOS_Student_Lifecycle.'+(recordedUrl&&recordedUrl.length?'webm':'webm')}><Download size={16}/> Save video to this device</a><small>Browser-generated visual recording; voice narration is available in the interactive walkthrough, not the exported file.</small></div>}
   {error&&<p className="error" role="alert">{error}</p>}
   <canvas ref={canvasRef} width={1280} height={720} style={{position:'absolute',width:1,height:1,opacity:0,pointerEvents:'none'}} aria-hidden="true"/>
  </section>
 </div>;
}
