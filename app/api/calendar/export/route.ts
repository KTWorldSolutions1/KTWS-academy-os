import {getWorkspaceAccess} from '../../../../lib/workspace-access';
import {database} from '../../../../lib/storage';
import {createPublicCalendarIcs,publicCampusEvents} from '../../../../lib/calendar-ics';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function GET(req:Request){
 const access=await getWorkspaceAccess();
 if(!access)return Response.json({error:'Sign in required'},{status:401,headers});
 if(!['Owner','Regional admin','Campus manager','Enrollment specialist','Admin assistant'].includes(access.role))return Response.json({error:'School calendar export not authorized.'},{status:403,headers});
 const campusId=new URL(req.url).searchParams.get('campusId')||'';
 if(!campusId||campusId.length>100)return Response.json({error:'Select a campus.'},{status:400,headers});
 const db=database();
 const campusRow:any=await db.prepare("SELECT payload FROM records WHERE owner=? AND kind='campuses' AND id=?").bind(access.scope,campusId).first();
 if(!campusRow)return Response.json({error:'Campus not found.'},{status:404,headers});
 if(!['Owner','Regional admin'].includes(access.role)&&!access.campusIds.includes(campusId))return Response.json({error:'Campus not authorized.'},{status:403,headers});
 const campus=JSON.parse(campusRow.payload);
 const all:any=await db.prepare("SELECT payload FROM records WHERE owner=? AND kind IN ('classes','closures','announcements')").bind(access.scope).all();
 const records=all.results.map((row:any)=>JSON.parse(row.payload));
 const calendar=createPublicCalendarIcs(publicCampusEvents(records,campusId),String(campus.name||'Academy'));
 const safe=String(campus.name||'Campus').replace(/[^a-z0-9-_]/gi,'_').slice(0,60);
 await db.prepare('INSERT INTO audit(id,owner,record_id,action,at,payload,actor) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),access.scope,campusId,'Privacy-minimized staff ICS calendar exported',new Date().toISOString(),JSON.stringify({events:publicCampusEvents(records,campusId).length,excludesStudentPII:true}),access.user.email).run();
 return new Response(calendar,{headers:{...headers,'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="LoneStar_'+safe+'_Calendar.ics"','Content-Security-Policy':'sandbox'}});
}
