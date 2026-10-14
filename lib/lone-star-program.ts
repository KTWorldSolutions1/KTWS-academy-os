/** Program planning only. The fifth week is reserved for testing; state rules remain independently verified. */
export const LONE_STAR_CLASS_A_WEEKS=5;
export const LONE_STAR_CAMPUSES=['Greensboro','Mansfield','Dallas'] as const;
export function classAWeek(startDate:string,day:string){
 const start=Date.parse(startDate+'T12:00:00Z'),at=Date.parse(day+'T12:00:00Z');
 if(!Number.isFinite(start)||!Number.isFinite(at)||!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Use YYYY-MM-DD dates');
 const week=Math.floor((at-start)/604800000)+1;
 return {week,phase:week<1?'Not started':week<=4?'Instruction':week===5?'Testing':'After program',withinProgram:week>=1&&week<=5};
}
