/** Explicit match against school-verified driver identity before transmitting
 * regulated training records. Never log returned personally identifying values.
 */
export function tprIdentityIssues(student:{
 name?:string;clpState?:string;licenseState?:string;program?:string;
},form:{firstName?:string;lastName?:string;state?:string;classCode?:string}){
 const errors:string[]=[];
 const normalize=(v:unknown)=>String(v||'').trim().toLowerCase();
 const tokens=normalize(student.name).match(/[a-z]+/g)||[];
 if(!tokens.includes(normalize(form.firstName))||!tokens.includes(normalize(form.lastName)))
  errors.push('Driver first/last names must match verified student identity');
 const state=normalize(student.clpState||student.licenseState).toUpperCase().replace(/^US-/,'');
 if(state&&normalize(form.state).toUpperCase().replace(/^US-/,'')!==state)
  errors.push('Issuing state differs from the verified school record');
 const program=normalize(student.program);
 if((program.includes('class a')&&form.classCode!=='A')||(program.includes('class b')&&form.classCode!=='B'))
  errors.push('Training class does not match the enrolled program');
 return errors;
}
