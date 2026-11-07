'use client';
import {useState} from 'react';
import {BookOpen,CalendarDays,ChevronDown,ChevronRight,ClipboardCheck,GraduationCap,Handshake,IdCard,LayoutDashboard,Mail,Menu,MessageSquareText,Search,Settings2,ShieldCheck,UsersRound,Wallet,X} from 'lucide-react';
import type {SchoolSection} from '../lib/simple-navigation';
type Props={sections:SchoolSection[];activeSection:string;activePage:string;role:string;menu:boolean;alertCount:number;onNavigate:(page:string)=>void;onAlerts:()=>void;onSearch:()=>void;onWebsite:()=>void;onClose:()=>void};
const icons={home:LayoutDashboard,students:GraduationCap,admissions:UsersRound,training:BookOpen,team:ClipboardCheck,partners:Handshake,payments:Wallet,school:Settings2};
const quick=[{id:'students',label:'Find a student',Icon:GraduationCap},{id:'calendar',label:'Open school calendar',Icon:CalendarDays},{id:'rosters',label:'Import / DMV rosters',Icon:ClipboardCheck},{id:'courses',label:'Take attendance',Icon:BookOpen},{id:'student-id-studio',label:'Upload photos / print IDs',Icon:IdCard},{id:'school-notices',label:'Announcements / closures',Icon:Mail}];
export default function SchoolAppSidebar({sections,activeSection,activePage,role,menu,alertCount,onNavigate,onAlerts,onSearch,onWebsite,onClose}:Props){
 const [expanded,setExpanded]=useState('');
 const go=(id:string)=>{setExpanded('');onNavigate(id);onClose();};
 return <aside className={(menu?'sidebar open':'sidebar')+' app-sidebar'} aria-label="School navigation">
  <div className="nav-brand-row"><button className="brand nav-brand-button" onClick={()=>go('overview')} aria-label="Lone Star Academy OS home"><div className="ls-wordmark"><strong>LONE <span aria-label="star" className="ls-wordmark-star">★</span> STAR</strong><span className="ls-wordmark-subtitle">TRUCK DRIVING ACADEMY</span></div></button><button className="nav-close" onClick={onClose} aria-label="Close navigation"><X size={20}/></button></div>
  <div className="sidebar-intro"><span className="sidebar-workspace-label">SCHOOL WORKSPACE <span className="sidebar-live-dot"/></span><p>Choose a section, then a tool. Sections close when you navigate.</p></div>
  <button className="sidebar-command" onClick={onSearch}><Search size={17}/><span>Find a tool or student</span><kbd>⌘ K</kbd></button>
  <div className="sidebar-scroll">
   <div className="sidebar-section-label">SCHOOL SECTIONS · OPEN ONE AT A TIME</div><p className="sidebar-subpages-note">Click Settings & Connections near the bottom to expand its pages. The list scrolls to the expanded section.</p>
   <nav className="sidebar-tree" aria-label="Main sections">{sections.map(section=>{const Icon=icons[section.id as keyof typeof icons]||LayoutDashboard;const opened=expanded===section.id;const selected=section.id===activeSection;
     return <div key={section.id} className={'sidebar-tree-group '+(selected?'selected':'')}>
       <button type="button" className={'sidebar-group-toggle '+(selected?'active':'')} aria-expanded={opened} aria-current={selected?'page':undefined} onClick={e=>{if(section.id==='school'){const destination=section.pages.find(p=>p.id==='integrations')?.id||section.pages[0]?.id;if(destination)go(destination);return;}setExpanded(opened?'':section.id);if(!opened){const group=e.currentTarget.closest('.sidebar-tree-group');requestAnimationFrame(()=>group?.scrollIntoView({block:'nearest',behavior:'smooth'}));}}}>
        <Icon size={19}/><span className="sidebar-category-text"><b>{section.label}</b><small>{section.help}</small></span>{section.id==='home'&&alertCount>0&&<span role="button" tabIndex={0} title="Open active alerts and resolution details" aria-label={alertCount+' active alerts. Open attention center.'} onClick={e=>{e.stopPropagation();onAlerts();setExpanded('');}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.stopPropagation();e.preventDefault();onAlerts();setExpanded('');}}} className="sidebar-alert-count">{Math.min(alertCount,99)}</span>}<ChevronDown size={16} className={opened?'rotated':''}/>
       </button>
       {section.id==='school'&&<button type="button" className="sidebar-school-expand" aria-label="Expand Settings & Connections pages" aria-expanded={opened} onClick={()=>setExpanded(opened?'':section.id)}><ChevronDown size={14}/> Browse settings pages</button>}{opened&&<div className="sidebar-subpages" role="group" aria-label={section.label+' pages'}><p className="sidebar-subpages-note">Choose what you want to do:</p>{section.pages.map(page=><button type="button" key={page.id} className={activePage===page.id?'active':''} aria-current={activePage===page.id?'page':undefined} onClick={()=>go(page.id)} title={page.help}><span className="sidebar-page-mark"/><span><b>{page.label}</b><small>{page.help}</small></span></button>)}</div>}
      </div>;})}</nav>
  </div>
  <div className="sidebar-user-zone"><div className="sidebar-user-avatar">LS</div><div className="sidebar-user-meta"><b>{role}</b><small>School workspace · Authorized</small></div><ShieldCheck size={17}/></div>
  {role==='Owner'&&<button className="sidebar-website" onClick={onWebsite}>View website preview <ChevronRight size={16}/></button>}
 </aside>;
}
