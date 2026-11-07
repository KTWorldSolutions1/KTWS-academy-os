import type {RecordData as R} from './training.ts';
import {ALL_STUDY_AREAS} from './learning-diagnostics.ts';
/** A deterministic quiz builder that only reuses instructor-reviewed questions.
 * It never fabricates answers from lesson titles or unlicensed vendor material.
 * Instructors must review and publish the draft themselves. */
export function availableReviewedQuestions(records:R[],campusId:string,program='Class A',subject='General Knowledge'){
 const chosen=new Map<string,any>();
 for(const bank of records){
  if(bank.kind!=='quizzes'||bank.status!=='Active'||bank.campusId!==campusId
   ||bank.program!==program||!Array.isArray(bank.questions))continue;
  for(const question of bank.questions){
   if((question.subject||bank.subject||'Other')!==subject||!question.objective?.trim())continue;
   if(!Array.isArray(question.options)||question.options.length<2||!question.options.every((option:any)=>typeof option==='string'&&option.trim()))continue;
   const index=Number(question.correct??question.correctIndex);
   if(!Number.isInteger(index)||index<0||index>=question.options.length)continue;
   const key=question.prompt.trim().toLowerCase();
   if(key.length<12||chosen.has(key))continue;
   chosen.set(key,{...question,subject,objective:question.objective.trim()});
  }
 }
 return [...chosen.values()];
}
export function createReviewedDiagnostic(records:R[],campusId:string,program:string,subject:string,count=10){
 if(!ALL_STUDY_AREAS.includes(subject))throw Error('Select a supported knowledge subject.');
 const pool=availableReviewedQuestions(records,campusId,program,subject);
 if(pool.length<3)throw Error('Add at least three instructor-reviewed, tagged questions to an active campus question bank before generating a diagnostic.');
 const selected=pool.slice(0,Math.max(3,Math.min(30,count,pool.length)));
 return {id:crypto.randomUUID(),kind:'quizzes',campusId,program,name:subject+' • instructor review practice',status:'Draft',phase:'Classroom',type:'Quiz',week:1,
  subject,studentPractice:false,generatedFromApprovedQuestionPool:true,generatedAt:new Date().toISOString(),questions:selected.map(q=>({...q,id:crypto.randomUUID(),correct:String(q.correct??q.correctIndex)}))
 };
}
