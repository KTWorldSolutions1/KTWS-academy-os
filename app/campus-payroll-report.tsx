'use client';
import {useEffect,useState} from 'react';
import {weekStart} from '../lib/staff-scheduling';
type Line={employeeId:string;employee:string;rate:number|null;hours:number;gross:number|null;estimatedOvertimeHours:number;estimatedGrossWithOvertime:number|null;approved:boolean;problems:string[]};
type Report={campus:string;week:string;lines:Line[];totalHours:number;totalGross:number;ready:boolean;note:string};
export default function CampusPayrollReport({records,role}:{records:any[];role:string}){
 const campuses=records.filter(r=>r.kind==='campuses'&&r.status==='Active');
 const [campus,setCampus]=useState(''),[week,setWeek]=useState(weekStart(new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'}))),[report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[working,setWorking]=useState(false),[rates,setRates]=useState<Record<string,string>>({});
 useEffect(()=>{if(!campus&&campuses.length)setCampus(campuses[0].id);},[campuses.length,campus]);
 async function load(){
  if(!campus)return;
  setWorking(true);setError('');setReport(null);
  try{const r=await fetch('/api/payroll-report?'+new URLSearchParams({campus,week}),{cache:'no-store'}),body=await r.json();if(!r.ok)throw Error(body.error||'Unable to load payroll');setReport(body);}
  catch(e:any){setError(e.message||'Unable to load payroll');}finally{setWorking(false);}
 }
 useEffect(()=>{void load();},[campus,week]);
 async function saveRate(employeeId:string){
  setError('');setNotice('');
  const hourlyRate=Number(rates[employeeId]??report?.lines.find(l=>l.employeeId===employeeId)?.rate);
  if(!Number.isFinite(hourlyRate)||hourlyRate<=0){setError('Enter a valid hourly pay rate.');return;}
  setWorking(true);
  try{const r=await fetch('/api/payroll-report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({employeeId,campusId:campus,hourlyRate})}),v=await r.json();if(!r.ok)throw Error(v.error||'Unable to save rate');setNotice('Hourly pay updated. Changes are recorded in the pay-rate audit history.');await load();}
  catch(e:any){setError(e.message);}finally{setWorking(false);}
 }
 async function exportSheet(){
  setError('');
  try{const r=await fetch('/api/payroll-report?'+new URLSearchParams({campus,week,format:'csv'}),{cache:'no-store'});if(!r.ok){const b=await r.json();throw Error(b.error||'Download failed');}
  const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='academy-payroll-'+(report?.campus||'campus').replace(/[^a-z0-9]+/gi,'-')+'-'+week+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e:any){setError(e.message);}
 }
 const dollars=(n:number|null)=>n===null?'Not set':n.toLocaleString('en-US',{style:'currency',currency:'USD'});
 return <section className="panel"><div className="sectionhead"><div><p className="eyebrow">CAMPUS MANAGEMENT · CONFIDENTIAL PAYROLL</p><h2>Campus Payroll Spreadsheet</h2><p className="muted">Build one owner-ready payroll worksheet per location. Wages are confidential and visible only to authorized leadership.</p></div></div>
 <div className="formgrid"><label>Campus<select value={campus} onChange={e=>setCampus(e.target.value)}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Payroll week starting Monday<input type="date" value={week} onChange={e=>{if(e.target.value)setWeek(weekStart(e.target.value));}}/></label></div>
 {error&&<p role="alert" className="error">{error}</p>}{notice&&<p role="status" className="notice">{notice}</p>}
 {report&&<><p className="muted">Campus: <strong>{report.campus}</strong> · {report.ready?'All records approved and rated':'Exceptions require review'} · {report.note}</p>
 <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left'}}><thead><tr><th>Employee</th><th>Hourly pay</th><th>Hours</th><th>Straight-time gross</th><th>Provisional OT hours</th><th>Gross with OT estimate</th><th>Status</th>{role==='Owner'&&<th>Owner rate setup</th>}</tr></thead><tbody>{report.lines.map(l=><tr key={l.employeeId}><td>{l.employee}</td><td>{dollars(l.rate)}</td><td>{l.hours.toFixed(2)}</td><td>{dollars(l.gross)}</td><td>{l.estimatedOvertimeHours.toFixed(2)}</td><td>{l.estimatedGrossWithOvertime===null?'Requires rate review':dollars(l.estimatedGrossWithOvertime)}</td><td>{l.problems.length?l.problems.join('; '):'Approved'}</td>{role==='Owner'&&<td><input aria-label={'Hourly pay for '+l.employee} type="number" step="0.01" min="0.01" value={rates[l.employeeId]??String(l.rate??'')} onChange={e=>setRates(v=>({...v,[l.employeeId]:e.target.value}))}/><button type="button" disabled={working} onClick={()=>saveRate(l.employeeId)}>Save rate</button></td>}</tr>)}</tbody><tfoot><tr><th>APPROVED STRAIGHT-TIME SUBTOTAL</th><th></th><th>{report.totalHours.toFixed(2)}</th><th>{dollars(report.totalGross)}</th><th>Separate review</th><th>Separate review</th><th>{report.ready?'Ready for payroll review':'Pending review'}</th>{role==='Owner'&&<th/>}</tr></tfoot></table></div>
 <div className="reportactions"><button type="button" disabled={working} onClick={exportSheet}>{report.ready?'Download reviewed worksheet (CSV)':'Download draft with exceptions (CSV)'}</button><button type="button" disabled={working} onClick={load}>Refresh report</button></div>
 <p className="muted">This spreadsheet is an estimate, not a payroll payment. Incomplete or unapproved timesheets remain visible as exceptions and are excluded from the approved totals. Overtime, multi-campus wage allocation, benefits, taxes and corrections require separate validation before owners issue pay.</p>
 </>}
 </section>;
}
