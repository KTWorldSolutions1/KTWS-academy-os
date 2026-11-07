'use client';
import {useEffect,useRef,useState} from 'react';
import {Play,Pause,Volume2,VolumeX,X,ChevronLeft,ChevronRight,Download,Maximize2} from 'lucide-react';
import {ACADEMY_OWNER_TOUR,TOUR_DURATION_SECONDS,tourAtTime,tourStart} from '../lib/presentation-scenes';
type Props={onClose:()=>void;onExplore:(page:string)=>void};
function safeVoice(text:string){if(typeof window==='undefined'||!('speechSynthesis' in window))return;
 window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(text);voice.lang='en-US';voice.rate=0.96;voice.pitch=1;window.speechSynthesis.speak(voice);}
function roundBox(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,color:string){
 c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();
}
function wrap(c:CanvasRenderingContext2D,value:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines=3){
 let row='',n=0;for(const word of value.split(' ')){const test=row?row+' '+word:word;
  if(c.measureText(test).width>maxWidth&&row){c.fillText(row,x,y);y+=lineHeight;n++;row=word;if(n>=maxLines)return;}else row=test;}
 if(row)c.fillText(row,x,y);
}
function paint(canvas:HTMLCanvasElement,seconds:number){
 const ctx=canvas.getContext('2d');if(!ctx)return;const w=1280,h=720;
 const {scene,index,progress}=tourAtTime(seconds);
 const bg=ctx.createLinearGradient(0,0,1280,720);bg.addColorStop(0,'#080d15');bg.addColorStop(1,'#172634');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 // Branded top chrome.
 ctx.fillStyle='#0e1925';ctx.fillRect(0,0,w,85);ctx.fillStyle='#273e53';ctx.fillRect(0,83,w,2);
 roundBox(ctx,40,25,36,36,8,'#0872b7');ctx.fillStyle='#ffffff';ctx.font='bold 21px Arial';ctx.fillText('★',47,50);
 ctx.font='bold 22px Arial';ctx.fillText('LONE STAR',92,44);ctx.font='12px Arial';ctx.fillStyle='#aebbc9';ctx.fillText('TRUCK DRIVING ACADEMY  /  ACADEMY OS',93,63);
 roundBox(ctx,1015,28,230,30,16,'#193a51');ctx.fillStyle='#7dd5ff';ctx.font='bold 12px Arial';ctx.fillText('OWNER PRESENTATION • DEMO',1027,49);
 // Blue-slate navigation.
 roundBox(ctx,28,108,246,559,14,'#111c27');ctx.fillStyle='#a4b2c2';ctx.font='bold 12px Arial';ctx.fillText('STUDENT JOURNEY',51,143);
 const short=['School network','Lead & funding','Two-week starts','Private file vault','DMV first-day roster','ELDT classroom','Knowledge diagnostics','Student 360','Roles & tasks','Pilot decision'];
 for(let i=0;i<short.length;i++){
  const top=159+i*45;
  if(i===index)roundBox(ctx,40,top,220,37,8,'#0d4a70');
  ctx.fillStyle=i===index?'#ffffff':'#9eacbc';ctx.font=(i===index?'bold ':'')+'14px Arial';
  ctx.fillText(String(i+1).padStart(2,'0'),51,top+24);ctx.fillText(short[i],87,top+24);
 }
 // Content area.
 ctx.fillStyle='#69c7fb';ctx.font='bold 14px Arial';ctx.fillText(scene.eyebrow,311,147);
 ctx.fillStyle='#f8fafc';ctx.font='bold 37px Arial';wrap(ctx,scene.title,311,199,895,44,2);
 ctx.fillStyle='#b3c1cf';ctx.font='18px Arial';wrap(ctx,scene.subtitle,312,279,900,26,2);
 roundBox(ctx,310,321,260,107,14,'#126ca8');ctx.fillStyle='#fff';ctx.font='bold 43px Arial';ctx.fillText(scene.metric,331,380);
 ctx.fillStyle='#d7edfb';ctx.font='14px Arial';wrap(ctx,scene.metricLabel,333,402,210,18,2);
 roundBox(ctx,583,321,628,107,14,'#132434');ctx.fillStyle='#e6eef5';ctx.font='bold 19px Arial';ctx.fillText('BUILT FOR REAL CAMPUS OPERATIONS',605,353);
 ctx.fillStyle='#a9bdcd';ctx.font='15px Arial';
 wrap(ctx,'One connected journey from admissions to graduation. Actual staff access and regulatory filings require approved controls.',605,382,580,23,2);
 for(let i=0;i<3;i++){
  const y=447+i*58;roundBox(ctx,310,y,902,47,8,i===Math.floor(progress*3)?'#183d56':'#152534');
  ctx.fillStyle='#60c7ff';ctx.font='bold 15px Arial';ctx.fillText('✓',329,y+28);
  ctx.fillStyle='#f0f5f9';ctx.font='15px Arial';wrap(ctx,scene.bullets[i],353,y+29,823,21,2);
 }
 roundBox(ctx,310,642,902,36,7,'#0e2c41');ctx.fillStyle='#8dd8ff';ctx.font='bold 13px Arial';ctx.fillText(scene.tag,330,666);
 ctx.fillStyle='#465c70';ctx.fillRect(310,694,902,5);ctx.fillStyle='#22a0e0';ctx.fillRect(310,694,Math.max(2,902*Math.min(1,seconds/TOUR_DURATION_SECONDS)),5);
}
function timeLabel(value:number){return Math.floor(value/60)+':'+String(Math.floor(value%60)).padStart(2,'0');}
export default function PresentationTour({onClose,onExplore}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),video=useRef<HTMLVideoElement>(null),last=useRef(0),position=useRef(0),playingRef=useRef(true),voiceRef=useRef(false),sceneRef=useRef(-1),recRef=useRef<MediaRecorder|null>(null),chunks=useRef<Blob[]>([]);
 const [time,setTime]=useState(0),[playing,setPlaying]=useState(true),[voice,setVoice]=useState(false),[captureSupported,setCaptureSupported]=useState(false),[exporting,setExporting]=useState(false);
 const {scene,index}=tourAtTime(time);
 function seek(to:number){position.current=Math.max(0,Math.min(TOUR_DURATION_SECONDS-.01,to));setTime(position.current);sceneRef.current=-1;if(voiceRef.current)window.speechSynthesis?.cancel();paint(canvas.current!,position.current);}
 function toggle(){const next=!playingRef.current;playingRef.current=next;setPlaying(next);if(!next)window.speechSynthesis?.cancel();else sceneRef.current=-1;}
 function narrate(){const next=!voiceRef.current;voiceRef.current=next;setVoice(next);window.speechSynthesis?.cancel();if(next)safeVoice(tourAtTime(position.current).scene.narration);}
 useEffect(()=>{
  if(!canvas.current)return;
  const el=canvas.current;paint(el,0);
  if(typeof el.captureStream==='function'&&video.current){
   try{const stream=el.captureStream(24);video.current.srcObject=stream;setCaptureSupported(true);video.current.play().catch(()=>{setCaptureSupported(false);});}catch{setCaptureSupported(false);}
  }
  let raf=0;
  function frame(ms:number){
   if(last.current===0)last.current=ms;
   let delta=Math.min(.07,(ms-last.current)/1000);last.current=ms;
   if(playingRef.current){
    position.current=Math.min(TOUR_DURATION_SECONDS,position.current+delta);
    const current=tourAtTime(position.current);
    if(current.index!==sceneRef.current){
     sceneRef.current=current.index;if(voiceRef.current)safeVoice(current.scene.narration);
    }
    if(position.current>=TOUR_DURATION_SECONDS){playingRef.current=false;setPlaying(false);window.speechSynthesis?.cancel();}
   }
   paint(el,Math.min(position.current,TOUR_DURATION_SECONDS-.0001));
   setTime(position.current);
   raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  const exit=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};
  window.addEventListener('keydown',exit);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('keydown',exit);window.speechSynthesis?.cancel();
   recRef.current?.stop();if(video.current?.srcObject)(video.current.srcObject as MediaStream).getTracks().forEach(t=>t.stop());};
 },[]);
 async function downloadRecording(){
  if(!canvas.current?.captureStream||typeof MediaRecorder==='undefined'){return;}
  const stream=canvas.current.captureStream(24);
  const type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'';
  if(!type){stream.getTracks().forEach(t=>t.stop());return;}
  seek(0);playingRef.current=true;setPlaying(true);setExporting(true);chunks.current=[];
  try{
   const media=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:1600000});recRef.current=media;
   media.ondataavailable=e=>{if(e.data.size)chunks.current.push(e.data);};
   media.onstop=()=>{
    stream.getTracks().forEach(t=>t.stop());setExporting(false);
    if(!chunks.current.length)return;
    const blob=new Blob(chunks.current,{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='Lone-Star-Academy-OS-Owner-Tour.webm';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
   };
   media.start(1000);
   const finish=()=>{if(media.state==='recording'&&position.current>=TOUR_DURATION_SECONDS-.02)media.stop();else if(media.state==='recording')setTimeout(finish,500);};
   setTimeout(finish,1000);
  }catch{setExporting(false);stream.getTracks().forEach(t=>t.stop());}
 }
 return <div className="owner-tour-overlay" role="dialog" aria-modal="true" aria-label="Lone Star Academy OS owner demo video">
  <section className="owner-tour-dialog"><header className="owner-tour-header"><div><strong>★ LONE STAR ACADEMY OS</strong><span>Owner presentation • fictional practice school • {timeLabel(TOUR_DURATION_SECONDS)}</span></div><button onClick={onClose} aria-label="Close owner demo"><X size={23}/></button></header>
  <div className="owner-tour-screen" aria-label="Animated student lifecycle walkthrough">
    <canvas ref={canvas} width={1280} height={720} className={captureSupported?'owner-tour-canvas-hidden':'owner-tour-canvas-fallback'} aria-label={'Chapter '+(index+1)+': '+scene.title}/>
    <video ref={video} muted playsInline autoPlay className={captureSupported?'owner-tour-video':'owner-tour-video-hidden'} aria-label="Playing Lone Star student journey demo video"/>
  </div>
  <div className="owner-tour-controls">
   <button onClick={()=>seek(Math.max(0,tourStart(index-1)))} title="Previous chapter"><ChevronLeft size={20}/></button>
   <button className="owner-tour-play" onClick={toggle}>{playing?<Pause size={20}/>:<Play size={20}/>} {playing?'Pause':'Play video'}</button>
   <button onClick={()=>seek(tourStart(index+1))} title="Next chapter"><ChevronRight size={20}/></button>
   <label className="owner-tour-seek"><span className="sr-only">Scrub video position</span><input type="range" min={0} max={TOUR_DURATION_SECONDS} step={.1} value={Math.min(time,TOUR_DURATION_SECONDS)} onChange={e=>seek(Number(e.target.value))}/></label>
   <span className="owner-tour-clock">{timeLabel(time)} / {timeLabel(TOUR_DURATION_SECONDS)}</span>
   <button onClick={narrate} title={voice?'Disable narration':'Enable narration'}>{voice?<Volume2 size={20}/>:<VolumeX size={20}/>}</button>
   <button onClick={downloadRecording} disabled={exporting||!captureSupported||typeof MediaRecorder==='undefined'} title="Record and save a WebM video of the full tour"><Download size={18}/> {exporting?'Recording…':'Save video'}</button>
  </div>
  <div className="owner-tour-notes"><div><b>Chapter {index+1} of {ACADEMY_OWNER_TOUR.length}: {scene.title}</b><p>{scene.narration}</p></div><button className="primary" onClick={()=>onExplore(scene.featurePage)}>Explore this screen in sample data</button></div>
  <div className="owner-tour-chapters">{ACADEMY_OWNER_TOUR.map((s,i)=><button key={s.id} className={index===i?'active':''} onClick={()=>seek(tourStart(i))}>{String(i+1).padStart(2,'0')} {s.eyebrow.split('/ ')[1]}</button>)}</div>
  <p className="owner-tour-disclaimer">This is an animated, captioned walkthrough generated in the browser, not a recording of real students or a regulatory certification. Use voice narration optionally. “Save video” records a silent WebM of the walkthrough on supported desktop browsers. Student accounts, storage and DMV integrations remain subject to security and compliance acceptance.</p>
  </section>
 </div>;
}
