'use client';
import {useEffect,useState} from 'react';
type Readiness={mode:string;connected:boolean;submissionEnabled:boolean;credentialsConfigured:boolean;testingComplete:boolean;campuses:{id:string;name:string;tprLocationConfigured:boolean}[];message:string;toolkit:string};
export default function TprConnectionPanel(){
 const [data,setData]=useState<Readiness|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function refresh(){setBusy(true);setError('');try{const r=await fetch('/api/tpr/connection',{cache:'no-store'}),j=await r.json();if(!r.ok)throw Error(j.error||'TPR status unavailable');setData(j);}catch(e:any){setError(e.message);}finally{setBusy(false);}}
 useEffect(()=>{void refresh();},[]);
 return <section className="panel" aria-label="Official FMCSA TPR connection">
  <div className="sectionhead"><div><p className="eyebrow">FMCSA TRAINING PROVIDER REGISTRY · FEDERAL REPORTING</p><h2>Official TPR Connection</h2><p className="muted">Do not confuse internal preflight checks with an accepted federal submission.</p></div></div>
  {error&&<p className="error" role="alert">{error}</p>}
  {data&&<><p className="notice"><strong>Current status: Manual FMCSA reporting required.</strong> {data.message}</p>
  <div className="formgrid">
   <div><strong>Production TPR submission</strong><p className="muted">{data.submissionEnabled?'Authorized':'Disabled — no federal transmissions'}</p></div>
   <div><strong>Web Service credentials</strong><p className="muted">{data.credentialsConfigured?'Server credentials detected; connection unverified':'Not configured on server'}</p></div>
   <div><strong>End-to-end integration test</strong><p className="muted">{data.testingComplete?'Verified':'Not completed'}</p></div>
  </div>
  <h3>Registered training locations</h3>
  <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>School location</th><th>TPR location ID</th></tr></thead><tbody>{data.campuses.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.tprLocationConfigured?'Recorded — verify with FMCSA':'Missing from campus settings'}</td></tr>)}</tbody></table></div>
  <p className="muted">To enable direct transmission, an authorized Lone Star TPR administrator must generate a dedicated Web Service credential through the federal provider portal. The private key must be configured as a secure Cloudflare secret, tested with FMCSA's developer toolkit, and approved before any production submit action is introduced. Never upload certificates or keys to student records or source control.</p>
  <div className="reportactions"><a href="https://tpr.fmcsa.dot.gov/Learn/DeveloperToolkit" target="_blank" rel="noopener noreferrer">Official FMCSA developer toolkit</a><a href="https://tpr.fmcsa.dot.gov/" target="_blank" rel="noopener noreferrer">Open TPR portal</a><button type="button" disabled={busy} onClick={refresh}>Refresh connection readiness</button></div>
  </>}
 </section>;
}
