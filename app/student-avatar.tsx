'use client';
import {useEffect,useState} from 'react';
import {UserRound} from 'lucide-react';
/** Uses the same verified encrypted Student profile photo attached to the school ID.
 * No raw image URLs, file keys, or personal images are published in HTML or local storage.
 */
export default function StudentAvatar({studentId,name,className}:{studentId:string;name:string;className?:string}){
 const [src,setSrc]=useState('');
 useEffect(()=>{
  let alive=true,url='';
  setSrc('');
  if(!studentId)return;
  fetch('/api/student/photo?studentId='+encodeURIComponent(studentId),{cache:'no-store',credentials:'same-origin'})
   .then(res=>{if(!res.ok)throw Error('No approved portrait');return res.blob();})
   .then(blob=>{if(!blob.type.startsWith('image/'))return;url=URL.createObjectURL(blob);if(alive)setSrc(url);else URL.revokeObjectURL(url);})
   .catch(()=>{});
  return()=>{alive=false;if(url)URL.revokeObjectURL(url);};
 },[studentId]);
 return src?<img className={className} src={src} alt={name+' verified student ID portrait'} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}}/>:<UserRound aria-label={name+' profile'} size={26}/>;
}
