export const roleModules:Record<string,string[]>={
 'Regional admin':['student-id-studio','student-portal-preview','closeout','insights','lesson-checkoffs','safety','credentials','sponsorships','dispatch','event-intake','employment-offers','agency','shifts','overview','intelligence','operations','growth','leads','calendar','classes','students','courses','tasks','fleet','finance','funding','partners','mous','tpr','compliance','audit','rosters','document-center','learning-diagnostics','driver-playbook','funding-invoices'],
 'Campus manager':['student-id-studio','student-portal-preview','rosters','document-center','learning-diagnostics','driver-playbook','funding-invoices','closeout','insights','lesson-checkoffs','safety','credentials','sponsorships','dispatch','event-intake','employment-offers','agency','shifts','overview','intelligence','operations','growth','leads','calendar','classes','students','courses','tasks','fleet','finance','funding','partners','mous','tpr','compliance','audit'],
 'Enrollment specialist':['student-portal-preview','safety','sponsorships','event-intake','employment-offers','overview','intelligence','operations','growth','leads','calendar','classes','students','courses','tasks','finance','funding','partners','mous','tpr','compliance','audit'],
 'Admin assistant':['student-portal-preview','safety','event-intake','overview','intelligence','operations','growth','leads','calendar','classes','students','courses','tasks','finance','funding','partners','mous','tpr','compliance','audit'],
 'Front desk':['student-portal-preview','safety','event-intake','overview','intelligence','leads','calendar','classes','students','tasks'],
 'Instructor':['student-portal-preview','closeout','lesson-checkoffs','safety','dispatch','overview','intelligence','operations','students','courses','classes','tasks']
};
export function moduleAllowed(role:string,module:string){return role==='Owner'||!!roleModules[role]?.includes(module);}
export function trainingWriter(role:string){return ['Owner','Regional admin','Campus manager','Instructor'].includes(role);}
export function startModule(role:string){return role==='Instructor'?'courses':role==='Enrollment specialist'?'leads':role==='Front desk'?'calendar':'overview';}

// Bulk export remains a management capability; individual training reports have separate, scoped workflows.
export function bulkExportAllowed(role:string){return role==='Owner'||role==='Regional admin'||role==='Campus manager';}
