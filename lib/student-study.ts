import type {RecordData as R} from './training.ts';

/** Manager-approved supplementary reading and ungraded practice questions.
 * Deliberately separate from real instructor-led instruction, ELDT hours and
 * protected assessments. Nothing here is an FMCSA certificate or test. */
export type PracticeQuestion={id:string;prompt:string;options:string[];correctIndex:number;explanation:string};
export function validateStudentStudyContent(r:R):string|null{
 if(r.kind!=='curriculum-units')return null;
 if(r.shareWithStudent!==undefined&&typeof r.shareWithStudent!=='boolean')return 'Select Yes or No for student study access.';
 if(r.studentGuide!=null&&(typeof r.studentGuide!=='string'||r.studentGuide.length>9000))return 'Student reading notes must stay under 9,000 characters.';
 if(r.practiceQuestions!=null){
  if(!Array.isArray(r.practiceQuestions)||r.practiceQuestions.length>12)return 'Use no more than 12 optional practice questions.';
  const ids=new Set<string>();
  for(const q of r.practiceQuestions){
   if(!q||typeof q!=='object'||typeof q.id!=='string'||q.id.length>100||!q.id||ids.has(q.id))return 'Each practice question needs a unique ID.';
   ids.add(q.id);
   if(typeof q.prompt!=='string'||q.prompt.trim().length<12||q.prompt.length>400)return 'Practice questions need 12–400 characters.';
   if(!Array.isArray(q.options)||q.options.length<2||q.options.length>4||q.options.some((o:any)=>typeof o!=='string'||o.trim().length<1||o.length>180))return 'Use two to four short answer choices.';
   if(!Number.isInteger(q.correctIndex)||q.correctIndex<0||q.correctIndex>=q.options.length)return 'Select one correct practice answer.';
   if(typeof q.explanation!=='string'||q.explanation.trim().length<12||q.explanation.length>500)return 'Explain the practice answer in 12–500 characters.';
  }
 }
 if(r.shareWithStudent===true){
  if(r.phase!=='Classroom')return 'Student home-study reading is only published for classroom lessons; yard and road still require direct instructor-led practical training.';
  if(!r.studentGuide?.trim()&&!(r.practiceQuestions||[]).length)return 'Add a student guide or practice question before publishing.';
 }
 return null;
}
export function studentStudyLibrary(student:R,records:R[]){
 if(!student||student.kind!=='students'||!student.campusId||!student.program)return [];
 return records
 .filter(u=>u.kind==='curriculum-units'&&u.status==='Approved'&&u.shareWithStudent===true&&u.phase==='Classroom'&&u.campusId===student.campusId&&u.program===student.program)
 .sort((a,b)=>Number(a.sequence||0)-Number(b.sequence||0)||a.name.localeCompare(b.name))
 .map(unit=>({
  id:unit.id,code:unit.code,name:unit.name,version:unit.version,objective:unit.objective,
  guide:typeof unit.studentGuide==='string'?unit.studentGuide:'',
  practiceQuestions:(Array.isArray(unit.practiceQuestions)?unit.practiceQuestions:[]).map((q:PracticeQuestion)=>({
   id:q.id,prompt:q.prompt,options:q.options,correctIndex:q.correctIndex,explanation:q.explanation
  }))
 }));
}
