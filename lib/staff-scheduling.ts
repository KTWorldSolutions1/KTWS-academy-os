import type {RecordData} from './training';

export const staffShiftStates=['Proposed','Approved','Completed','Cancelled'] as const;
export function dateIsValid(date:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return false;
 const d=new Date(date+'T12:00:00Z');
 return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===date;
}
export function timeMinutes(time:string){
 if(!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time||''))return NaN;
 const [h,m]=time.split(':').map(Number);
 return h*60+m;
}
export function paidShiftHours(shift:Pick<RecordData,'start'|'end'|'breakMinutes'>){
 const start=timeMinutes(shift.start),end=timeMinutes(shift.end),breaks=Number(shift.breakMinutes||0);
 if(!Number.isFinite(start)||!Number.isFinite(end)||!Number.isFinite(breaks)||end<=start||breaks<0||breaks>120||breaks>=end-start)return NaN;
 return Math.round((end-start-breaks)/60*100)/100;
}
export function validateStaffShift(r:RecordData){
 if(r.kind!=='shifts')return null;
 if(typeof r.employeeId!=='string'||!r.employeeId||typeof r.campusId!=='string'||!r.campusId)return 'Select a saved employee and campus.';
 if(!dateIsValid(r.date))return 'Choose a valid shift date.';
 if(!staffShiftStates.includes(r.status))return 'Choose a valid scheduling status.';
 const h=paidShiftHours(r);
 if(!Number.isFinite(h)||h<=0||h>12)return 'Paid shift hours must be more than zero and at most 12, excluding an unpaid break of 0–120 minutes.';
 return null;
}
export function staffShiftConflicts(shift:RecordData,all:RecordData[]){
 if(shift.status==='Cancelled')return [];
 const a=timeMinutes(shift.start),b=timeMinutes(shift.end);
 return all.filter(r=>r.kind==='shifts'&&r.id!==shift.id&&r.status!=='Cancelled'&&r.employeeId===shift.employeeId&&r.date===shift.date&&a<timeMinutes(r.end)&&b>timeMinutes(r.start));
}
export function weekStart(date:string){
 const d=new Date(date+'T12:00:00Z');
 if(!dateIsValid(date))throw Error('Invalid week date');
 const days=(d.getUTCDay()+6)%7;
 d.setUTCDate(d.getUTCDate()-days);
 return d.toISOString().slice(0,10);
}
export function weekDates(week:string){
 const d=new Date(weekStart(week)+'T12:00:00Z');
 return Array.from({length:7},(_,n)=>{const day=new Date(d);day.setUTCDate(day.getUTCDate()+n);return day.toISOString().slice(0,10);});
}
export function plannedPaidHours(shifts:RecordData[],employeeId:string,week:string){
 const days=new Set(weekDates(week));
 return Math.round(shifts.filter(r=>r.kind==='shifts'&&r.employeeId===employeeId&&days.has(r.date)&&r.status!=='Cancelled').reduce((sum,r)=>sum+paidShiftHours(r),0)*100)/100;
}
