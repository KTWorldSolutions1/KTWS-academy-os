'use client';
import {useState} from 'react';
import type {RecordData as R} from '../lib/training';
import {trainingWriter} from '../lib/roles';
import {PREVIEW_ROLES,ROLE_FOCUS,rolePreviewNavigation,rolePreviewStart,rolePreviewPageAllowed,scopePreviewRecords,type PreviewRole} from '../lib/role-previews';
import {displayNameForPage} from '../lib/simple-navigation';
import SchoolAppSidebar from './school-app-sidebar';
import TrainingCenter from './training-center';
import AdmissionsCenter from './admissions-center';
import TeamAssignments from './team-assignments';
import SchoolCalendar from './school-calendar';
import SchoolDispatch from './school-dispatch';
import LessonCheckoffs from './lesson-checkoffs';
import InstructorCloseout from './instructor-closeout';
import ManagerBrief from './manager-brief';
import SchoolInsights from './school-insights';
import SchoolKnowledgeHub from './school-knowledge-hub';
import Student360 from './student-360';
import QuickFind from './quick-find';
import './role-preview.css';

/** Isolated UI: fixtures in, local state out. No live records or service callbacks. */
export default function RolePreviewWorkspace({initialRole,sample,onClose}:{initialRole:PreviewRole;sample:R[];onClose:()=>void}){
 const [role,setRole]=useState(initialRole),[page,setPage]=useState(rolePreviewStart(initialRole)),[rows,setRows]=useState<R[]>(()=>structuredClone(sample)),[campus,setCampus]=useState(initialRole==='Owner'||initialRole==='Regional admin'?'All campuses':sample.find(r=>r.kind==='campuses')?.id||'All campuses'),[menu,setMenu]=useState(false),[find,setFind]=useState(false),[selected,setSelected]=useState(''),[notice,setNotice]=useState('');
 const navigation=rolePreviewNavigation(role),records=scopePreviewRecords(rows,campus),campuses=rows.filter(r=>r.kind==='campuses');
 const section=navigation.find(s=>s.pages.some(p=>p.id===page)),focus=ROLE_FOCUS[role];
 const student=records.find(r=>r.kind==='students'&&r.id===selected);
 function go(next:string){if(!rolePreviewPageAllowed(role,next)){setNotice('That screen is outside this role’s menu. Switch preview roles to inspect it.');return;}setPage(next);setSelected('');setMenu(false);}
 function changeRole(next:PreviewRole){setRole(next);setPage(rolePreviewStart(next));setSelected('');setFind(false);setMenu(false);setNotice('');if(!['Owner','Regional admin'].includes(next)&&campus==='All campuses')setCampus(campuses[0]?.id||'All campuses');}
 async function saveMany(updates:R[]){if(!updates.length)return true;setRows(prev=>[...prev.filter(r=>!updates.some(u=>u.id===r.id)),...structuredClone(updates)]);setNotice('Practice change saved only in this preview. Real school records are unchanged.');return true;}
 function openStudent(id:string){if(rolePreviewPageAllowed(role,'students')){setPage('students');setSelected(id);}}
 const shared={records,role,demo:true,busy:false,saveMany};
 return <div className="shell role-preview-shell"><SchoolAppSidebar sections={navigation} activeSection={section?.id||'home'} activePage={page} role={role+' · PREVIEW'} menu={menu} alertCount={0} onNavigate={go} onAlerts={()=>go('attention')} onSearch={()=>setFind(true)} onWebsite={()=>{}} onClose={()=>setMenu(false)}/><main><header className="academy-topbar"><button className="mobilemenu" onClick={()=>setMenu(!menu)} aria-label="Toggle preview navigation">Menu</button><strong>ROLE PREVIEW · FICTIONAL SCHOOL</strong><label>Preview as<select aria-label="Preview role" value={role} onChange={e=>changeRole(e.target.value as PreviewRole)}>{PREVIEW_ROLES.map(r=><option key={r}>{r}</option>)}</select></label><button onClick={onClose}>Exit role preview</button></header><div className="content">
 <section className="panel role-preview-banner"><p className="eyebrow">{role.toUpperCase()} EXPERIENCE</p><h1>{displayNameForPage(page)}</h1><p>{focus.purpose}</p><p className="muted">Role-specific menus and practice workflows. All people and records here are fictional. Service-backed screens use labeled examples; this does not impersonate an account or prove server permissions.</p><label>Sample campus<select aria-label="Sample campus" value={campus} onChange={e=>{setCampus(e.target.value);setSelected('');}}>{['Owner','Regional admin'].includes(role)&&<option>All campuses</option>}{campuses.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><div className="reportactions">{focus.pages.map(p=><button key={p} onClick={()=>go(p)}>{displayNameForPage(p)}</button>)}<button onClick={()=>{setRows(structuredClone(sample));setSelected('');setNotice('Fictional practice changes reset.');}}>Reset this practice session</button></div></section>
 {notice&&<p className="notice" role="status">{notice}</p>}
 {page==='courses'?<TrainingCenter key={role+campus} records={records} saveMany={saveMany} demo busy={false} readOnly={!trainingWriter(role)} initialView="Daily board"/>:
 ['leads','classes'].includes(page)?<AdmissionsCenter key={role+page+campus} role={role} records={records} saveMany={saveMany} busy={false} initialView={page==='classes'?'Classes':'Sales desk'} onStudent={openStudent} onTraining={()=>go('courses')}/>:
 ['calendar','school-notices'].includes(page)?<SchoolCalendar key={role+campus} {...shared} onNavigate={go}/>:
 page==='tasks'?<TeamAssignments key={role+campus} {...shared}/>:
 page==='dispatch'?<SchoolDispatch key={role+campus} {...shared} onStudent={openStudent}/>:
 page==='lesson-checkoffs'?<LessonCheckoffs key={role+campus} {...shared}/>:
 page==='closeout'?<InstructorCloseout records={records} role={role} onNavigate={go}/>:
 page==='manager-brief'?<ManagerBrief records={records}/>:
 page==='insights'?<SchoolInsights records={records} onCampus={id=>{setCampus(id);go('overview');}} onPage={go}/>:
 page==='school-knowledge'?<SchoolKnowledgeHub key={role+campus} {...shared} onNavigate={go}/>:
 page==='students'?<section className="panel"><h2>Student records · {role}</h2><label>Sample student<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose a sample student</option>{records.filter(r=>r.kind==='students').map(s=><option value={s.id} key={s.id}>{s.name} · {s.status}</option>)}</select></label>{student?<Student360 demo student={student} records={records} role={role} onPage={go}/>:<p>Select a student to inspect their stage, training evidence and this role’s available actions.</p>}</section>:
 page==='overview'?<><div className="metrics">{[['Students',records.filter(r=>r.kind==='students').length],['Open inquiries',records.filter(r=>r.kind==='leads').length],['Team tasks',records.filter(r=>r.kind==='tasks'&&r.status!=='Complete').length]].map(([label,n])=><section key={label}><p>{label}</p><strong>{n}</strong><small>Fictional campus data</small></section>)}</div><section className="panel"><h2>Your day as {role.toLowerCase()}</h2>{focus.pages.filter(p=>p!=='overview').map(p=><div className="reportrow" key={p}><div><b>{displayNameForPage(p)}</b><small>{navigation.flatMap(s=>s.pages).find(x=>x.id===p)?.help}</small></div><button onClick={()=>go(p)}>Explore workflow</button></div>)}</section></>:
 <ServiceExample key={role+page+campus} page={page} role={role} records={records}/>}
 </div></main>{find&&<QuickFind records={records} navigation={navigation} onClose={()=>setFind(false)} onNavigate={(p,id)=>{go(p);if(id&&p==='students')setSelected(id);}}/>}</div>;
}

function ServiceExample({page,role,records}:{page:string;role:string;records:R[]}){
 const [clock,setClock]=useState('Clocked out'),[message,setMessage]=useState(''),[reviewed,setReviewed]=useState(false);
 const kinds:Record<string,string>={'document-center':'students','rosters':'classes','student-id-studio':'students','student-payments':'finance','funding-invoices':'finance','sponsorships':'sponsorships','credentials':'staff','shifts':'staff','student-communications':'students','pilot-access':'staff','compliance':'students','driver-playbook':'courses','learning-diagnostics':'students'};
 const list=records.filter(r=>r.kind===(kinds[page]||page)).slice(0,12);
 return <section className="panel"><p className="eyebrow">ILLUSTRATIVE WORKFLOW · NO SERVICE CONNECTION</p><h2>{displayNameForPage(page)}</h2>
 {page==='timeclock'?<><p>Employees record their own work; authorized managers review timesheets. Paid breaks stay clocked in. Unpaid meals stop paid time.</p><h3 aria-live="polite">{clock}</h3><div className="reportactions"><button disabled={clock!=='Clocked out'} onClick={()=>setClock('Clocked in')}>Practice clock in</button><button disabled={clock!=='Clocked in'} onClick={()=>setClock('Unpaid meal')}>Practice unpaid meal</button><button disabled={clock!=='Unpaid meal'} onClick={()=>setClock('Clocked in')}>Practice resume</button><button disabled={clock!=='Clocked in'} onClick={()=>setClock('Clocked out')}>Practice clock out</button></div></>:
 page==='payroll-report'?<><p>Review hourly rates, completed work, overtime estimates and exceptions before sending the owner’s worksheet.</p><div className="tablewrap"><table><thead><tr><th>Fictional employee</th><th>Rate</th><th>Regular hours</th><th>OT hours</th><th>Gross estimate</th></tr></thead><tbody><tr><td>Sample Instructor</td><td>$20.00</td><td>40</td><td>2 at 1.5×</td><td>$860.00</td></tr></tbody></table></div><button onClick={()=>setReviewed(true)} disabled={reviewed}>{reviewed?'Example reviewed':'Practice reviewing worksheet'}</button><p>No real payroll is approved, exported or paid.</p></>:
 <><p>This screen’s external actions—such as invites, files, messages and provider submissions—are disconnected in role preview. Use this example to review the workflow and discuss what the role needs.</p><div className="tablewrap"><table><thead><tr><th>Sample record</th><th>Current stage</th><th>Role review</th></tr></thead><tbody>{list.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.status}</td><td><button onClick={()=>setMessage('Practice review opened for '+r.name+'. No live action was performed.')}>Inspect example</button></td></tr>)}</tbody></table></div>{!list.length&&<p>No fictional records for this module in the selected campus. Its menu availability follows the current role configuration.</p>}</>}
 {message&&<p role="status" className="notice">{message}</p>}<p className="muted">Viewing as {role}. Exit preview for authenticated school operations.</p></section>;
}
