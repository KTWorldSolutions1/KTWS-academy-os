/** Auditable Class A classroom-to-yard eligibility.
 * The reported prior-hours carry-forward cannot substitute for instructor evidence.
 * A verified uploaded result is not itself a negative/cleared screening outcome.
 */
import {instructionHours,type RecordData as R} from './training.ts';
import {latestEvidence} from './student-documents.ts';
export const YARD_ENTRY_HOURS=50;
export function yardEntryReadiness(student:R){
 const verifiedHours=instructionHours(student,'Classroom');
 const permitVerified=latestEvidence(student,'Commercial learner permit')?.verified===true;
 const drugResultVerified=latestEvidence(student,'Drug screen result')?.verified===true;
 const cleared=student.yardClearance==='Cleared';
 const reasons:string[]=[];
 if(verifiedHours<YARD_ENTRY_HOURS)reasons.push('Classroom attendance verified: '+verifiedHours+'/'+YARD_ENTRY_HOURS+' hours');
 if(!permitVerified)reasons.push('Verified commercial learner permit document required');
 if(!drugResultVerified)reasons.push('Verified drug screen result required');
 if(!cleared)reasons.push('Administrative drug-screen clearance must be marked Cleared');
 return {ready:reasons.length===0,reasons,verifiedHours,permitVerified,drugResultVerified,cleared};
}
export function promoteEligibleStudent(student:R,at:string,actor:string):R{
 if(student.kind!=='students'||!['Enrolled','Classroom','Waiting for permit','Enrollment pending'].includes(student.status)||!yardEntryReadiness(student).ready)return student;
 return {...student,status:'Yard',yardAdvancedAt:at,yardAdvancedBy:actor,yardAdvancedAutomatically:true,yardEntryBasis:'50 verified classroom hours, verified CLP, verified drug screen result, and recorded clearance'};
}
