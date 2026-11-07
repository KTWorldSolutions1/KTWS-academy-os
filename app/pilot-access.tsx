'use client';
import {useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {ShieldCheck,UserPlus,KeyRound} from 'lucide-react';
type Props={records:R[];role:string;demo:boolean;busy:boolean;saveMany:(rows:R[])=>Promise<boolean>};
const roles=['Regional admin','Campus manager','Enrollment specialist','Admin assistant','Front desk','Instructor'] as const;
export default function PilotAccess({records,role,demo,busy,saveMany}:Props){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[accessRole,setAccessRole]=useState<string>('Campus manager'),[campusIds,setCampusIds]=useState<string[]>([]),[notice,setNotice]=useState(''),[error,setError]=useState(''),[activationLink,setActivationLink]=useState('');
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const staff=records.filter(r=>r.kind==='staff'&&r.status==='Active');
 if(role!=='Owner')return <p className="notice">Only the school owner may create pilot users or grant regional cross-campus access.</p>;
 async function add(){
  setError('');setNotice('');setActivationLink('');
  if(!name.trim()||!/^\S+@\S+\.\S+$/.test(email)||!campusIds.length){setError('Enter a staff name, actual email address and at least one approved campus.');return;}
  if(staff.some(s=>String(s.email||'').toLowerCase()===email.trim().toLowerCase())){setError('An employee with this email already exists. Open their existing record or create an activation link.');return;}
  const r:R={id:crypto.randomUUID(),kind:'staff',name:name.trim(),email:email.trim().toLowerCase(),campusIds,status:'Active',accessRole,position:'Academy OS pilot tester',department:'School testing'};
  if(await saveMany([r])){setNotice('Pilot user saved. Generate their secure 30-minute activation link below.');setName('');setEmail('');setCampusIds([]);}
  else setError('Could not save user. Verify owner access and school validation.');
 }
 async function invite(staffId:string){
  setError('');setNotice('');setActivationLink('');
  if(demo){setError('Pilot invitations require the saved owner workspace, not practice mode.');return;}
  try{const res=await fetch('/api/accounts/invite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({staffId})}),body=await res.json();
   if(!res.ok)throw Error(body.error||'Could not create activation');
   setActivationLink(String(body.link||''));setNotice('One-time activation link created. Share it privately with the authorized employee. It expires after 30 minutes.');
  }catch(e:any){setError(e.message);}
 }
 return <div className="pilot-access"><section className="panel"><div className="sectionhead"><div><p className="eyebrow">OWNER ACCESS CONTROL</p><h2>Invite Academy OS pilot users</h2><p className="muted">Create individual accounts for Greensboro, Dallas, Mansfield or future campuses. Every employee receives a personal login; assigned campuses restrict student and funding records. <b>Regional admin</b> provides schoolwide management access and must only be assigned by the owner.</p></div><ShieldCheck size={26}/></div>
 <div className="formgrid"><label>Name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Staff full name"/></label><label>Sign-in email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@organization.com"/></label><label>School role<select value={accessRole} onChange={e=>setAccessRole(e.target.value)}>{roles.map(r=><option key={r}>{r}</option>)}</select></label></div>
 <h3>Assign permitted campuses</h3><div className="pilot-campus-checks">{campuses.map(c=><label className="checkboxlabel" key={c.id}><input type="checkbox" checked={campusIds.includes(c.id)} onChange={e=>setCampusIds(p=>e.target.checked?[...p,c.id]:p.filter(x=>x!==c.id))}/>{c.name} • {c.city||''} {c.state||''}</label>)}</div>
 {accessRole==='Regional admin'&&<p className="notice">Regional administrator is a privileged cross-campus role. Staff with this role may access every school's student records and restricted compliance information, regardless of assigned campus selection. Grant only to approved school leadership.</p>}
 <button className="primary" disabled={busy||demo} onClick={add}><UserPlus size={18}/> Save pilot user</button>
 {notice&&<p className="notice">{notice}</p>}{error&&<p className="error" role="alert">{error}</p>}{activationLink&&<div className="pilot-activation"><p><KeyRound size={16}/> Activation link — valid for 30 minutes, single use</p><input readOnly aria-label="Private activation link" value={activationLink} onFocus={e=>e.currentTarget.select()}/><button onClick={()=>navigator.clipboard.writeText(activationLink)}>Copy link</button></div>}
 </section>
 <section className="panel"><h3>Current pilot employees</h3>{staff.map(r=><div className="vault-doc-row" key={r.id}><div><b>{r.name}</b><small>{r.email||'Email missing'} • {r.accessRole||'No role'} • {(r.campusIds||[]).map((id:string)=>campuses.find(c=>c.id===id)?.name||id).join(', ')}</small></div><button disabled={demo||busy||!r.email||!r.accessRole||!(r.campusIds||[]).length} onClick={()=>invite(r.id)}><KeyRound size={16}/> Activation</button></div>)}{!staff.length&&<p className="muted">No pilot users have been created.</p>}<p className="footnote">Practice mode uses fictional local sample data and does not persist changes or share them with other testers. A separate authenticated staging database is recommended before any real student information is made accessible to pilot testers. Staff activation links are not emailed automatically.</p></section></div>;
}
