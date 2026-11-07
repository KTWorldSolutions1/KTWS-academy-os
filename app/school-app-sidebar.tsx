'use client';
import {useEffect,useState} from 'react';
import {BookOpen,CalendarDays,ChevronDown,ChevronRight,ClipboardCheck,GraduationCap,Handshake,IdCard,LayoutDashboard,Mail,Menu,MessageSquareText,Search,Settings2,ShieldCheck,UsersRound,Wallet,X} from 'lucide-react';
import type {SchoolSection} from '../lib/simple-navigation';
type Props={sections:SchoolSection[];activeSection:string;activePage:string;role:string;menu:boolean;alertCount:number;onNavigate:(page:string)=>void;onSearch:()=>void;onWebsite:()=>void;onClose:()=>void};
const icons={home:LayoutDashboard,students:GraduationCap,admissions:UsersRound,training:BookOpen,team:ClipboardCheck,partners:Handshake,payments:Wallet,school:Settings2};
const quick=[{id:'students',label:'Find a student',Icon:GraduationCap},{id:'calendar',label:'Open school calendar',Icon:CalendarDays},{id:'rosters',label:'Import / DMV rosters',Icon:ClipboardCheck},{id:'courses',label:'Take attendance',Icon:BookOpen}];
export default function SchoolAppSidebar({sections,activeSection,activePage,role,menu,alertCount,onNavigate,onSearch,onWebsite,onClose}:Props){
 const [expanded,setExpanded]=useState(activeSection||'home');
 const [compact,setCompact]=useState(false);
 useEffect(()=>setExpanded(activeSection),[activeSection]);
 const go=(id:string)=>{onNavigate(id);onClose();};
 return <aside className={(menu?'sidebar open':'sidebar')+(compact?' academy-sidebar-compact':'')+' app-sidebar'} aria-label="School navigation">
  <div className="nav-brand-row"><button className="brand nav-brand-button" onClick={()=>go('overview')} aria-label="Lone Star Academy OS home"><span className="brandmark" aria-hidden="true">★</span><div>LONE STAR<span>TRUCK DRIVING ACADEMY</span></div></button><button className="nav-close" onClick={onClose} aria-label="Close navigation"><X size={20}/></button></div>
  <div className="sidebar-intro"><span className="sidebar-workspace-label">SCHOOL WORKSPACE <span className="sidebar-live-dot"/></span><p>Choose a section to see its tools. Select a tool to open it.</p></div>
  <button className="sidebar-command" onClick={onSearch}><Search size={17}/><span>Find a tool or student</span><kbd>⌘ K</kbd></button>
  <div className="sidebar-scroll">
   <div className="sidebar-section-label">START HERE · COMMON TASKS</div>
   <div className="sidebar-shortcuts">{quick.filter(q=>sections.some(s=>s.pages.some(p=>p.id===q.id))).map(({id,label,Icon})=><button type="button" className={activePage===id?'selected':''} key={id} onClick={()=>go(id)}><Icon size={16}/><span>{label}</span><ChevronRight size={13}/></button>)}</div>
   <div className="sidebar-section-label">ALL SCHOOL TOOLS · SELECT TO EXPAND</div>
   <nav className="sidebar-tree" aria-label="Main sections">{sections.map(section=>{const Icon=icons[section.id as keyof typeof icons]||LayoutDashboard;const opened=expanded===section.id;const selected=section.id===activeSection;
     return <div key={section.id} className={'sidebar-tree-group '+(selected?'selected':'')}>
       <button type="button" className={'sidebar-group-toggle '+(selected?'active':'')} aria-expanded={opened} aria-current={selected?'page':undefined} onClick={()=>setExpanded(opened?'':section.id)}>
        <Icon size={19}/><span className="sidebar-category-text"><b>{section.label}</b><small>{section.help}</small></span>{section.id==='home'&&alertCount>0&&<em>{Math.min(alertCount,99)}</em>}<ChevronDown size={16} className={opened?'rotated':''}/>
       </button>
       {opened&&<div className="sidebar-subpages" role="group" aria-label={section.label+' pages'}><p className="sidebar-subpages-note">Choose what you want to do:</p>{section.pages.map(page=><button type="button" key={page.id} className={activePage===page.id?'active':''} aria-current={activePage===page.id?'page':undefined} onClick={()=>go(page.id)} title={page.help}><span className="sidebar-page-mark"/><span><b>{page.label}</b><small>{page.help}</small></span></button>)}</div>}
      </div>;})}</nav>
  </div>
  <div className="sidebar-user-zone"><div className="sidebar-user-avatar">LS</div><div className="sidebar-user-meta"><b>{role}</b><small>School workspace · Authorized</small></div><ShieldCheck size={17}/></div>
  {role==='Owner'&&<button className="sidebar-website" onClick={onWebsite}>View website preview <ChevronRight size={16}/></button>}
 </aside>;
}
