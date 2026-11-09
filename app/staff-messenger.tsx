'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import './staff-messenger.css';
import {Bell,Check,ChevronLeft,Hash,LockKeyhole,MessageCircle,MessageSquarePlus,Search,Send,ShieldCheck,Users,X} from 'lucide-react';

type Person={id:string;name:string;role:string;campusIds:string[]};
type Channel={id:string;kind:string;name:string;campusId:string|null;participants:string[];createdBy?:string;lastAt:string;unread:number;lastMessage?:{preview:string;authorId:string;createdAt:string;priority:string}|null};
type Note={id:string;seq:number;channelId?:string;authorId:string;body:string;replyTo?:string|null;priority:string;createdAt:string};
type Campus={id:string;name:string};
type Props={demo:boolean;role:string;campusId?:string};
const management=new Set(['Owner','Regional admin','Campus manager']);
const network=new Set(['Owner','Regional admin']);
const fixtures:Person[]=[
 {id:'preview-me',name:'You · signed-in employee',role:'Owner',campusIds:['demo-campus-1']},
 {id:'preview-alisha',name:'Avery James',role:'Owner',campusIds:[]},
 {id:'preview-admin',name:'Morgan Lee',role:'Admin assistant',campusIds:['demo-campus-1']},
 {id:'preview-instructor',name:'Taylor Brooks',role:'Instructor',campusIds:['demo-campus-1']},
 {id:'preview-enrollment',name:'Casey Quinn',role:'Enrollment specialist',campusIds:['demo-campus-1']},
 {id:'preview-dallas',name:'Riley Jordan',role:'Campus manager',campusIds:['demo-campus-dallas']}
];
const seedChannels:Channel[]=[
 {id:'sample-school',kind:'school',name:'Schoolwide updates',campusId:null,participants:[],createdBy:'preview-alisha',lastAt:'2026-11-09T14:31:00Z',unread:1,lastMessage:{preview:'Review the weekly launch checklist before Friday.',authorId:'preview-alisha',createdAt:'2026-11-09T14:31:00Z',priority:'important'}},
 {id:'sample-campus',kind:'campus',name:'Greensboro operations',campusId:'demo-campus-1',participants:[],createdBy:'preview-me',lastAt:'2026-11-09T14:25:00Z',unread:2,lastMessage:{preview:'Training yard equipment update is ready.',authorId:'preview-instructor',createdAt:'2026-11-09T14:25:00Z',priority:'normal'}},
 {id:'sample-dm',kind:'direct',name:'Morgan Lee',campusId:null,participants:['preview-me','preview-admin'],lastAt:'2026-11-09T14:20:00Z',unread:0,lastMessage:{preview:'The roster review is ready for sign-off.',authorId:'preview-admin',createdAt:'2026-11-09T14:20:00Z',priority:'normal'}}
];
const seedNotes:Note[]=[
 {id:'s1',seq:1,channelId:'sample-school',authorId:'preview-alisha',body:'Welcome to Academy OS staff messaging. Each campus can coordinate without using a separate app.',priority:'normal',createdAt:'2026-11-09T13:05:00Z'},
 {id:'s2',seq:2,channelId:'sample-school',authorId:'preview-alisha',body:'Review the weekly launch checklist before Friday. Use your assigned campus channel for local updates.',priority:'important',createdAt:'2026-11-09T14:31:00Z'},
 {id:'s3',seq:3,channelId:'sample-campus',authorId:'preview-instructor',body:'The training yard equipment update is ready. I added notes to the handoff board.',priority:'normal',createdAt:'2026-11-09T14:25:00Z'},
 {id:'s4',seq:4,channelId:'sample-campus',authorId:'preview-enrollment',body:'Thanks! I will confirm the classroom roster before the afternoon handoff.',replyTo:'s3',priority:'normal',createdAt:'2026-11-09T14:29:00Z'},
 {id:'s5',seq:5,channelId:'sample-dm',authorId:'preview-admin',body:'The roster review is ready for sign-off.',priority:'normal',createdAt:'2026-11-09T14:20:00Z'}
];
const stamp=(iso:string)=>iso?new Date(iso).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'';
const icon=(kind:string)=>kind==='direct'?<MessageCircle size={18}/>:kind==='group'?<Users size={18}/>:kind==='school'?<Bell size={18}/>:<Hash size={18}/>;

