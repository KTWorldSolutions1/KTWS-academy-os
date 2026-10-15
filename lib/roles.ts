export const roleModules:Record<string,string[]>={
 'Campus manager':['lesson-checkoffs','safety','credentials','sponsorships','dispatch','event-intake','employment-offers','agency','shifts','overview','intelligence','operations','growth','leads','calendar','classes','students','courses','tasks','fleet','finance','funding','partners','mous','tpr','compliance','audit'],
 'Enrollment specialist':['safety','sponsorships','event-intake','employment-offers','overview','intelligence','operations','growth','leads','calendar','classes','students','courses','tasks','finance','funding','partners','mous','tpr','compliance','audit'],
 'Admin assistant':['safety','event-intake','overview','intelligence','operations','growth','leads','calendar','classes','students','courses','tasks','finance','funding','partners','mous','tpr','compliance','audit'],
 'Front desk':['safety','event-intake','overview','intelligence','leads','calendar','classes','students','tasks'],
 'Instructor':['lesson-checkoffs','safety','dispatch','overview','intelligence','operations','students','courses','classes','tasks']
};
export function moduleAllowed(role:string,module:string){return role==='Owner'||!!roleModules[role]?.includes(module);}
export function trainingWriter(role:string){return ['Owner','Campus manager','Instructor'].includes(role);}
export function startModule(role:string){return role==='Instructor'?'courses':role==='Enrollment specialist'?'leads':role==='Front desk'?'calendar':'overview';}

// Bulk export remains a management capability; individual training reports have separate, scoped workflows.
export function bulkExportAllowed(role:string){return role==='Owner'||role==='Campus manager';}
