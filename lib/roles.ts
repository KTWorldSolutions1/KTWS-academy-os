export const roleModules:Record<string,string[]>={
 'Campus manager':['overview','operations','growth','leads','calendar','classes','students','courses','tasks','fleet','finance','funding','partners','mous','tpr','compliance','audit'],
 'Enrollment specialist':['overview','operations','growth','leads','calendar','classes','students','courses','tasks','finance','funding','partners','mous','tpr','compliance','audit'],
 'Admin assistant':['overview','operations','growth','leads','calendar','classes','students','courses','tasks','finance','funding','partners','mous','tpr','compliance','audit'],
 'Front desk':['overview','leads','calendar','classes','students','tasks'],
 'Instructor':['overview','operations','students','courses','classes','tasks']
};
export function moduleAllowed(role:string,module:string){return role==='Owner'||!!roleModules[role]?.includes(module);}
export function trainingWriter(role:string){return ['Owner','Campus manager','Instructor'].includes(role);}
export function startModule(role:string){return role==='Instructor'?'courses':role==='Enrollment specialist'?'leads':role==='Front desk'?'calendar':'overview';}
