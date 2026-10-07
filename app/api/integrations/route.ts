import {env} from '../../../lib/env';
import {getWorkspaceAccess} from '../../../lib/workspace-access';
export async function GET(){const a=await getWorkspaceAccess();if(!a)return Response.json({error:'Sign in required'},{status:401});const e:any=env;return Response.json({sms:!!(e.TWILIO_ACCOUNT_SID&&e.TWILIO_AUTH_TOKEN&&e.TWILIO_FROM_NUMBER),email:!!(e.RESEND_API_KEY&&e.SCHOOL_EMAIL_FROM),encryptedStorage:!!e.RECORDS_ENCRYPTION_KEY,tpr:false,eSignature:false});}
