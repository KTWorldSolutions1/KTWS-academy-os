'use client';
import {useEffect,useState} from 'react';
import {Activity,ArrowUpRight,CheckCircle2,ChevronDown,Cloud,Database,FileLock2,Link2,LockKeyhole,Search,Settings2,ShieldCheck,Unplug,Wallet,Workflow} from 'lucide-react';
import {INTEGRATION_CATALOG,integrationCategoryNames,type IntegrationDef} from '../lib/integration-catalog';
type PublicConnector=IntegrationDef&{configured:boolean;status:string;credentialStatus?:{name:string;configured:boolean}[]};
export default function IntegrationsCenter({role}:{role:string}){
 const [items,setItems]=useState<PublicConnector[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [search,setSearch]=useState(''),[category,setCategory]=useState('All integrations'),[expanded,setExpanded]=useState('');
 const [refreshAt,setRefreshAt]=useState('');
 async function refresh(){setLoading(true);setError('');try{
   const res=await fetch('/api/integrations',{cache:'no-store'}),json:any=await res.json();
   if(!res.ok)throw Error(json.error||'Could not check integration readiness.');
   setItems(json.integrations||[]);setRefreshAt(new Date().toLocaleTimeString('en-US'));
  }catch(e:any){setError(e.message||'Connections cannot be checked.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{refresh();},[]);
 if(!['Owner','Regional admin'].includes(role))return <section className="panel"><LockKeyhole size={22}/><h2>Owner-only integration settings</h2><p>School service connections can only be reviewed by authorized leadership.</p></section>;
 const list=(items.length?items:INTEGRATION_CATALOG.map(row=>({...row,configured:false,status:'Not checked'})))
  .filter(x=>(category==='All integrations'||x.category===category)&&[x.name,x.category,x.summary,x.currentImplementation,...x.features].join(' ').toLowerCase().includes(search.toLowerCase()));
 const connected=items.filter(x=>x.configured).length,actionable=items.filter(x=>x.mode==='Credentials required'&&!x.configured).length;
 return <div className="integrations-center">
   <section className="integrations-hero"><div><p className="eyebrow">ACADEMY OS · CONNECTIONS & AUTOMATIONS</p><h2>One system. Connected when you're ready.</h2><p>All supported service options are registered here, with truthful readiness checks and the steps required to connect them. Nothing receives your school records, private documents or money merely because it appears in this directory.</p>
    <div className="integration-head-actions"><button className="primary" onClick={refresh} disabled={loading}><Activity size={16}/>{loading?'Checking service settings…':'Refresh connection statuses'}</button><span><ShieldCheck size={15}/> Owner-controlled setup</span></div></div>
    <div className="integrations-counts"><div><strong>{items.length||INTEGRATION_CATALOG.length}</strong><small>Services listed</small></div><div><strong>{connected}</strong><small>Bindings / credential sets detected</small></div><div><strong>{actionable}</strong><small>Optional account connections available</small></div></div>
   </section>
   {error&&<p className="error" role="alert">{error}</p>}
   <div className="integration-notice"><FileLock2 size={20}/><div><b>Security and scope first.</b><p>Automatic installation inside Microsoft, Twilio, Stripe, QuickBooks, Tenstreet or government websites is not possible without their authorized accounts and consent. A configured secret is not proof that the service delivered, synced or passed acceptance testing.</p></div></div>
   <div className="integration-controls"><label className="integration-find"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find software, payments, theory or CRM…" aria-label="Find integrations"/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)}><option>All integrations</option>{integrationCategoryNames().map(c=><option key={c}>{c}</option>)}</select></label></div>
   <div className="integration-cards">{list.map(row=>{
    const opened=expanded===row.id;
    return <article className={'integration-card '+(row.configured?'connected':'')} key={row.id}>
      <div className="integration-card-top"><div className="integration-mark">{row.category==='School infrastructure'?<Database size={23}/>:row.category==='Student communications'?<Workflow size={23}/>:row.category==='Finance & funding'?<Wallet size={23}/>:row.category==='Regulatory reporting'?<ShieldCheck size={23}/>:<Cloud size={23}/>}</div>
       <div><h3>{row.name}</h3><small>{row.category}</small></div><span className={'integration-status '+(row.configured?'ok':'waiting')}>{row.configured?<CheckCircle2 size={13}/>:<Unplug size={13}/>} {row.status}</span></div>
      <p>{row.summary}</p>
      <p className="integration-current"><b>Built today:</b> {row.currentImplementation}</p>
      <div className="integration-mode"><span>{row.mode}</span><span>{row.features.length} capabilities</span></div>
      <div className="integration-actions"><button aria-expanded={opened} onClick={()=>setExpanded(opened?'':row.id)}>{opened?'Hide setup':'Connection details & setup'} <ChevronDown size={15} className={opened?'rotated':''}/></button>
       <a href={row.officialUrl} target="_blank" rel="noreferrer noopener">Vendor site <ArrowUpRight size={15}/></a></div>
      {opened&&<div className="integration-details"><h4>Capabilities</h4><div className="integration-tags">{row.features.map(item=><span key={item}>{item}</span>)}</div><h4>Connection procedure</h4><ol>{row.configuration.map((item,i)=><li key={i}>{item}</li>)}</ol>
        {row.credentialStatus?.length?<><h4>Server-only settings</h4>{row.credentialStatus.map(x=><div key={x.name} className="integration-secret"><code>{x.name}</code><span className={x.configured?'good':'muted'}>{x.configured?'Configured':'Not configured'}</span></div>)}</>:null}
        <p><b>Next action:</b> {row.nextAction}</p>{row.privacyNote&&<p className="integration-privacy"><ShieldCheck size={16}/> {row.privacyNote}</p>}
       </div>}
     </article>;
   })}</div>
   {refreshAt&&<p className="footnote">Configuration status last checked {refreshAt}. Integration secrets stay on the server, never in the student portal. For paid or OAuth-based services, the account owner must connect each provider explicitly.</p>}
 </div>;
}
