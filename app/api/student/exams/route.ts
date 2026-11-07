import {self} from '../route';
import {database} from '../../../../lib/storage';
import {validateRecord} from '../../../../lib/training';
import {ALL_STUDY_AREAS,summarizeKnowledgeAssessments} from '../../../../lib/learning-diagnostics';

const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function reply(v:any,status=200){return Response.json(v,{status,headers});}
const day=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});
function publishable(quiz:any,student:any){
 return quiz.kind==='quizzes'&&quiz.status==='Active'&&quiz.studentPractice===true
  &&quiz.campusId===student.campusId&&(!quiz.program||quiz.program===student.program)
  &&Array.isArray(quiz.questions)&&quiz.questions.length>=3&&quiz.questions.length<=30
  &&new Set(quiz.questions.map((q:any)=>q.id)).size===quiz.questions.length
  &&quiz.questions.every((q:any)=>q.id&&typeof q.prompt==='string'&&q.prompt.length>10
    &&Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=4
    &&Number.isInteger(Number(q.correct??q.correctIndex))&&Number(q.correct??q.correctIndex)>=0
    &&Number(q.correct??q.correctIndex)<q.options.length
    &&q.options.every((v:any)=>typeof v==='string'&&v.trim())
    &&ALL_STUDY_AREAS.includes(q.subject||quiz.subject||'Other'));
}
function safeQuiz(q:any){return {id:q.id,name:q.name,subject:q.subject||'Multiple subjects',questions:q.questions.map((question:any)=>({
 id:question.id,prompt:question.prompt,options:question.options,subject:question.subject||q.subject||'Other',objective:question.objective||''
}))};}
export async function GET(){
 const access=await self();if(!access)return reply({error:'Student portal access unavailable.'},401);
 const rows:any=await access.db.prepare("SELECT payload FROM records WHERE owner='academy-owner' AND kind='quizzes'").all();
 const banks=rows.results.map((row:any)=>JSON.parse(row.payload)).filter((q:any)=>publishable(q,access.student));
 const today=day(),done=(access.student.assessments||[]).filter((a:any)=>a.studentPractice===true&&a.date===today).map((a:any)=>a.assessmentId);
 return reply({quizzes:banks.map(safeQuiz).map((q:any)=>({...q,completedToday:done.includes(q.id)})),progress:summarizeKnowledgeAssessments(access.student),
  attempts:(access.student.assessments||[]).filter((a:any)=>a.studentPractice===true).slice(-12).reverse().map((a:any)=>({name:a.name,date:a.date,score:a.score,subjects:[...new Set((a.itemResults||[]).map((i:any)=>i.subject))]}))});
}
export async function POST(req:Request){
 const access=await self();if(!access)return reply({error:'Student portal access unavailable.'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Invalid origin.'},403);
 if(Number(req.headers.get('Content-Length')||0)>13000)return reply({error:'Too many answers.'},413);
 let data:any;try{data=await req.json();}catch{return reply({error:'Invalid answers.'},400);}
 const quizId=String(data.quizId||''),answers=data.answers;
 if(!quizId||!answers||typeof answers!=='object'||Array.isArray(answers))return reply({error:'Complete the published practice exam.'},400);
 const db=database(),quizRow:any=await db.prepare("SELECT payload FROM records WHERE id=? AND owner='academy-owner' AND kind='quizzes'").bind(quizId).first();
 const quiz=quizRow?JSON.parse(quizRow.payload):null;
 if(!quiz||!publishable(quiz,access.student))return reply({error:'This practice exam is no longer available.'},404);
 const questions=quiz.questions;
 if(Object.keys(answers).length!==questions.length||questions.some((q:any)=>!Object.hasOwn(answers,q.id)||!Number.isInteger(Number(answers[q.id]))||String(Number(answers[q.id]))!==String(answers[q.id])||Number(answers[q.id])<0||Number(answers[q.id])>=q.options.length))return reply({error:'Answer every question using one of the given options.'},400);
 const row:any=await db.prepare("SELECT payload,revision FROM records WHERE id=? AND owner='academy-owner' AND kind='students'").bind(access.student.id).first();
 if(!row)return reply({error:'Student training record unavailable.'},404);
 const student=JSON.parse(row.payload),at=new Date().toISOString(),date=day();
 if((student.assessments||[]).some((a:any)=>a.assessmentId===quizId&&a.studentPractice===true&&a.date===date))return reply({error:'You already completed this practice assessment today. Ask your instructor about a retake.'},409);
 const itemResults=questions.map((q:any)=>{
  const choice=Number(answers[q.id]),correct=choice===Number(q.correct??q.correctIndex);
  return {questionId:q.id,subject:q.subject||quiz.subject||'Other',objective:String(q.objective||q.prompt).slice(0,140),correct};
 });
 const correct=itemResults.filter((x:any)=>x.correct).length,total=questions.length,score=Math.round(correct/total*10000)/100;
 const objectives=[...new Set(itemResults.filter((i:any)=>!i.correct).map((i:any)=>i.objective))];
 const remediation=score<80?'Review with instructor: '+objectives.slice(0,6).join('; '):'';
 const attempt={id:crypto.randomUUID(),assessmentId:quizId,name:quiz.name,type:'Quiz',week:1,date,instructor:'Student portal · automated knowledge check',correct,total,score,remediation,studentPractice:true,itemResults,createdAt:at};
 const updated={...student,assessments:[...(student.assessments||[]),attempt]};
 const issue=validateRecord({...updated,id:access.student.id,kind:'students'});
 if(issue)return reply({error:'Cannot record assessment: '+issue},400);
 const saved=await db.prepare('UPDATE records SET payload=?,revision=revision+1,updated=? WHERE id=? AND owner=? AND revision=?').bind(JSON.stringify(updated),at,access.student.id,'academy-owner',row.revision).run();
 if(!saved.meta?.changes)return reply({error:'Your record changed. Refresh and retry.'},409);
 await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'academy-owner',access.student.id,'Student knowledge diagnostic completed',at,JSON.stringify({quizId,score,subjects:[...new Set(itemResults.map((i:any)=>i.subject))]}),access.user.email).run();
 return reply({score,correct,total,reviewTopics:objectives,notice:'This is a school practice assessment, not an official FMCSA ELDT or DMV knowledge exam.'});
}
