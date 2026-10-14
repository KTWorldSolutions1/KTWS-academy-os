// Academy OS attendance and training-log domain rules.
// Persistence is handled by the existing authenticated records/audit API.
export const ATTENDANCE = Object.freeze(['present','absent','tardy','excused','partial']);
export const TRAINING_CATEGORIES = Object.freeze(['classroom','range','road_driving','observation']);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value+'T12:00:00Z'));
const required = (value, label) => { if (typeof value !== 'string' || !value.trim()) throw new Error(label+' is required'); return value.trim(); };
const time = (value, label) => { if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error(label+' must be HH:mm'); return value; };
export function createAttendance(input) {
  const campusId = required(input.campusId,'Campus');
  const studentId = required(input.studentId,'Student');
  if (!validDate(input.date)) throw new Error('Valid attendance date is required');
  if (!ATTENDANCE.includes(input.status)) throw new Error('Attendance status must be explicitly recorded');
  return {type:'student_attendance',campusId,studentId,date:input.date,status:input.status,notes:String(input.notes||''),recordedBy:required(input.actorId,'Actor'),recordedAt:new Date().toISOString()};
}
export function createTrainingLog(input) {
  const campusId=required(input.campusId,'Campus'),studentId=required(input.studentId,'Student');
  const instructorId=required(input.instructorId,'Instructor');
  if (!validDate(input.date)) throw new Error('Valid training date is required');
  if (!TRAINING_CATEGORIES.includes(input.category)) throw new Error('Invalid training category');
  const start=time(input.start,'Start'),end=time(input.end,'End');
  const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);
  const minutes=(eh*60+em)-(sh*60+sm);
  if (minutes<=0 || minutes>720) throw new Error('Training duration must be positive and at most 12 hours; split overnight sessions');
  if (input.category==='road_driving' && input.studentOperatedVehicle!==true) throw new Error('Road driving hours require student-operated vehicle confirmation');
  if (input.category==='observation' && input.studentOperatedVehicle===true) throw new Error('Observation cannot be credited as student driving');
  return {type:'student_training_log',campusId,studentId,instructorId,date:input.date,category:input.category,start,end,minutes,studentOperatedVehicle:input.category==='road_driving',skills:Array.isArray(input.skills)?input.skills.map(String):[],proficiency:input.proficiency||'not_assessed',notes:String(input.notes||''),remediation:String(input.remediation||''),recordedBy:required(input.actorId,'Actor'),recordedAt:new Date().toISOString()};
}
export function summarizeDailyRecords(students,attendance,logs,date) {
  return students.map(student=>{
    const a=attendance.find(x=>x.studentId===student.id&&x.date===date);
    const sessions=logs.filter(x=>x.studentId===student.id&&x.date===date);
    return {studentId:student.id,name:student.name,status:a?.status||'not_recorded',minutesByCategory:Object.fromEntries(TRAINING_CATEGORIES.map(c=>[c,sessions.filter(x=>x.category===c).reduce((n,x)=>n+x.minutes,0)])),sessions:sessions.length};
  });
}
export function validateRecordScope(record,actorCampusIds) {
  if (!Array.isArray(actorCampusIds)||!actorCampusIds.includes(record.campusId)) throw new Error('Campus access denied');
  return true;
}
