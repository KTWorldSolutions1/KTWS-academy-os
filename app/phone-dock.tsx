'use client';
import {BookOpen,GraduationCap,House,Menu,Phone} from 'lucide-react';
import type {SchoolSection} from '../lib/simple-navigation';
type Item={id:string;page:string;label:string;icon:typeof House};
export default function PhoneDock({navigation,activeSection,onNavigate,onMore}:{navigation:SchoolSection[];activeSection:string;onNavigate:(page:string)=>void;onMore:()=>void}){
 const sections=new Map(navigation.map(s=>[s.id,s]));
 const defaults:Item[]=[
  {id:'home',page:'overview',label:'Home',icon:House},
  {id:'students',page:'students',label:'Students',icon:GraduationCap},
  {id:'admissions',page:'leads',label:'Admissions',icon:Phone},
  {id:'training',page:'courses',label:'Training',icon:BookOpen}
 ];
 const links=defaults.filter(s=>sections.has(s.id)&&sections.get(s.id)!.pages.some(p=>p.id===s.page));
 return <nav className="phone-dock" aria-label="Phone shortcuts">{links.map(item=>{const Icon=item.icon;return <button key={item.id} type="button" className={activeSection===item.id?'selected':''} aria-current={activeSection===item.id?'page':undefined} onClick={()=>onNavigate(item.page)}><Icon size={21} aria-hidden="true"/><span>{item.label}</span></button>})}<button className={links.some(x=>x.id===activeSection)?'':'selected'} type="button" aria-label="Open more school tools" onClick={onMore}><Menu size={21} aria-hidden="true"/><span>More</span></button></nav>;
}
