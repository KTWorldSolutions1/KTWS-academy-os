import {ChevronRight} from 'lucide-react';
import type {AttentionAlert} from '../lib/attention-alerts';
export default function DashboardAlertCards({alerts,onNavigate}:{alerts:AttentionAlert[];onNavigate:(page:string,recordId?:string)=>void}){
 return <>{alerts.slice(0,3).map(alert=><button type="button" className="alertcard" key={alert.id} onClick={()=>onNavigate(alert.page,alert.recordId)}><span>{alert.priority}</span><b>{alert.title}</b><small>{alert.recordName} • {alert.detail}</small><ChevronRight size={16}/></button>)}</>;
}
