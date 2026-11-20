import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,User} from 'firebase/auth';
import {initializeFirestore,doc,onSnapshot,setDoc} from 'firebase/firestore';
import {useEffect,useState} from 'react';
import {setToken} from './calendar';
const e=import.meta.env;
export const enabled=!!(e.VITE_FIREBASE_API_KEY&&e.VITE_FIREBASE_PROJECT_ID);
const app=enabled?initializeApp({apiKey:e.VITE_FIREBASE_API_KEY,authDomain:e.VITE_FIREBASE_AUTH_DOMAIN,projectId:e.VITE_FIREBASE_PROJECT_ID,appId:e.VITE_FIREBASE_APP_ID}):null;
const auth=app?getAuth(app):null;
const db=app?initializeFirestore(app,{experimentalAutoDetectLongPolling:true}):null;
export const login=async()=>{
 const p=new GoogleAuthProvider();p.addScope('https://www.googleapis.com/auth/calendar.events');
 const r=await signInWithPopup(auth!,p);
 setToken(GoogleAuthProvider.credentialFromResult(r)?.accessToken??null);
};
export const logout=()=>{setToken(null);return signOut(auth!)};
export function useAuth(){
 const [u,setU]=useState<User|null>(null);const [ready,setReady]=useState(!enabled);
 useEffect(()=>auth?onAuthStateChanged(auth,x=>{setU(x);setReady(true)}):undefined,[]);
 return{user:u,ready};
}
export function useData<T>(k:string,seed:T[],uid:string|null):[T[],(v:T[])=>void]{
 const [v,setV]=useState<T[]>(()=>{if(uid)return[];try{const r=localStorage.getItem('g_'+k);return r?JSON.parse(r):seed}catch{return seed}});
 useEffect(()=>{if(!uid||!db)return;return onSnapshot(doc(db,'users',uid,'data',k),s=>setV(s.exists()?(s.data().items as T[]):[]),err=>console.error('Firestore:',err.message))},[uid,k]);
 const set=(n:T[])=>{
  const clean=JSON.parse(JSON.stringify(n)) as T[];setV(clean);
  if(uid&&db)setDoc(doc(db,'users',uid,'data',k),{items:clean}).catch(er=>alert('No se pudo guardar en Firestore: '+er.message));
  else localStorage.setItem('g_'+k,JSON.stringify(clean));
 };
 return[v,set];
}
