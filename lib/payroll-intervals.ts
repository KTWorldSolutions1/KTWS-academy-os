/** Pure clock-punch interval accounting for preliminary school timesheets.
 * Time-zone boundaries follow the campus payroll policy (Eastern).
 * This module deliberately does not calculate FLSA or state overtime premiums.
 */
export type WorkPunch={id?:string;action:string;at:string;campus_id:string};
export type WorkInterval={from:number;to:number;campusId:string};
export type PayrollIntervals={intervals:WorkInterval[];issues:string[];open:boolean};
export function workIntervals(punches:WorkPunch[]):PayrollIntervals{
 const sorted=[...punches].sort((a,b)=>a.at.localeCompare(b.at)||(a.id||'').localeCompare(b.id||''));
 const intervals:WorkInterval[]=[],issues:string[]=[];
 let state:'out'|'working'|'break'='out',start=0,campus='',breakStart=0;
 for(const punch of sorted){
  const t=Date.parse(punch.at);
  if(!Number.isFinite(t)){issues.push('Invalid punch timestamp');continue;}
  if(punch.action==='clock_in'){
   if(state!=='out'){issues.push('Overlapping clock-in');continue;}
   state='working';start=t;campus=punch.campus_id;
  }else if(punch.action==='break_start'){
   if(state!=='working'){issues.push('Break start without active work');continue;}
   if(t<start){issues.push('Out-of-order punch');continue;}
   if(punch.campus_id!==campus)issues.push('Campus changed during shift');
   intervals.push({from:start,to:t,campusId:campus});breakStart=t;state='break';
  }else if(punch.action==='break_end'){
   if(state!=='break'){issues.push('Break end without started break');continue;}
   if(t<breakStart){issues.push('Out-of-order punch');continue;}
   if(punch.campus_id!==campus)issues.push('Campus changed during shift');
   start=t;state='working';
  }else if(punch.action==='clock_out'){
   if(state!=='working'){issues.push('Clock-out without active work');continue;}
   if(t<start){issues.push('Out-of-order punch');continue;}
   if(punch.campus_id!==campus)issues.push('Campus changed during shift');
   intervals.push({from:start,to:t,campusId:campus});
   state='out';campus='';
  }else issues.push('Unknown punch type');
 }
 if(state!=='out')issues.push('Open time entry');
 return {intervals,issues:[...new Set(issues)],open:state!=='out'};
}
function mondayUtc(date:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid payroll week');
 const [y,m,d]=date.split('-').map(Number),midday=Date.UTC(y,m-1,d,12),parsed=new Date(midday);
 if(Number.isNaN(midday)||parsed.toISOString().slice(0,10)!==date||parsed.getUTCDay()!==1)throw Error('Payroll week must start Monday');
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',timeZoneName:'shortOffset',hour:'2-digit'}).formatToParts(parsed);
 const zone=parts.find(p=>p.type==='timeZoneName')?.value||'';
 const match=zone.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
 if(!match)throw Error('Unsupported payroll time zone offset');
 const sign=match[1]==='+'?1:-1,offsetMinutes=sign*(Number(match[2])*60+Number(match[3]||0));
 return Date.UTC(y,m-1,d)-offsetMinutes*60000;
}
export function weeklyCampusMinutes(punches:WorkPunch[],monday:string){
 const from=mondayUtc(monday),to=new Date(from).getTime()+7*86400000;
 // Use the next Monday local midnight, not a fixed 168-hour interval, to preserve DST.
 const d=new Date(monday+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7);
 const end=mondayUtc(d.toISOString().slice(0,10));
 const result=workIntervals(punches),totals:Record<string,number>={};
 for(const x of result.intervals){
  const span=Math.max(0,Math.min(x.to,end)-Math.max(x.from,from));
  if(span>0)totals[x.campusId]=(totals[x.campusId]||0)+span/60000;
 }
 const hasPunchInWeek=punches.some(p=>Date.parse(p.at)>=from&&Date.parse(p.at)<end);
 return {from,to:end,totals,issues:result.issues,hasPunchInWeek,open:result.open};
}
