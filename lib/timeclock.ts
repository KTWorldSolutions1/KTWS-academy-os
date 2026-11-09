export type Punch={type:'in'|'out'|'paid-break'|'unpaid-break'|'resume';at:string};
export type Timecard={id:string;employeeId:string;employeeName:string;campusId:string;campusName:string;timezone:string;events:Punch[];revision:number;status:'Open'|'Pending'|'Approved';adjustment?:{start:string;end:string;unpaidMinutes:number;reason:string};pay?:{rate:number;overtimeHours:number;multiplier:number;reviewedBy:string;reviewedAt:string};history?:any[]};
export const managesTime=(role:string)=>['Owner','Regional admin','Campus manager'].includes(role);
export function timeTotals(card:Timecard,now=Date.now()){
 const first=card.events[0];if(!first||first.type!=='in')throw Error('Missing clock-in.');
 let previous=Date.parse(first.at),state='working',unpaid=0,paid=0,last=previous;
 if(!Number.isFinite(previous))throw Error('Invalid clock time.');
 for(const e of card.events.slice(1)){
  const at=Date.parse(e.at);if(!Number.isFinite(at)||at<previous||state==='out')throw Error('Invalid punch sequence.');
  if(state==='unpaid-break')unpaid+=at-previous;else paid+=at-previous;
  if(e.type==='out')state='out';else if(e.type==='resume'&&['paid-break','unpaid-break'].includes(state))state='working';else if(['paid-break','unpaid-break'].includes(e.type)&&state==='working')state=e.type;else throw Error('Invalid punch transition.');
  previous=at;last=at;
 }
 if(state!=='out'){const delta=Math.max(0,now-last);if(state==='unpaid-break')unpaid+=delta;else paid+=delta;}
 let start=first.at,end=state==='out'?card.events.at(-1)!.at:null;
 if(card.adjustment){const a=card.adjustment,span=Date.parse(a.end)-Date.parse(a.start);if(!Number.isFinite(span)||span<=0||span>7*86400000||!Number.isFinite(a.unpaidMinutes)||a.unpaidMinutes<0||a.unpaidMinutes*60000>=span)throw Error('Correction must have valid start/end times and an unpaid break shorter than the shift.');start=a.start;end=a.end;unpaid=a.unpaidMinutes*60000;paid=span-unpaid;state='out';}
 return {start,end,state,hours:paid/3600000,unpaidMinutes:unpaid/60000,elapsedHours:(paid+unpaid)/3600000};
}
export function payrollAmount(card:Timecard){const h=timeTotals(card).hours,p=card.pay;if(!p||!Number.isFinite(p.rate)||p.rate<=0||p.rate>10000||!Number.isFinite(p.overtimeHours)||p.overtimeHours<0||p.overtimeHours>h||!Number.isFinite(p.multiplier)||p.multiplier<1||p.multiplier>5)throw Error('Enter a positive hourly rate and valid overtime allocation.');return {hours:h,regularHours:h-p.overtimeHours,overtimeHours:p.overtimeHours,gross:Math.round(((h-p.overtimeHours)*p.rate+p.overtimeHours*p.rate*p.multiplier)*100)/100};}
export function timecardDate(c:Timecard){return new Intl.DateTimeFormat('en-CA',{timeZone:c.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timeTotals(c).start));}
const csv=(v:unknown)=>'"'+String(v??'').replace(/^\s*[=+@-]/,"'$&").replaceAll('"','""')+'"';
export function payrollCsv(cards:Timecard[]){
 const rows:any[][]=[['Employee','Employee ID','Campus','Hourly rate','Regular hours','Overtime hours','Overtime multiplier','Total paid hours','Gross payroll estimate','Approved timecards']];
 const groups=new Map<string,any>();
 for(const c of cards){if(c.status!=='Approved')throw Error('Only approved timecards can be exported.');const p=payrollAmount(c),key=JSON.stringify([c.employeeId,c.campusId,c.pay!.rate,c.pay!.multiplier]);const g=groups.get(key)||{name:c.employeeName,id:c.employeeId,campus:c.campusName,rate:c.pay!.rate,multiplier:c.pay!.multiplier,regular:0,ot:0,hours:0,gross:0,cards:[]};g.regular+=p.regularHours;g.ot+=p.overtimeHours;g.hours+=p.hours;g.gross+=p.gross;g.cards.push(c.id+'@'+c.revision);groups.set(key,g);}
 for(const g of groups.values())rows.push([g.name,g.id,g.campus,g.rate.toFixed(2),g.regular.toFixed(6),g.ot.toFixed(6),g.multiplier,g.hours.toFixed(6),g.gross.toFixed(2),g.cards.join('; ')]);
 const total=[...groups.values()].reduce((t,g)=>({regular:t.regular+g.regular,ot:t.ot+g.ot,hours:t.hours+g.hours,gross:t.gross+g.gross}),{regular:0,ot:0,hours:0,gross:0});
 rows.push(['TOTAL','','','',total.regular.toFixed(6),total.ot.toFixed(6),'',total.hours.toFixed(6),total.gross.toFixed(2),'']);
 return '\ufeff'+rows.map(r=>r.map(csv).join(',')).join('\r\n');
}
