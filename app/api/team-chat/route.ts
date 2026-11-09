import {getWorkspaceAccess} from '../../../lib/workspace-access';
import {database} from '../../../lib/storage';

/** Internal staff-only communication. Distinct from outbound student SMS/email.
 * Never trust role, campus, author or membership sent by the browser.
 * An authenticated school employee is the only possible principal.
 */
type Employee={id:string;name:string;role:string;campusIds:string[]};
type Channel={id:string;kind:string;name:string;campus_id:string|null;participants:string;created_by:string;created_at:string;last_at:string};
const management=new Set(['Owner','Regional admin','Campus manager']);
const networkRoles=new Set(['Owner','Regional admin']);
const allowedKinds=new Set(['school','campus','group','direct']);
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const fail=(message:string,status=400)=>json({error:message},status);
const getParticipants=(row:Channel):string[]=>{try{const ids=JSON.parse(row.participants);return Array.isArray(ids)?ids:[];}catch{return [];}};
const isNetwork=(role:string)=>networkRoles.has(role);
const overlap=(a:Employee,b:Employee)=>a.campusIds.some(x=>b.campusIds.includes(x));
const canContact=(from:Employee,to:Employee)=>from.id!==to.id&&(isNetwork(from.role)||isNetwork(to.role)||overlap(from,to));
const canView=(c:Channel,me:Employee)=>c.kind==='school'||c.kind==='campus'&&(isNetwork(me.role)||me.campusIds.includes(c.campus_id||''))||['group','direct'].includes(c.kind)&&getParticipants(c).includes(me.id);
function displayName(row:any){const name=String(row?.name||'').trim();return name.slice(0,90)||'School employee';}
async function context(){
 const access=await getWorkspaceAccess();if(!access)return null;
 const db=database(),r:any=await db.prepare("SELECT a.id,a.email,r.payload FROM accounts a JOIN records r ON r.owner='academy-owner' AND r.kind='staff' AND lower(json_extract(r.payload,'$.email'))=lower(a.email) WHERE a.active=1 AND json_extract(r.payload,'$.status')='Active'").all();
 const directory:Employee[]=(r.results||[]).map((row:any)=>{const p=JSON.parse(row.payload);return {id:row.id,name:displayName(p),role:p.accessRole==='School owner'?'Owner':p.accessRole,campusIds:Array.isArray(p.campusIds)?p.campusIds:[]};}).filter((x:Employee)=>Boolean(x.role));
 if(!directory.some(x=>x.id==='academy-owner')){const owner:any=await db.prepare("SELECT id,email FROM accounts WHERE id='academy-owner' AND active=1").first();if(owner)directory.unshift({id:'academy-owner',name:'School Owner',role:'Owner',campusIds:[]});}
 const me=directory.find(x=>x.id===access.user.userId);
 if(!me)return null;
 // Staff role/campuses come from the active server-side school record, not the client.
 me.role=access.role;
 me.campusIds=access.campusIds;
 return {access,db,directory,me};
}
async function channelOrNull(db:any,id:string){
 if(!id||id.length>200)return null;
 return await db.prepare('SELECT * FROM academy_team_channels WHERE id=?').bind(id).first() as Channel|null;
}
async function channelList(c:NonNullable<Awaited<ReturnType<typeof context>>>){
 const rows:any=await c.db.prepare('SELECT * FROM academy_team_channels ORDER BY last_at DESC LIMIT 500').all();
 const visible=(rows.results as Channel[]).filter(row=>allowedKinds.has(row.kind)&&canView(row,c.me)).slice(0,120);
 const list=[];
 for(const row of visible){
  const last:any=await c.db.prepare('SELECT seq,body,author_id,created_at,priority FROM academy_team_messages WHERE channel_id=? ORDER BY seq DESC LIMIT 1').bind(row.id).first();
  const seen:any=await c.db.prepare('SELECT last_seq FROM academy_team_reads WHERE channel_id=? AND account_id=?').bind(row.id,c.me.id).first();
  const unread:any=await c.db.prepare('SELECT COUNT(*) AS count FROM academy_team_messages WHERE channel_id=? AND seq>? AND author_id<>?').bind(row.id,Number(seen?.last_seq||0),c.me.id).first();
  list.push({id:row.id,kind:row.kind,name:row.kind==='direct'?c.directory.find(p=>p.id!==c.me.id&&getParticipants(row).includes(p.id))?.name||'Direct conversation':row.name,campusId:row.campus_id,participants:getParticipants(row),createdBy:row.created_by,lastAt:row.last_at,unread:Number(unread?.count||0),lastMessage:last?{preview:String(last.body).slice(0,100),authorId:last.author_id,createdAt:last.created_at,priority:last.priority}:null});
 }
 return list;
}
export async function GET(req:Request){
 try{
  const c=await context();if(!c)return fail('Sign in with an active staff account',401);
  const u=new URL(req.url),id=u.searchParams.get('channel');
  if(!id){
   const campuses:any=await c.db.prepare("SELECT id,json_extract(payload,'$.name') AS name FROM records WHERE owner='academy-owner' AND kind='campuses' AND json_extract(payload,'$.status')='Active'").all();
   return json({me:c.me,directory:c.directory.filter(e=>e.id===c.me.id||canContact(c.me,e)),campuses:campuses.results.filter((x:any)=>isNetwork(c.me.role)||c.me.campusIds.includes(x.id)),channels:await channelList(c)});
  }
  const ch=await channelOrNull(c.db,id);
  if(!ch||!canView(ch,c.me))return fail('Conversation unavailable',404);
  const before=Number(u.searchParams.get('before')||0);
  if(before!==0&&(!Number.isSafeInteger(before)||before<1))return fail('Invalid message cursor');
  const term=(u.searchParams.get('q')||'').trim();
  if(term.length>100)return fail('Search is limited to 100 characters');
  const query=term?
   c.db.prepare('SELECT seq,id,channel_id,author_id,body,reply_to,priority,created_at FROM academy_team_messages WHERE channel_id=? AND instr(lower(body),lower(?))>0 ORDER BY seq DESC LIMIT 80').bind(id,term):
   before?c.db.prepare('SELECT seq,id,channel_id,author_id,body,reply_to,priority,created_at FROM academy_team_messages WHERE channel_id=? AND seq<? ORDER BY seq DESC LIMIT 80').bind(id,before):
   c.db.prepare('SELECT seq,id,channel_id,author_id,body,reply_to,priority,created_at FROM academy_team_messages WHERE channel_id=? ORDER BY seq DESC LIMIT 80').bind(id);
  const messages:any=await query.all(),reads:any=await c.db.prepare('SELECT account_id,last_seq FROM academy_team_reads WHERE channel_id=?').bind(id).all();
  return json({channel:{id:ch.id,kind:ch.kind,name:ch.name,campusId:ch.campus_id,participants:getParticipants(ch)},messages:(messages.results||[]).reverse().map((m:any)=>({id:m.id,seq:m.seq,authorId:m.author_id,body:m.body,replyTo:m.reply_to,priority:m.priority,createdAt:m.created_at})),reads:reads.results});
 }catch(e){console.error('Staff messenger read failed',e);return fail('Messenger temporarily unavailable',503);}
}
export async function POST(req:Request){
 try{
  const c=await context();if(!c)return fail('Sign in with an active staff account',401);
  if(req.headers.get('origin')!==new URL(req.url).origin)return fail('Invalid origin',403);
  const body:any=await req.json(),action=String(body?.action||'');
  if(action==='create'){
   const kind=String(body.kind||'');
   if(!['campus','school','group','direct'].includes(kind))return fail('Unknown conversation type');
   let id=crypto.randomUUID(),name='',campusId:string|null=null,participants:string[]=[];
   if(kind==='school'){
    if(!isNetwork(c.me.role))return fail('Only school leadership can create a schoolwide channel',403);
    name=String(body.name||'').trim().slice(0,70);
   }else if(kind==='campus'){
    if(!management.has(c.me.role))return fail('A campus manager must create campus-wide channels',403);
    campusId=String(body.campusId||'');
    if(!isNetwork(c.me.role)&&!c.me.campusIds.includes(campusId))return fail('Campus access denied',403);
    const campus:any=await c.db.prepare("SELECT id FROM records WHERE owner='academy-owner' AND kind='campuses' AND id=? AND json_extract(payload,'$.status')='Active'").bind(campusId).first();
    if(!campus)return fail('Choose an active school campus',400);
    name=String(body.name||'').trim().slice(0,70);
   }else if(kind==='direct'){
    const to=c.directory.find(e=>e.id===body.to);
    if(!to||!canContact(c.me,to))return fail('Employee is not available for a direct message',403);
    participants=[c.me.id,to.id].sort();
    id='dm:'+participants.join(':');name='Direct message';
   }else{
    const chosen=Array.isArray(body.participants)?body.participants:[];
    if(chosen.length>30||chosen.some((x:any)=>typeof x!=='string'))return fail('Choose up to 30 employees');
    participants=[...new Set([c.me.id,...chosen])];
    if(participants.length<3)return fail('Group chats require you and at least two coworkers');
    if(participants.some(uid=>!c.directory.some(e=>e.id===uid&&(uid===c.me.id||canContact(c.me,e)))))return fail('Group contains an employee outside your allowed campuses',403);
    name=String(body.name||'').trim().slice(0,70);
   }
   if(kind!=='direct'&&(name.length<3||name.length>70))return fail('Give the conversation a name of 3–70 characters');
   const when=new Date().toISOString();
   await c.db.prepare('INSERT OR IGNORE INTO academy_team_channels(id,kind,name,campus_id,participants,created_by,created_at,last_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,kind,name,campusId,JSON.stringify(participants),c.me.id,when,when).run();
   return json({ok:true,id,created:true},201);
  }
  const id=String(body.channelId||''),ch=await channelOrNull(c.db,id);
  if(!ch||!canView(ch,c.me))return fail('Conversation unavailable',404);
  if(action==='read'){
   const seq=Number(body.lastSeq||0);
   if(!Number.isSafeInteger(seq)||seq<0)return fail('Invalid read cursor');
   if(seq>0){const exists:any=await c.db.prepare('SELECT seq FROM academy_team_messages WHERE channel_id=? AND seq=?').bind(id,seq).first();if(!exists)return fail('Message does not belong to this conversation',400);}
   await c.db.prepare('INSERT INTO academy_team_reads(channel_id,account_id,last_seq) VALUES(?,?,?) ON CONFLICT(channel_id,account_id) DO UPDATE SET last_seq=max(last_seq,excluded.last_seq)').bind(id,c.me.id,seq).run();
   return json({ok:true});
  }
  if(action==='send'){
   const text=typeof body.text==='string'?body.text.trim():'';
   if(!text||text.length>4000)return fail('Messages must be 1–4,000 characters');
   const priority=body.priority==='important'?'important':'normal';
   if(priority==='important'&&!management.has(c.me.role))return fail('Only school management can flag priority announcements',403);
   // The creator of a restricted group may send, but schoolwide and campus
   // channels do not grant any right to view unrelated private group or DMs.
   const replyTo=typeof body.replyTo==='string'?body.replyTo:null;
   if(replyTo){const parent:any=await c.db.prepare('SELECT id FROM academy_team_messages WHERE id=? AND channel_id=?').bind(replyTo,id).first();if(!parent)return fail('Reply must reference a message in this conversation',400);}
   const sentAt=new Date().toISOString(),messageId=typeof body.messageId==='string'&&/^[a-f0-9-]{36}$/i.test(body.messageId)?body.messageId:crypto.randomUUID();
   const prev:any=await c.db.prepare('SELECT id,author_id,channel_id FROM academy_team_messages WHERE id=?').bind(messageId).first();
   if(prev)return prev.author_id===c.me.id&&prev.channel_id===id?json({ok:true,id:messageId,duplicate:true}):fail('Message ID was already used',409);
   const latest:any=await c.db.prepare('SELECT created_at FROM academy_team_messages WHERE channel_id=? AND author_id=? ORDER BY seq DESC LIMIT 1').bind(id,c.me.id).first();
   if(latest&&Date.now()-Date.parse(latest.created_at)<600)return fail('Please slow down between messages',429);
   await c.db.batch([
    c.db.prepare('INSERT INTO academy_team_messages(id,channel_id,author_id,body,reply_to,priority,created_at) VALUES(?,?,?,?,?,?,?)').bind(messageId,id,c.me.id,text,replyTo,priority,sentAt),
    c.db.prepare('UPDATE academy_team_channels SET last_at=? WHERE id=?').bind(sentAt,id),
    c.db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'academy-owner',id,'Internal staff message',sentAt,JSON.stringify({messageId,channelId:id,priority}),c.access.user.email)
   ]);
   return json({ok:true,id:messageId},201);
  }
  return fail('Unsupported messenger action',400);
 }catch(e){console.error('Staff messenger action failed',e);return fail('Messenger temporarily unavailable',503);}
}
