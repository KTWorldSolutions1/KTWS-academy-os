'use client';
import {useState} from 'react';
import {LockKeyhole,ShieldCheck} from 'lucide-react';
export default function ChangePassword({email}:{email:string}){
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[complete,setComplete]=useState(false),[error,setError]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();setError('');
  if(next!==confirm){setError('Your new passwords must match.');return;}
  if(next.length<14||next.length>256){setError('Use a new password between 14 and 256 characters.');return;}
  setBusy(true);
  try{
   const resp=await fetch('/api/account/password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({currentPassword:current,newPassword:next})});
   const data:any=await resp.json();if(!resp.ok)throw Error(data.error||'Unable to update your password.');
   setCurrent('');setNext('');setConfirm('');setComplete(true);
  }catch(e:any){setError(e.message||'Unable to update your password.');}
  finally{setBusy(false);}
 }
 return <main className="loginpage"><section className="panel account-security"><div className="brand"><span className="brandmark">LS</span><div>LONE STAR<span>ACCOUNT SECURITY</span></div></div><div className="account-security-icon">{complete?<ShieldCheck size={27}/>:<LockKeyhole size={27}/>}</div><h1>{complete?'Password updated':'Change your password'}</h1><p className="muted">{email}</p>{complete?<><p className="notice" role="status">Your password is updated. You have been signed out of all devices and will need to sign in with the new password.</p><button className="primary" onClick={()=>location.assign('/login')}>Sign in again</button></>:<><p className="muted">Use your current password to set a new one. This does not require contacting an administrator when you can already sign in.</p><form onSubmit={submit}><label>Current password<input value={current} onChange={e=>setCurrent(e.target.value)} type="password" autoComplete="current-password" required maxLength={256}/></label><label>New password<input value={next} onChange={e=>setNext(e.target.value)} type="password" autoComplete="new-password" minLength={14} maxLength={256} required/></label><label>Confirm new password<input value={confirm} onChange={e=>setConfirm(e.target.value)} type="password" autoComplete="new-password" minLength={14} maxLength={256} required/></label>{error&&<p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy} type="submit">{busy?'Updating…':'Update password'}</button></form><p className="footnote">Passwords must contain at least 14 characters. Changing your password signs you out everywhere, including your iPhone and Dell work computer. If you cannot remember your current password, ask your school administrator for an approved one-use reset link.</p></>}<button className="account-security-back" onClick={()=>{location.assign(complete?'/login':'/');}}>{complete?'Back to sign in':'Return to school'}</button></section></main>;
}
