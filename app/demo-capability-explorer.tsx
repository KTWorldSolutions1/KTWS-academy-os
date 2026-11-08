'use client';
import {useMemo,useState} from 'react';
import {Search,ArrowRight,LayoutGrid,MessageSquarePlus} from 'lucide-react';
import {CAPABILITY_SECTIONS,CAPABILITY_COUNT} from '../lib/demo-showcase';
export default function CapabilityExplorer({onNavigate,onReview}:{onNavigate:(page:string,sceneId:string)=>void;onReview:(chapter:string)=>void}){
 const [term,setTerm]=useState(''),[area,setArea]=useState('all');
 const filtered=useMemo(()=>CAPABILITY_SECTIONS.filter(s=>area==='all'||s.id===area)
  .map(section=>({...section,capabilities:section.capabilities.filter(p=>(p.label+' '+p.description).toLowerCase().includes(term.toLowerCase().trim()))}))
  .filter(section=>section.capabilities.length),[term,area]);
 return <section className="panel" aria-label="Complete Academy OS capability explorer" style={{margin:'12px',padding:16,maxHeight:'42vh',overflow:'auto'}}>
  <div className="sectionhead"><div><p className="eyebrow">FULL SYSTEM SHOWCASE</p><h3><LayoutGrid size={19}/> Explore all {CAPABILITY_COUNT} workspace features</h3><p className="muted">The narrated story covers the main outcomes; this searchable catalog shows every actual module currently present in the school's navigation. Open a screen to verify the workflow yourself.</p></div></div>
  <div className="formgrid"><label><Search size={15}/> Search modules <input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Try payroll, credentials, fleet, invoices, student portal…"/></label>
   <label>School department <select value={area} onChange={e=>setArea(e.target.value)}><option value="all">Every department</option>{CAPABILITY_SECTIONS.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label></div>
  {filtered.map(section=><div key={section.id} style={{marginTop:14}}><h4>{section.title} · {section.capabilities.length}</h4>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:8}}>
    {section.capabilities.map(page=><div key={page.id} style={{border:'1px solid #3c5367',borderRadius:9,padding:12,display:'grid',gap:6}}>
     <strong>{page.label}</strong><p className="muted">{page.description}</p><small>{page.status}</small>
     <div className="reportactions"><button type="button" onClick={()=>onNavigate(page.id,page.chapter||'network')}>Open feature <ArrowRight size={14}/></button>
      <button type="button" aria-label={'Request improvement to '+page.label} onClick={()=>onReview(page.chapter||'finale')}><MessageSquarePlus size={14}/></button></div>
    </div>)}
   </div>
  </div>)}
  {!filtered.length&&<p className="muted">No matching module. Try a different keyword or department.</p>}
  <p className="muted">A visible module is not a guarantee that its external service is configured or that it has passed school acceptance. Private uploads, real payment processing, payroll certification, live messaging and FMCSA transmission retain separate controls.</p>
 </section>;
}
