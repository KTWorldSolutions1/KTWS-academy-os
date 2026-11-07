/** Rules for campus-based communication selection and private delivery batches.
 * The only allowed merge fields are display names; never insert confidential
 * DOBs, driver license numbers, financial approvals or government IDs.
 */
export const MESSAGE_TEMPLATES=[
 {id:'welcome',name:'Welcome / orientation',channel:'Email',subject:'Welcome to Lone Star Truck Driving Academy',body:'Hi {{firstName}},\n\nWelcome to Lone Star Truck Driving Academy. Please review your upcoming class details in your student portal and contact the campus office if you have questions.\n\nLone Star Truck Driving Academy'},
 {id:'missing',name:'Missing document reminder',channel:'Email',subject:'Action needed: enrollment documents',body:'Hi {{firstName}},\n\nYour school enrollment checklist has outstanding items. Sign in to your secure student portal to see the requested documents and upload them for review. Please do not send identification or Social Security documents by reply email or text.\n\nLone Star Truck Driving Academy'},
 {id:'testing',name:'Knowledge review / extra practice',channel:'SMS',subject:'',body:'Hi {{firstName}}, Lone Star has a practice review available in your student portal. Contact your instructor if you need extra help. Reply STOP to opt out.'},
 {id:'appointment',name:'Appointment reminder',channel:'SMS',subject:'',body:'Hi {{firstName}}, reminder from Lone Star Truck Driving Academy: please check your confirmed appointment details with your campus. Reply STOP to opt out.'},
 {id:'schedule',name:'Class schedule update',channel:'Email',subject:'Important school schedule update',body:'Hi {{firstName}},\n\nPlease review the latest class schedule with your Lone Star campus team. This message does not confirm a change to your approved start date.\n\nLone Star Truck Driving Academy'}
] as const;
export const OUTREACH_ROLES=['Owner','Regional admin','Campus manager','Enrollment specialist','Admin assistant'];
export function cleanMessageTemplate(input:string){
 return input.replace(/{{\s*([^{}]*)\s*}}/g,(all,field:string)=>['firstName','studentName','campusName'].includes(field.trim())?all:'');
}
export function expandMessageTemplate(input:string,recipient:{name?:string},campus:{name?:string}|undefined){
 const name=String(recipient.name||'Student').trim().slice(0,200);
 const firstName=name.split(/\s+/)[0]||'Student';
 return cleanMessageTemplate(input).replace(/{{\s*(firstName|studentName|campusName)\s*}}/g,(_,field:string)=>field==='firstName'?firstName:field==='studentName'?name:campus?.name||'Lone Star Truck Driving Academy');
}
export function checkBatchRequest(body:any){
 if(!body||typeof body!=='object')return 'Invalid request.';
 const ids=body.studentIds;
 if(!Array.isArray(ids)||!ids.length||ids.length>25||ids.some((id:any)=>typeof id!=='string'||id.length<3||id.length>100)||new Set(ids).size!==ids.length)return 'Select 1–25 unique students per message batch.';
 if(!['Email','SMS'].includes(body.channel)||typeof body.body!=='string'||!body.body.trim()||body.body.length>2500)return 'Provide a message of up to 2,500 characters.';
 if(body.channel==='SMS'&&body.body.length>480)return 'Keep bulk text messages to 480 characters or fewer.';
 if(body.channel==='Email'&&(!body.subject||typeof body.subject!=='string'||body.subject.length>180))return 'Email subject is required and must be under 180 characters.';
 if(typeof body.batchId!=='string'||!/^[-a-zA-Z0-9]{10,70}$/.test(body.batchId))return 'A stable batch ID is required.';
 if(body.action==='send'&&body.confirmSend!==true)return 'Confirm before delivering bulk messages.';
 if(!['preview','send'].includes(body.action))return 'Choose preview or send.';
 return null;
}
