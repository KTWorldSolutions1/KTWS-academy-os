/** Instructor-approved CDL knowledge diagnostics. These are local practice
 * results, not FMCSA theory exams or state CDL permit test results. */
export const CDL_KNOWLEDGE_AREAS=['General Knowledge','Air Brakes','Combination Vehicles'] as const;
export const OTHER_STUDY_AREAS=['Hours of Service','Trip Planning','Map Reading','Vehicle Inspections','Other'];
export const ALL_STUDY_AREAS=[...CDL_KNOWLEDGE_AREAS,...OTHER_STUDY_AREAS] as string[];
export type TopicScore={subject:string;correct:number;total:number;percent:number;missedObjectives:string[]};
export function summarizeKnowledgeAssessments(student:any):TopicScore[]{
 const counters=new Map<string,{correct:number;total:number;objectives:Set<string>}>();
 for(const assessment of student?.assessments||[]){
  for(const item of assessment?.itemResults||[]){
   if(!ALL_STUDY_AREAS.includes(item.subject))continue;
   const row=counters.get(item.subject)||{correct:0,total:0,objectives:new Set<string>()};
   row.total++;if(item.correct)row.correct++;else row.objectives.add(String(item.objective||'Review this subject').slice(0,140));
   counters.set(item.subject,row);
  }
 }
 return ALL_STUDY_AREAS.filter(subject=>counters.has(subject)).map(subject=>{
  const row=counters.get(subject)!;
  return {subject,correct:row.correct,total:row.total,percent:Math.round(row.correct/row.total*100),missedObjectives:[...row.objectives]};
 });
}
export function cohortKnowledgeSignals(students:any[]){
 const groups=new Map<string,{students:Set<string>;incorrect:number;total:number;objectives:Map<string,{missed:number;total:number}>}>();
 for(const s of students){
  for(const a of s.assessments||[]){
   for(const item of a.itemResults||[]){
    if(!ALL_STUDY_AREAS.includes(item.subject))continue;
    const key=item.subject;
    const entry=groups.get(key)||{students:new Set<string>(),incorrect:0,total:0,objectives:new Map()};
    entry.students.add(s.id);entry.total++;if(!item.correct)entry.incorrect++;
    const objective=String(item.objective||'Uncategorized '+key).slice(0,140);
    const row=entry.objectives.get(objective)||{missed:0,total:0};
    row.total++;if(!item.correct)row.missed++;
    entry.objectives.set(objective,row);groups.set(key,entry);
   }
  }
 }
 return [...groups].map(([subject,row])=>({
  subject,students:row.students.size,total:row.total,incorrect:row.incorrect,accuracy:row.total?Math.round(100*(row.total-row.incorrect)/row.total):0,
  objectives:[...row.objectives].map(([name,t])=>({name,...t,accuracy:Math.round(100*(t.total-t.missed)/t.total)})).sort((a,b)=>a.accuracy-b.accuracy)
 })).sort((a,b)=>a.accuracy-b.accuracy);
}
