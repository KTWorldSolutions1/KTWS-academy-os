'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,GraduationCap,Search,X} from 'lucide-react';
import type {RecordData} from '../lib/training';
import type {SchoolSection} from '../lib/simple-navigation';
type Result={id:string;title:string;detail:string;page:string;recordId?:string;kind:'Page'|'Student'|'Lead'};
export default function QuickFind({records,navigation,onClose,onNavigate}:{records:RecordData[];navigation:SchoolSection[];onClose:()=>void;onNavigate:(page:string,recordId?:string)=>void}){
 const [query,setQuery]=useState(''),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{input.current?.focus();const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();onClose();}};window.addEventListener('keydown',escape);return ()=>window.removeEventListener('keydown',escape);},[onClose]);
 const pages=navigation.flatMap(section=>section.pages.map(page=>({id:page.id,title:page.label,detail:section.label+' · '+page.help,page:page.id,kind:'Page' as const})));
 const pageIds=new Set(pages.map(p=>p.id));
 const names=records.filter(r=>r.name&&((r.kind==='students'&&pageIds.has('students'))||(r.kind==='leads'&&pageIds.has('leads'))))
   .map(r=>({id:r.id,title:r.name,detail:r.kind==='students'?'Student · '+(r.status||'Record'):'Admissions · '+(r.status||'Inquiry'),page:r.kind==='students'?'students':'leads',recordId:r.id,kind:(r.kind==='students'?'Student':'Lead') as 'Student'|'Lead'}));
 const q=query.trim().toLowerCase();
 const results:Result[]=(q?[...pages,...names].filter(r=>(r.title+' '+r.detail).toLowerCase().includes(q)):[...pages]).slice(0,12);
 return <div className="quick-find-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className="quick-find-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-find-label">
  <div className="quick-find-top"><Search size={21}/><label htmlFor="quick-find-input" id="quick-find-label" className="sr-only">Search school pages and names</label><input ref={input} id="quick-find-input" placeholder="Find a page or person…" autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" onClick={onClose} aria-label="Close search"><X size={20}/></button></div>
  <div className="quick-find-results"><p>SEARCH YOUR SCHOOL</p>{results.length?results.map(result=><button type="button" key={result.kind+'-'+result.id} onClick={()=>{onNavigate(result.page,result.recordId);onClose();}}><span className="quick-find-icon">{result.kind==='Student'?<GraduationCap size={19}/>:result.kind==='Lead'?<Search size={18}/>:<ArrowUpRight size={18}/>}</span><span><strong>{result.title}</strong><small>{result.detail}</small></span><ArrowUpRight size={16}/></button>):<div className="quick-find-none">No matches in the school records available to your role.</div>}</div>
  <div className="quick-find-footer">Only pages and school records your account may already access appear here. <kbd>Esc</kbd> to close.</div>
 </div></div>;
}
