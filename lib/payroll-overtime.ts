import {weeklyCampusMinutes,workIntervals,type WorkPunch} from './payroll-intervals';
/** Provisional FLSA-style weighted regular-rate overtime calculation.
 * Assumes nonexempt hourly employment and a single shared employer/workweek.
 * Effective-dated rates, other compensation and legally applicable exceptions
 * must be independently reviewed before payroll.
 */
export function overtimeEstimate(punches:WorkPunch[],week:string,rateCents:Record<string,number>){
 const boundary=weeklyCampusMinutes(punches,week);
 const intervals=workIntervals(punches).intervals
  .map(x=>({...x,from:Math.max(x.from,boundary.from),to:Math.min(x.to,boundary.to)}))
  .filter(x=>x.to>x.from).sort((a,b)=>a.from-b.from);
 const byCampus:Record<string,{minutes:number;regularMinutes:number;overtimeMinutes:number;baseCents:number;premiumCents:number;grossCents:number}>={};
 let elapsed=0;
 for(const x of intervals){
  const minutes=(x.to-x.from)/60000;
  const remaining=Math.max(0,2400-elapsed);
  const regular=Math.min(minutes,remaining),overtime=minutes-regular;
  const row=byCampus[x.campusId]||{minutes:0,regularMinutes:0,overtimeMinutes:0,baseCents:0,premiumCents:0,grossCents:0};
  row.minutes+=minutes;row.regularMinutes+=regular;row.overtimeMinutes+=overtime;elapsed+=minutes;byCampus[x.campusId]=row;
 }
 const missing=Object.keys(byCampus).filter(campus=>!Number.isInteger(rateCents[campus])||rateCents[campus]<=0);
 const totalMinutes=Object.values(byCampus).reduce((n,x)=>n+x.minutes,0);
 const totalOvertime=Object.values(byCampus).reduce((n,x)=>n+x.overtimeMinutes,0);
 const weightedCents=missing.length||!totalMinutes?null:Object.entries(byCampus).reduce((n,[id,row])=>n+row.minutes*rateCents[id],0)/totalMinutes;
 if(weightedCents!==null){
  for(const [campus,row] of Object.entries(byCampus)){
   row.baseCents=row.minutes*rateCents[campus]/60;
   row.premiumCents=row.overtimeMinutes*weightedCents/120;
   row.grossCents=row.baseCents+row.premiumCents;
  }
 }
 return {byCampus,totalHours:totalMinutes/60,overtimeHours:totalOvertime/60,
  weightedRegularRate:weightedCents===null?null:weightedCents/100,
  missingRateCampuses:missing,issues:boundary.issues,
  note:'Provisional wage estimate: assumes nonexempt hourly work and weighted regular rate for concurrent campus rates. Review classification, nondiscretionary bonuses, rate history, tips, other employers, payroll policies and legal exceptions.'};
}
