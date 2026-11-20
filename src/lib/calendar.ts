import {waUrl,type Clase} from './finance';
const KEY='g_gcal_token';
export const getToken=()=>sessionStorage.getItem(KEY);
export const setToken=(t:string|null)=>{if(t)sessionStorage.setItem(KEY,t);else sessionStorage.removeItem(KEY)};
const base='https://www.googleapis.com/calendar/v3/calendars/primary/events';
const evento=(c:Clase)=>{const s=new Date(c.fecha),e=new Date(s.getTime()+c.horas*3600000);
 return{summary:`${c.alumno} · ${c.materia}`,description:`GaliApp · ${c.horas} hs`+(c.wa?`\nWhatsApp: ${waUrl(c.wa)}`:''),start:{dateTime:s.toISOString()},end:{dateTime:e.toISOString()}}};
async function call(method:string,url:string,b?:object):Promise<any>{
 const t=getToken();if(!t)throw new Error('sin-token');
 const r=await fetch(url,{method,headers:{Authorization:'Bearer '+t,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});
 if(r.status===401){setToken(null);throw new Error('sin-token')}
 if(r.status===404||r.status===410)return null;
 if(!r.ok)throw new Error(r.status===403?'Calendar 403: activá Google Calendar API en Google Cloud':'Calendar '+r.status);
 return r.status===204?{}:r.json();
}
export async function syncClase(c:Clase):Promise<string|undefined>{
 if(c.estado==='cancelada'){if(c.gcalId)await call('DELETE',`${base}/${c.gcalId}`);return undefined}
 if(c.gcalId){const r=await call('PATCH',`${base}/${c.gcalId}`,evento(c));if(r)return c.gcalId}
 const r=await call('POST',base,evento(c));return r.id as string;
}
export const removeClase=async(c:Clase)=>{if(c.gcalId)await call('DELETE',`${base}/${c.gcalId}`)};