async function request(url:string,data?:unknown){
 const res=await fetch(url,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},...(data?{body:JSON.stringify(data)}:{})});
 const payload=await res.json().catch(()=>({error:'Unexpected server response'}));
 if(!res.ok)throw Error(payload.error||'Messenger request failed');
 return payload;
}
export function MessengerShortcut({onClick,demo=false}:{onClick:()=>void;demo?:boolean}){
 const [unread,setUnread]=useState(0);
 useEffect(()=>{if(demo){setUnread(3);return;}let alive=true;const poll=async()=>{if(document.visibilityState!=='visible')return;try{const data=await request('/api/team-chat');if(alive)setUnread((data.channels||[]).reduce((sum:number,x:Channel)=>sum+x.unread,0));}catch{/* Do not imply a new message if an offline check fails. */}};
 poll();const t=window.setInterval(poll,30000);return()=>{alive=false;clearInterval(t)};},[demo]);
 return <button type="button" className="team-shortcut" onClick={onClick} aria-label={'Open Staff Messenger'+(unread?' · '+unread+' unread messages':'')} title="Staff Messenger"><MessageCircle size={20}/><span>Staff chat</span>{unread>0&&<b aria-label={unread+' unread'}>{Math.min(unread,99)}</b>}</button>;
}
export default function StaffMessenger({demo,role,campusId}:Props){
 const [me,setMe]=useState<Person>(fixtures[0]),[directory,setDirectory]=useState<Person[]>([]),[campuses,setCampuses]=useState<Campus[]>([]);
 const [channels,setChannels]=useState<Channel[]>([]),[activeId,setActiveId]=useState(''),[messages,setMessages]=useState<Note[]>([]);
 const [draft,setDraft]=useState(''),[reply,setReply]=useState<Note|null>(null),[priority,setPriority]=useState(false);
 const [conversationQuery,setConversationQuery]=useState(''),[messageQuery,setMessageQuery]=useState(''),[searchOpen,setSearchOpen]=useState(false);
 const [composer,setComposer]=useState(false),[newKind,setNewKind]=useState('direct'),[newTitle,setNewTitle]=useState(''),[newCampus,setNewCampus]=useState(''),[newPerson,setNewPerson]=useState(''),[newPeople,setNewPeople]=useState<string[]>([]);
 const [working,setWorking]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[refreshTick,setRefreshTick]=useState(0),[older,setOlder]=useState(false);
 const [sampleChannels,setSampleChannels]=useState<Channel[]>(seedChannels),[sampleNotes,setSampleNotes]=useState<Note[]>(seedNotes);
 const tail=useRef<HTMLDivElement|null>(null);
 const demoMe=useMemo(()=>({...fixtures[0],role,campusIds:network.has(role)?[]:[campusId||'demo-campus-1']}),[role,campusId]);
 useEffect(()=>{
  if(!demo)return;
  const list=fixtures.map(x=>x.id==='preview-me'?demoMe:x).filter(x=>x.id==='preview-me'||network.has(role)||network.has(x.role)||x.campusIds.some(id=>demoMe.campusIds.includes(id)));
  setMe(demoMe);setDirectory(list);
  setCampuses([{id:'demo-campus-1',name:'Greensboro · example campus'},{id:'demo-campus-dallas',name:'Dallas · example campus'},{id:'demo-campus-mansfield',name:'Mansfield · example campus'}].filter(x=>network.has(role)||demoMe.campusIds.includes(x.id)));
  setActiveId(id=>id||'sample-campus');
 },[demo,demoMe,role]);
 useEffect(()=>{
  if(demo)return;
  let alive=true;
  const load=async()=>{if(document.visibilityState==='hidden')return;try{
   const value=await request('/api/team-chat');
   if(!alive)return;
   setMe(value.me);setDirectory(value.directory||[]);setCampuses(value.campuses||[]);setChannels(value.channels||[]);
   setActiveId(old=>old&&value.channels.some((x:Channel)=>x.id===old)?old:value.channels[0]?.id||'');
   setError('');
  }catch(e:any){if(alive)setError(e.message||'Unable to load conversations');}};
  load();const interval=window.setInterval(load,12000);
  return()=>{alive=false;clearInterval(interval)};
 },[demo,refreshTick]);
 useEffect(()=>{
  if(demo){const selected=sampleNotes.filter(x=>x.channelId===activeId);setMessages(selected);setOlder(false);return;}
  if(!activeId){setMessages([]);return;}
  let alive=true;
  const load=async()=>{if(document.visibilityState==='hidden')return;try{
   const result=await request('/api/team-chat?channel='+encodeURIComponent(activeId)+(searchOpen&&messageQuery.trim()?'&q='+encodeURIComponent(messageQuery.trim()):''));
   if(!alive)return;
   setMessages(result.messages||[]);
   setOlder((result.messages||[]).length>=80&&!messageQuery.trim());
   if(!messageQuery.trim()){
    const newest=result.messages?.at(-1)?.seq||0;
    if(newest)request('/api/team-chat',{action:'read',channelId:activeId,lastSeq:newest}).catch(()=>{});
   }
  }catch(e:any){if(alive)setError(e.message||'Conversation unavailable');}};
  load();const t=window.setInterval(load,10000);
  return()=>{alive=false;clearInterval(t)};
 },[demo,activeId,refreshTick,searchOpen,messageQuery]);
 useEffect(()=>{if(!searchOpen)tail.current?.scrollIntoView({block:'nearest',behavior:'smooth'});},[activeId,messages.length,searchOpen]);
 const viewChannels=demo?sampleChannels:channels;
 const selected=viewChannels.find(x=>x.id===activeId)||null;
 const people=directory.filter(x=>x.id!==me.id);
 const visibleChannels=viewChannels.filter(c=>c.name.toLowerCase().includes(conversationQuery.toLowerCase())).sort((a,b)=>b.lastAt.localeCompare(a.lastAt));
 const displayMessages=demo&&searchOpen&&messageQuery.trim()?messages.filter(x=>x.body.toLowerCase().includes(messageQuery.trim().toLowerCase())):messages;
 const totalUnread=viewChannels.reduce((n,c)=>n+c.unread,0);
 const canAnnounce=management.has(role);
 const activeMembers=selected?.kind==='direct'||selected?.kind==='group'?selected.participants.map(id=>directory.find(p=>p.id===id)?.name||'Employee').join(' · '):selected?.kind==='school'?'Every active employee':selected?.kind==='campus'?'Employees assigned to this campus':'';
 const lookup=(id:string)=>directory.find(p=>p.id===id)?.name||'Former employee';
 async function submit(data:any){
  if(demo){
   if(data.action==='send'){
    const now=new Date().toISOString(),note:Note={id:crypto.randomUUID(),seq:Math.max(0,...sampleNotes.map(x=>x.seq))+1,channelId:data.channelId,authorId:me.id,body:data.text,replyTo:data.replyTo,priority:data.priority,createdAt:now};
    setSampleNotes(prev=>[...prev,note]);setSampleChannels(prev=>prev.map(x=>x.id===data.channelId?{...x,unread:0,lastAt:now,lastMessage:{preview:note.body,authorId:me.id,createdAt:now,priority:note.priority}}:x));return {ok:true,id:note.id};
   }
   if(data.action==='create'){
    const id='sample-'+crypto.randomUUID(),kind=data.kind;
    const who=directory.find(x=>x.id===data.to);
    const next:Channel={id,kind,name:kind==='direct'?who?.name||'Direct message':data.name,campusId:data.campusId||null,participants:kind==='direct'?[me.id,data.to]:kind==='group'?[me.id,...data.participants]:[],lastAt:new Date().toISOString(),unread:0,createdBy:me.id};
    setSampleChannels(prev=>[next,...prev]);return {ok:true,id};
   }
   if(data.action==='read'){setSampleChannels(prev=>prev.map(x=>x.id===data.channelId?{...x,unread:0}:x));return {ok:true};}
  }
  return request('/api/team-chat',data);
 }
 async function send(){
  const text=draft.trim();if(!selected||!text||working)return;
  setWorking(true);setError('');try{
   await submit({action:'send',channelId:selected.id,text,priority:priority?'important':'normal',replyTo:reply?.id||null,messageId:crypto.randomUUID()});
   setDraft('');setReply(null);setPriority(false);setSearchOpen(false);setMessageQuery('');setRefreshTick(t=>t+1);
  }catch(e:any){setError(e.message);}finally{setWorking(false);}
 }
 async function create(){
  setError('');setNotice('');
  if(newKind==='direct'&&!newPerson){setError('Choose a coworker');return;}
  if(newKind==='group'&&newPeople.length<2){setError('Choose at least two coworkers for a group');return;}
  if(newKind!=='direct'&&newTitle.trim().length<3){setError('Enter a conversation name of at least three characters');return;}
  if(newKind==='campus'&&!newCampus){setError('Choose a campus');return;}
  setWorking(true);try{
   const result=await submit({action:'create',kind:newKind,name:newTitle.trim(),campusId:newCampus,to:newPerson,participants:newPeople});
   setActiveId(result.id);setComposer(false);setNewTitle('');setNewPerson('');setNewPeople([]);setRefreshTick(t=>t+1);
   setNotice('Conversation ready. Your message will stay inside Academy OS.');
  }catch(e:any){setError(e.message);}finally{setWorking(false);}
 }
 async function loadEarlier(){
  if(!selected||demo||!messages.length)return;
  try{const result=await request('/api/team-chat?channel='+encodeURIComponent(activeId)+'&before='+messages[0].seq);
   const incoming:Note[]=result.messages||[];
   setOlder(incoming.length>=80);setMessages(current=>[...incoming.filter(x=>!current.some(m=>m.id===x.id)),...current]);
  }catch(e:any){setError(e.message);}
 }
 function open(id:string){
  setActiveId(id);setReply(null);setSearchOpen(false);setMessageQuery('');setComposer(false);setError('');
  if(demo){submit({action:'read',channelId:id}).catch(()=>{});}
 }
 const createOptions=[{id:'direct',label:'Direct message'},{id:'group',label:'Private group'},...(canAnnounce?[{id:'campus',label:'Campus channel'}]:[]),...(network.has(role)?[{id:'school',label:'Schoolwide channel'}]:[])];
 return <section className="staff-messenger panel" aria-label="Academy OS Staff Messenger">
  <div className="messenger-top"><div><p className="eyebrow">ACADEMY OS · STAFF COMMUNICATION</p><h2><MessageCircle size={26}/> Staff Messenger</h2><p>Conversations, campus channels, and team updates—without leaving the school system.</p></div><div className="messenger-head-actions"><span className="badge">{demo?'FICTIONAL PRACTICE · NO MESSAGES SENT':'INTERNAL STAFF ONLY'}</span><button type="button" className="primary" onClick={()=>{setComposer(true);setError('');}}><MessageSquarePlus size={17}/> New conversation</button></div></div>
  <div className="messenger-security"><ShieldCheck size={17}/><span>Campus and private-chat access is enforced on the server. No student files, Social Security numbers, medical details or sensitive records in chat. Use the restricted student document center.</span></div>
  {error&&<p className="error" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}
  <div className="messenger-layout">
   <aside className="messenger-conversations" aria-label="Conversations"><div className="messenger-list-heading"><b>Messages</b><span>{totalUnread?totalUnread+' unread':'All caught up'}</span></div>
    <label className="messenger-search"><Search size={17}/><input aria-label="Find conversation" value={conversationQuery} onChange={e=>setConversationQuery(e.target.value)} placeholder="Find conversations"/></label>
    <div className="messenger-conversation-items">{visibleChannels.map(c=><button type="button" key={c.id} aria-current={activeId===c.id?'page':undefined} className={'messenger-conversation '+(activeId===c.id?'active':'')} onClick={()=>open(c.id)}>
     <span className={'messenger-channel-icon '+c.kind}>{icon(c.kind)}</span><span className="messenger-conversation-body"><strong>{c.name}</strong><small>{c.lastMessage?.preview||'No messages yet — start the conversation.'}</small></span><span className="messenger-conversation-end"><small>{stamp(c.lastAt)}</small>{c.unread>0&&<b className="messenger-unread">{c.unread}</b>}</span></button>)}
     {!visibleChannels.length&&<p className="messenger-empty">No conversations yet. Create a direct message or a team channel to get started.</p>}</div>
    <div className="messenger-me"><span className="messenger-avatar">ME</span><span><strong>{me.name}</strong><small>{role} · Authorized staff</small></span><LockKeyhole size={17}/></div>
   </aside>
   <div className="messenger-thread">
    {selected?<><div className="messenger-thread-header"><div className="messenger-thread-identity"><span className={'messenger-channel-icon '+selected.kind}>{icon(selected.kind)}</span><div><strong>{selected.name}</strong><small>{activeMembers}</small></div></div><button type="button" aria-label={searchOpen?'Close message search':'Search this conversation'} onClick={()=>{setSearchOpen(s=>!s);setMessageQuery('');}}>{searchOpen?<X size={18}/>:<Search size={18}/>}</button></div>
    {searchOpen&&<label className="messenger-message-search"><Search size={16}/><input aria-label="Search messages" placeholder="Search within this conversation" value={messageQuery} onChange={e=>setMessageQuery(e.target.value)} /></label>}
    <div className="messenger-messages" role="log" aria-label="Messages" aria-live="polite">
     {older&&!messageQuery&&<button className="messenger-load-more" type="button" onClick={loadEarlier}>Load earlier messages</button>}
     {displayMessages.map(m=>{const mine=m.authorId===me.id;const replied=messages.find(x=>x.id===m.replyTo);
      return <article className={'messenger-bubble '+(mine?'mine':'')} key={m.id}>
       {!mine&&<span className="messenger-avatar">{lookup(m.authorId).split(' ').map(x=>x[0]).join('').slice(0,2)}</span>}
       <div className="messenger-bubble-content"><div className="messenger-message-meta"><strong>{mine?'You':lookup(m.authorId)}</strong><time dateTime={m.createdAt}>{stamp(m.createdAt)}</time>{m.priority==='important'&&<span className="messenger-important"><Bell size={12}/> Important</span>}</div>
        {m.replyTo&&<div className="messenger-reply-quote"><ChevronLeft size={13}/>{replied?replied.body.slice(0,130):'Reply to an earlier message'}</div>}
        <p>{m.body}</p><button type="button" className="messenger-reply-btn" onClick={()=>setReply(m)}>Reply</button>
       </div>
      </article>;
     })}
     {!displayMessages.length&&<div className="messenger-thread-empty"><MessageCircle size={32}/><b>{searchOpen?'No matching messages':'Conversation starts here'}</b><p>{searchOpen?'Try another search term.':'Send a message to keep your team aligned.'}</p></div>}
     <div ref={tail}/>
    </div>
    <div className="messenger-compose">
     {reply&&<div className="messenger-reply-target"><span>Replying to {lookup(reply.authorId)}: {reply.body.slice(0,100)}</span><button type="button" onClick={()=>setReply(null)} aria-label="Cancel reply"><X size={16}/></button></div>}
     <label htmlFor="academy-staff-message" className="sr-only">Write a staff message</label>
     <textarea id="academy-staff-message" rows={3} maxLength={4000} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder={'Message '+selected.name+'… (Enter to send, Shift+Enter for new line)'}/>
     <div className="messenger-compose-actions"><div>{canAnnounce&&<label className="messenger-priority"><input type="checkbox" checked={priority} onChange={e=>setPriority(e.target.checked)}/><Bell size={15}/> Mark important</label>}<small>{draft.length}/4,000 characters</small></div><button className="primary" type="button" onClick={send} disabled={!draft.trim()||working}><Send size={16}/>{working?'Sending…':'Send message'}</button></div>
    </div></>:<div className="messenger-thread-empty"><MessageCircle size={38}/><h3>Bring your people together</h3><p>Create a channel or select a conversation to send your first internal school message.</p><button type="button" className="primary" onClick={()=>setComposer(true)}>Start a conversation</button></div>}
   </div>
  </div>
  {composer&&<div className="messenger-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setComposer(false);}}><section className="messenger-new panel" role="dialog" aria-modal="true" aria-label="Start a staff conversation"><div className="sectionhead"><div><p className="eyebrow">STAFF MESSENGER</p><h3>New conversation</h3></div><button type="button" aria-label="Close" onClick={()=>setComposer(false)}><X size={20}/></button></div>
    <label>Conversation type<select value={newKind} onChange={e=>setNewKind(e.target.value)}>{createOptions.map(x=><option value={x.id} key={x.id}>{x.label}</option>)}</select></label>
    {newKind==='direct'?<label>Send to<select value={newPerson} onChange={e=>setNewPerson(e.target.value)}><option value="">Choose an employee</option>{people.map(x=><option value={x.id} key={x.id}>{x.name} · {x.role}</option>)}</select></label>:
     <><label>Conversation name<input value={newTitle} maxLength={70} onChange={e=>setNewTitle(e.target.value)} placeholder={newKind==='campus'?'Greensboro operations':newKind==='school'?'Schoolwide announcements':'Admissions and instructors'}/></label>
     {newKind==='campus'&&<label>Campus<select value={newCampus} onChange={e=>setNewCampus(e.target.value)}><option value="">Choose an active campus</option>{campuses.map(x=><option value={x.id} key={x.id}>{x.name}</option>)}</select></label>}
     {newKind==='group'&&<fieldset><legend>Select at least two coworkers</legend><div className="messenger-member-picker">{people.map(x=><label key={x.id}><input type="checkbox" checked={newPeople.includes(x.id)} onChange={e=>setNewPeople(prev=>e.target.checked?[...prev,x.id]:prev.filter(id=>id!==x.id))}/><span>{x.name}<small>{x.role}</small></span></label>)}</div></fieldset>}</>}
    <p className="muted">{newKind==='school'?'Visible to every active staff account at every campus.':newKind==='campus'?'Visible to all active staff assigned to this campus.':newKind==='group'?'Only selected members can read this private group.':'Only you and the selected coworker can read this direct message.'}</p>
    <div className="reportactions"><button type="button" onClick={()=>setComposer(false)}>Cancel</button><button className="primary" type="button" disabled={working} onClick={create}><Check size={16}/> {working?'Creating…':'Create conversation'}</button></div>
   </section></div>}
 </section>;
}
