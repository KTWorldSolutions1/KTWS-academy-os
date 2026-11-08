/** Fictional single-shift classroom exercises. Never official logs or attendance.
 * Rule reference checked 2026-11-08:
 * https://www.fmcsa.dot.gov/regulations/hours-service/summary-hours-service-regulations
 * Full exception practice: https://eld.fmcsa.dot.gov/HOSRuleTool/
 */
export type Duty = 'Off duty'|'Sleeper berth'|'Driving'|'On duty';
export type PracticeEvent={duty:Duty;minutes:number;note:string};
export const DUTIES:Duty[]=['Off duty','Sleeper berth','Driving','On duty'];
export const INDUSTRY_TERMS=[
 ['Deadhead','Travel with an empty trailer between loads.'],
 ['Bobtail','Operate a tractor without a trailer.'],
 ['Drop and hook','Leave one trailer and couple to another.'],
 ['Live load','Wait while freight is loaded into the trailer you brought.'],
 ['Detention','Waiting beyond an agreed free-time allowance; payment depends on the agreement.'],
 ['Layover','An extended delay between work assignments; pay depends on employer terms.'],
 ['Home time','Scheduled time away from driving work to return home.'],
 ['Lumper','A person or service hired to load or unload freight.']
] as const;
export const ORIENTATION_CHECKLIST=[
 'Welcome to Lone Star and introduce campus contacts.',
 'Explain program expectations and attendance requirements.',
 'Review student policies, conduct and professionalism.',
 'Walk through the five-week training process and evidence needed at each stage.',
 'Explain CDL licensing requirements and permit milestones.',
 'Discuss DOT physicals and medical certification using approved materials.',
 'Discuss drug and alcohol requirements and school clearance procedures.',
 'Introduce employment opportunities without promising a job.',
 'Discuss the responsibilities of holding a CDL.',
 'Have each student identify tractor, trailer, fifth wheel, landing gear, air/electrical lines, axles and brake components on a diagram.',
 'Have each student explain the eight industry terms and use them in a dispatch conversation.'
];
export function scheduleBudget(start:string,end:string,breakMinutes:number,days:number,target=50){
 const parse=(v:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(v)?Number(v.slice(0,2))*60+Number(v.slice(3)):NaN;
 const span=parse(end)-parse(start);
 if(!Number.isFinite(span)||span<=0||!Number.isInteger(breakMinutes)||breakMinutes<0||breakMinutes>=span||!Number.isInteger(days)||days<1||days>31||!Number.isFinite(target)||target<=0)throw Error('Enter a same-day schedule, valid break and 1–31 teaching days.');
 const daily=(span-breakMinutes)/60,total=daily*days;
 return {daily,total,remaining:Math.max(0,target-total),minimumDays:Math.ceil(target/daily)};
}
export function practiceClock(events:PracticeEvent[],priorCycleMinutes=0,cycleLimit:60|70=70){
 if(![60,70].includes(cycleLimit)||!Number.isInteger(priorCycleMinutes)||priorCycleMinutes<0||priorCycleMinutes>cycleLimit*60)throw Error('Enter prior cycle usage within the selected cycle.');
 let elapsed=0,drive=0,onDuty=0,sinceBreak=0,nonDriving=0,shiftStart:number|null=null;
 const flags:{row:number;reason:string}[]=[];
 const rows=events.map((e,index)=>{
  if(!DUTIES.includes(e.duty)||!Number.isInteger(e.minutes)||e.minutes<1||e.minutes>480||elapsed+e.minutes>1440)throw Error('Use 1–480 minutes per segment and at most 24 hours per exercise.');
  const start=elapsed;elapsed+=e.minutes;
  if(shiftStart===null&&['Driving','On duty'].includes(e.duty))shiftStart=start;
  if(e.duty==='Driving'){
   if(drive+e.minutes>660)flags.push({row:index,reason:'Driving exceeds the 11-hour exercise limit.'});
   if(shiftStart!==null&&elapsed-shiftStart>840)flags.push({row:index,reason:'Driving extends beyond the 14-hour exercise window.'});
   if(sinceBreak+e.minutes>480)flags.push({row:index,reason:'More than 8 driving hours without a qualifying interruption.'});
   if(priorCycleMinutes+onDuty+e.minutes>cycleLimit*60)flags.push({row:index,reason:'Driving extends beyond the selected cycle limit.'});
   drive+=e.minutes;sinceBreak+=e.minutes;nonDriving=0;
  }else {nonDriving+=e.minutes;if(nonDriving>=30)sinceBreak=0;}
  if(['Driving','On duty'].includes(e.duty))onDuty+=e.minutes;
  return {...e,start,end:elapsed};
 });
 const remaining={drive:Math.max(0,660-drive),window:Math.max(0,840-(shiftStart===null?0:elapsed-shiftStart)),break:Math.max(0,480-sinceBreak),cycle:Math.max(0,cycleLimit*60-priorCycleMinutes-onDuty)};
 const extendedRest=events.some((_,i)=>{let rest=0;for(let j=i;j<events.length&&['Off duty','Sleeper berth'].includes(events[j].duty);j++)rest+=events[j].minutes;return rest>=600;});
 return {rows,elapsed,drive,onDuty,remaining,flags,extendedRest,nextDrivingMinutes:Math.min(...Object.values(remaining))};
}
export const CLOCK_SCENARIOS:{id:string;title:string;prior:number;events:PracticeEvent[];question:string;answer:number;explanation:string}[]=[
 {id:'shipper',title:'Shipper delay',prior:0,events:[{duty:'On duty',minutes:30,note:'Pre-trip'},{duty:'Driving',minutes:240,note:'First leg'},{duty:'On duty',minutes:120,note:'Shipper delay'}],question:'How many minutes of the 14-hour window remain?',answer:450,explanation:'6.5 elapsed hours leave 7.5 hours (450 minutes). Waiting does not pause this exercise window.'},
 {id:'break',title:'Break due',prior:0,events:[{duty:'On duty',minutes:30,note:'Pre-trip'},{duty:'Driving',minutes:480,note:'Eight driving hours'}],question:'How many minutes may you drive immediately, before a qualifying interruption?',answer:0,explanation:'The break clock is exhausted. A qualifying interruption is needed before further driving.'},
 {id:'cycle',title:'Cycle nearly full',prior:4080,events:[{duty:'On duty',minutes:30,note:'Pre-trip'},{duty:'Driving',minutes:60,note:'First leg'}],question:'With 68 hours already used in a 70-hour cycle, how many cycle minutes remain?',answer:30,explanation:'68 previous hours plus 1.5 on-duty hours leave 30 minutes. Pre-trip uses cycle time too.'}
];
export const DISPATCH_QUESTIONS=[
 {id:'route',prompt:'The car GPS uses a road posted below this truck’s height. What is your plan?',options:['Use it because GPS is faster','Verify a truck-legal alternative using the atlas and current restrictions','Follow another truck without checking'],answer:1,explanation:'Verify vehicle dimensions and current route restrictions; an atlas is one planning source, not live clearance approval.'},
 {id:'hours',prompt:'The supplied clock has 5 hours left in the window. The load needs 6 driving hours plus unloading. Accept the appointment as achievable?',options:['Yes, skip the break','Yes, drive faster','No; notify dispatch and arrange a feasible plan'],answer:2,explanation:'Six driving hours cannot fit into five remaining window hours. Escalate the appointment conflict.'},
 {id:'eta',prompt:'A fictional trip needs 4 driving hours, 30 minutes pre-trip and 60 minutes unloading. How much time is needed before traffic or other stops?',options:['5 hours 30 minutes','4 hours','4 hours 30 minutes'],answer:0,explanation:'Add all work and stop time, then allow for traffic, rest and time-zone differences.'},
 {id:'delay',prompt:'A shipper delay makes the promised delivery impossible. What should your message include?',options:['A promise to make up time by speeding','The delay, available hours, revised ETA and request for a safe plan','Only that you will be late'],answer:1,explanation:'Give dispatch the facts and the revised plan; never promise driving beyond available hours.'}
];
export function dispatchFeedback(answers:Record<string,number>){
 const attempted=DISPATCH_QUESTIONS.filter(q=>Number.isInteger(answers[q.id]));
 return {complete:attempted.length===DISPATCH_QUESTIONS.length,correct:attempted.filter(q=>answers[q.id]===q.answer).length,total:DISPATCH_QUESTIONS.length,
 remediation:attempted.filter(q=>answers[q.id]!==q.answer).map(q=>q.explanation)};
}
