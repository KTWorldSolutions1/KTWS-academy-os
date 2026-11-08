'use client';
import {useId,useState} from 'react';
const parts=[
 ['Tractor','The powered vehicle that pulls the trailer.'],
 ['Trailer','The unpowered freight-carrying unit.'],
 ['Fifth wheel','The coupling on the tractor that engages the trailer kingpin. Verify coupling with the instructor’s approved inspection procedure.'],
 ['Landing gear','Supports the front of an uncoupled trailer.'],
 ['Air and electrical lines','Connect tractor and trailer brake-air and electrical systems.'],
 ['Axles and wheels','Support the vehicle and transmit braking forces; identify tires, wheels and axle groups.'],
 ['Brake components','Located at the wheel ends and under the vehicle; inspect using approved training materials. Never crawl beneath an unsecured vehicle.']
] as const;
export default function VehicleFamiliarization(){
 const id=useId(),[selected,setSelected]=useState<number|null>(null),[reveal,setReveal]=useState(false);
 const markers=[[90,104],[350,75],[177,141],[224,165],[143,106],[388,180],[92,182]];
 return <section className="classroom-workshop"><h3>Identify the vehicle components</h3><p>Say the name and purpose of each numbered area before revealing it. This simplified side view is a classroom aid; follow it with a supervised vehicle walkaround.</p>
 <svg viewBox="0 0 500 230" role="img" aria-labelledby={id} style={{width:'100%',maxWidth:760,background:'#f1f5f9',borderRadius:12}}><title id={id}>Tractor-trailer side view. Numbers correspond to the component buttons below. Hidden coupling, connections and brakes are approximate locations.</title><g stroke="#334155" strokeWidth="3"><path d="M40 165V115L65 80H120V165Z" fill="#2563eb"/><path d="M65 90H100V116H50Z" fill="#dbeafe"/><rect x="152" y="48" width="315" height="105" rx="4" fill="#cbd5e1"/><path d="M120 151H210M220 153V187M140 125L152 105" fill="none"/><rect x="160" y="140" width="34" height="8" fill="#475569"/>{[70,151,185,390,425].map(x=><circle key={x} cx={x} cy="180" r="19" fill="#334155"/>)}<path d="M25 202H480"/></g>{markers.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="12" fill={selected===i?'#1d4ed8':'white'} stroke="#1e3a8a" strokeWidth="2"/><text x={x} y={y+4} textAnchor="middle" fill={selected===i?'white':'#0f172a'} fontSize="13" fontWeight="bold">{i+1}</text></g>)}</svg>
 <div className="subtabs" role="group" aria-label="Vehicle component numbers">{parts.map((_,i)=><button type="button" key={i} aria-pressed={selected===i} onClick={()=>{setSelected(i);setReveal(false);}}>Component {i+1}</button>)}</div>
 {selected!==null&&<div aria-live="polite"><p>What is component {selected+1}, and what does it do?</p><button type="button" onClick={()=>setReveal(!reveal)}>{reveal?'Hide answer':'Reveal answer'}</button>{reveal&&<p><b>{parts[selected][0]}:</b> {parts[selected][1]}</p>}</div>}
 </section>;
}
