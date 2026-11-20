import {useState,useEffect,ReactNode} from 'react';
import {addDays,startOfWeek,endOfWeek,isWithinInterval,addMonths,eachDayOfInterval,endOfMonth,startOfMonth,isSameDay,format,parseISO,setHours,setMinutes} from 'date-fns';
import {es as esLoc} from 'date-fns/locale';
import {Moon,Sun,Palette,Users,CalendarRange,LayoutDashboard,CalendarDays,Wallet,Clock,MessageCircle,Trash2,Pencil,Plus,Copy} from 'lucide-react';
import {useAuth,useData,login,logout,enabled} from './lib/firebase';
import {getToken,syncClase,removeClase} from './lib/calendar';
import {Materia,Estudiante,waUrl,Clase,Pago,Estado,TARIFA,cuenta} from './lib/finance';

const ars=(n:number)=>n.toLocaleString('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0});
const newId=()=>Math.random().toString(36).slice(2,9);
const at=(d:number,h:number)=>setMinutes(setHours(addDays(new Date(),d),h),0).toISOString();
const seedC:Clase[]=[
 {id:'1',alumno:'Camila',materia:'SMM & Marketing',fecha:at(-2,10),horas:2,estado:'dictada',tarifaHora:TARIFA,wa:'5493510000001'},
 {id:'2',alumno:'Grupo WhatsApp #3',materia:'SMM & Marketing',fecha:at(-1,16),horas:2,estado:'dictada',tarifaHora:TARIFA,wa:'5493510000003'},
 {id:'3',alumno:'Tomás',materia:'Matemática',fecha:at(1,15),horas:1.5,estado:'programada',tarifaHora:TARIFA,wa:'5493510000002'},
 {id:'4',alumno:'Grupo WhatsApp #3',materia:'SMM & Marketing',fecha:at(2,18),horas:2,estado:'programada',tarifaHora:TARIFA,wa:'5493510000003'}];
const seedP:Pago[]=[{id:'p1',fecha:at(-3,12),monto:100000,nota:'Adelanto de Lucas (viernes)'}];
const seedD=['Lunes 14:00–18:00','Miércoles 16:00–20:00','Sábado 09:00–13:00'];
const seedM:Materia[]=[{id:'m1',nombre:'SMM & Marketing',color:'#3b82f6',tarifa:TARIFA},{id:'m2',nombre:'Matemática',color:'#10b981',tarifa:TARIFA}];
const seedE:Estudiante[]=[{id:'e1',nombre:'Camila',tipo:'individual',materias:['m1'],wa:'5493510000001'},{id:'e2',nombre:'Tomás',tipo:'individual',materias:['m2'],wa:'5493510000002'},{id:'e3',nombre:'Grupo WhatsApp #3',tipo:'grupo',materias:['m1'],wa:'5493510000003'}];
type Tab='dash'|'clases'|'cal'|'mat'|'est'|'pagos'|'disp';

function Modal({t,onClose,children}:{t:string;onClose:()=>void;children:ReactNode}){
 return <div className="fixed inset-0 bg-slate-900/40 grid place-items-center p-4 z-50" onClick={onClose}>
  <div className="card w-full max-w-md space-y-3" onClick={e=>e.stopPropagation()}><h3 className="font-bold text-lg">{t}</h3>{children}</div></div>;
}
function Main({uid}:{uid:string|null}){
 const demo=!enabled;
 const [tab,setTab]=useState<Tab>('dash');
 const [cl,setCl]=useData<Clase>('clases',seedC,uid);
 const [pg,setPg]=useData<Pago>('pagos',seedP,uid);
 const [dp,setDp]=useData<string>('disp',seedD,uid);
 const [ms,setMs]=useData<Materia>('materias',seedM,uid);
 const [es,setEs]=useData<Estudiante>('estudiantes',seedE,uid);
 const col=(n:string)=>ms.find(m=>m.nombre===n)?.color||'#3b82f6';
 const [mc,setMc]=useState<Clase|null>(null);
 const [mp,setMp]=useState<Pago|null>(null);
 const [dark,setDark]=useState(()=>localStorage.getItem('g_dark')==='1');
 useEffect(()=>{document.documentElement.classList.toggle('dark',dark);localStorage.setItem('g_dark',dark?'1':'0')},[dark]);
 const [cal,setCal]=useState(!!getToken());
 const [calErr,setCalErr]=useState('');
 const c=cuenta(cl,pg);
 const now=new Date(),wk={start:startOfWeek(now,{weekStartsOn:1}),end:endOfWeek(now,{weekStartsOn:1})};
 const sem=cl.filter(x=>x.estado!=='cancelada'&&isWithinInterval(parseISO(x.fecha),wk));
 const hDic=sem.filter(x=>x.estado==='dictada').reduce((s,x)=>s+x.horas,0),hTot=sem.reduce((s,x)=>s+x.horas,0);
 const prox=cl.filter(x=>x.estado==='programada').sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,3);
 const dias=['L','M','X','J','V','S','D'].map((d,i)=>({d,h:cl.filter(x=>x.estado==='dictada'&&(parseISO(x.fecha).getDay()+6)%7===i).reduce((s,x)=>s+x.horas,0)}));
 const max=Math.max(2,...dias.map(x=>x.h));
 const sync=async(x:Clase):Promise<Clase>=>{
  if(demo||!getToken())return x;
  try{const id=await syncClase(x);const {gcalId:_g,...rest}=x;setCalErr('');return id?{...rest,gcalId:id}:rest}
  catch(er){if((er as Error).message==='sin-token')setCal(false);else setCalErr((er as Error).message);return x}
 };
 const setEstado=async(id:string,e:Estado)=>{const x=cl.find(y=>y.id===id);if(!x)return;const y=await sync({...x,estado:e});setCl(cl.map(z=>z.id===id?y:z))};
 const delClase=async(x:Clase)=>{if(!demo&&getToken())try{await removeClase(x)}catch{}setCl(cl.filter(y=>y.id!==x.id))};
 const saveC=async(x:Clase)=>{setMc(null);const y=await sync(x);setCl(cl.some(z=>z.id===y.id)?cl.map(z=>z.id===y.id?y:z):[...cl,y])};
 const saveP=(x:Pago)=>{setPg(pg.some(y=>y.id===x.id)?pg.map(y=>y.id===x.id?x:y):[...pg,x]);setMp(null)};
 const wa=(x:Clase)=>x.wa&&window.open(waUrl(x.wa),'_blank');
 const nuevoPago=()=>setMp({id:newId(),fecha:format(now,'yyyy-MM-dd'),monto:0,nota:''});
 const nuevaEn=(d:Date)=>setMc({id:newId(),alumno:'',materia:'',fecha:setMinutes(setHours(d,15),0).toISOString(),horas:2,estado:'programada',tarifaHora:TARIFA});
 const nuevaClase=()=>setMc({id:newId(),alumno:'',materia:'',fecha:at(1,15),horas:2,estado:'programada',tarifaHora:TARIFA});
 const nav:[Tab,string,typeof Wallet][]=[['dash','Dashboard',LayoutDashboard],['clases','Clases',CalendarDays],['cal','Calendario',CalendarRange],['mat','Materias',Palette],['est','Estudiantes',Users],['pagos','Cuenta con Lucas',Wallet],['disp','Disponibilidad',Clock]];
 const Estados=({x}:{x:Clase})=><div className="flex gap-1">{(['programada','dictada','cancelada'] as Estado[]).map(e=>
  <button key={e} onClick={()=>setEstado(x.id,e)} className={`rounded-full px-3 py-1 text-xs font-semibold ${x.estado===e?(e==='dictada'?'bg-emerald-500 text-white':e==='cancelada'?'bg-slate-400 text-white':'bg-blue-500 text-white'):'bg-slate-100'}`}>{e}</button>)}</div>;
 const Fin=()=><div className="card"><h2 className="font-bold">Gestión Financiera · Lucas & Academia</h2>
  <p className={`text-3xl font-extrabold mt-2 ${c.balance>=0?'text-emerald-600':'text-slate-900'}`}>{ars(Math.abs(c.balance))}</p>
  <p className="text-sm text-slate-600">{c.balance>=0?`Saldo a favor de Lucas (adelanto): faltan dictar ${c.horasPorCubrir.toFixed(1)} hs para cubrirlo`:'Saldo a favor de Gali: Lucas le debe este monto'}</p>
  <p className="text-xs text-slate-500 mt-1">Devengado {ars(c.devengado)} · Cobrado {ars(c.cobrado)}</p>
  <div className="flex gap-2 mt-3 flex-wrap"><button className="btn" onClick={nuevoPago}>Registrar pago de Lucas</button><button className="btn2" onClick={()=>setMp({id:newId(),fecha:format(now,'yyyy-MM-dd'),monto:0,nota:'Ajuste de balance'})}>Ajustar balance</button></div></div>;
 return <div className="min-h-screen md:flex">
  <aside className="hidden md:flex flex-col w-60 p-4 gap-1 bg-white m-3 rounded-3xl">
   <div className="font-extrabold text-xl px-3 py-2">GaliApp<div className="text-xs font-normal text-slate-500">Gali & Academia</div></div>
   {nav.map(([k,l,I])=><button key={k} onClick={()=>setTab(k)} className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium ${tab===k?'bg-blue-500 text-white':'hover:bg-slate-100'}`}><I size={18}/>{l}</button>)}</aside>
  <main className="flex-1 p-4 pb-24 space-y-4 max-w-5xl">
   <div className="flex gap-2 items-center"><button className="btn2 !py-1 text-xs flex gap-1 items-center" onClick={()=>setDark(!dark)} aria-label="Cambiar tema">{dark?<Sun size={14}/>:<Moon size={14}/>}{dark?'Modo claro':'Modo oscuro'}</button>{!demo&&<button className="btn2 !py-1 text-xs" onClick={logout}>Cerrar sesión</button>}{!demo&&!cal&&<button className="btn !py-1 text-xs" onClick={()=>login().then(()=>setCal(true)).catch(()=>setCalErr('No se pudo conectar Google Calendar'))}>Conectar Google Calendar</button>}{!demo&&cal&&<span className="text-xs text-emerald-600 font-semibold">Calendar conectado</span>}</div>
   {calErr&&<p className="text-xs text-red-500">{calErr}</p>}
   {demo&&<div className="rounded-full bg-amber-100 text-amber-800 text-xs px-4 py-1 w-fit">Modo Demo · Configurá Firebase en .env.local</div>}
   {tab==='dash'&&<><h1 className="text-3xl font-extrabold">Hola de nuevo, Gali</h1>
    <div className="grid md:grid-cols-3 gap-4">
     <div className="card !bg-blue-500 text-white"><p className="text-sm">Semana actual</p><p className="text-4xl font-extrabold">{hDic} / {hTot} hs</p>
      <div className="h-2 rounded-full bg-white/30 mt-3"><div className="h-2 rounded-full bg-white" style={{width:`${hTot?hDic/hTot*100:0}%`}}/></div></div>
     <div className="md:col-span-2"><Fin/></div></div>
    <div className="grid md:grid-cols-2 gap-4">
     <div className="card space-y-3"><h2 className="font-bold">Próximas clases</h2>
      {prox.length===0&&<p className="text-sm text-slate-500">No hay clases programadas. Agendá una en Clases.</p>}
      {prox.map(x=><div key={x.id} className="rounded-2xl bg-slate-50 p-3 space-y-2"><p className="font-semibold">{x.alumno} · {x.materia}</p>
       <p className="text-sm text-slate-600">{format(parseISO(x.fecha),"EEEE d 'a las' HH:mm",{locale:esLoc})} · {x.horas} hs</p>
       <div className="flex gap-2 flex-wrap items-center"><Estados x={x}/>{x.wa&&<button className="btn !py-1 flex gap-1 items-center" onClick={()=>wa(x)}><MessageCircle size={14}/>Abrir WhatsApp del Grupo</button>}</div></div>)}</div>
     <div className="card"><h2 className="font-bold mb-3">Horas dictadas por día</h2>
      <div className="flex items-end gap-3 h-40">{dias.map(x=><div key={x.d} className="flex-1 flex flex-col items-center justify-end h-full"><div className="w-full rounded-full bg-blue-500" style={{height:`${x.h/max*100}%`,minHeight:6}}/><span className="text-xs mt-1">{x.d}</span></div>)}</div></div></div>
    <div className="grid md:grid-cols-2 gap-4"><div className="card"><h2 className="font-bold mb-2">Horarios disponibles</h2>{dp.map(d=><p key={d} className="text-sm">{d}</p>)}</div><Mini cl={cl}/></div></>}
   {tab==='clases'&&<><div className="flex justify-between items-center"><h1 className="text-2xl font-extrabold">Clases</h1><button className="btn flex gap-1 items-center" onClick={nuevaClase}><Plus size={16}/>Nueva clase</button></div>
    {[...cl].sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(x=><div key={x.id} className="card flex flex-wrap items-center gap-3 justify-between">
     <div><p className="font-semibold">{x.alumno} · {x.materia}</p><p className="text-sm text-slate-500">{format(parseISO(x.fecha),"d MMM HH:mm",{locale:esLoc})} · {x.horas} hs · {ars(x.horas*x.tarifaHora)}</p></div>
     <Estados x={x}/><div className="flex gap-2"><button aria-label="Editar" onClick={()=>setMc(x)}><Pencil size={16}/></button><button aria-label="Eliminar" onClick={()=>delClase(x)}><Trash2 size={16}/></button></div></div>)}</>}
   {tab==='pagos'&&<><Fin/><div className="flex justify-between items-center"><h2 className="font-bold">Pagos y adelantos</h2></div>
    {[...pg].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(p=><div key={p.id} className="card flex justify-between items-center"><div><p className="font-semibold">{ars(p.monto)}</p><p className="text-sm text-slate-500">{p.fecha.slice(0,10)} · {p.nota}</p></div>
     <div className="flex gap-2"><button aria-label="Editar" onClick={()=>setMp(p)}><Pencil size={16}/></button><button aria-label="Eliminar" onClick={()=>setPg(pg.filter(y=>y.id!==p.id))}><Trash2 size={16}/></button></div></div>)}</>}
   {tab==='cal'&&<Cal cl={cl} col={col} onEdit={setMc} onNew={nuevaEn}/>}
   {tab==='mat'&&<Materias ms={ms} setMs={setMs}/>}
   {tab==='est'&&<Estudiantes es={es} setEs={setEs} ms={ms}/>}
   {tab==='disp'&&<Disp dp={dp} setDp={setDp}/>}
  </main>
  <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white rounded-t-3xl flex justify-around p-2 shadow-lg">{nav.map(([k,l,I])=><button key={k} onClick={()=>setTab(k)} aria-label={l} className={`p-3 rounded-2xl ${tab===k?'bg-blue-500 text-white':''}`}><I size={20}/></button>)}</nav>
  {mc&&<Modal t="Clase" onClose={()=>setMc(null)}><label className="block text-sm">Elegir de tu lista<select className="inp mt-1" value="" onChange={e=>{const st=es.find(z=>z.id===e.target.value);if(!st)return;const mt=ms.find(m=>st.materias.includes(m.id));setMc({...mc,alumno:st.nombre,wa:st.wa,materia:mt?mt.nombre:mc.materia,tarifaHora:mt&&mc.estado!=='dictada'?mt.tarifa:mc.tarifaHora})}}><option value="">Estudiantes y grupos…</option>{es.map(z=><option key={z.id} value={z.id}>{z.nombre}</option>)}</select></label><F l="Estudiante / grupo" v={mc.alumno} s={v=>setMc({...mc,alumno:v})}/><F l="Materia" v={mc.materia} s={v=>setMc({...mc,materia:v})}/>
   <F l="Fecha y hora" t="datetime-local" v={format(parseISO(mc.fecha),"yyyy-MM-dd'T'HH:mm")} s={v=>v&&setMc({...mc,fecha:new Date(v).toISOString()})}/>
   <F l="Horas (ej. 1.5)" t="number" v={String(mc.horas)} s={v=>setMc({...mc,horas:parseFloat(v)||0})}/><F l="Teléfono WhatsApp (con código país)" v={mc.wa||''} s={v=>setMc({...mc,wa:v.trim()})}/>
   <label className="block text-sm">Estado<select className="inp mt-1" value={mc.estado} onChange={e=>setMc({...mc,estado:e.target.value as Estado})}><option value="programada">Programada</option><option value="dictada">Dictada</option><option value="cancelada">Cancelada</option></select></label><button className="btn w-full" onClick={()=>mc.alumno&&mc.horas>0&&saveC(mc)}>Guardar clase</button></Modal>}
  {mp&&<Modal t="Pago de Lucas" onClose={()=>setMp(null)}><F l="Fecha" t="date" v={mp.fecha.slice(0,10)} s={v=>setMp({...mp,fecha:v})}/><F l="Monto (ARS, negativo para ajustar)" t="number" v={String(mp.monto)} s={v=>setMp({...mp,monto:parseFloat(v)||0})}/><F l="Nota" v={mp.nota} s={v=>setMp({...mp,nota:v})}/>
   <button className="btn w-full" onClick={()=>mp.monto!==0&&saveP(mp)}>Guardar pago</button></Modal>}
 </div>;
}
function F({l,v,s,t='text'}:{l:string;v:string;s:(v:string)=>void;t?:string}){return <label className="block text-sm">{l}<input className="inp mt-1" type={t} value={v} onChange={e=>s(e.target.value)}/></label>}
function Disp({dp,setDp}:{dp:string[];setDp:(v:string[])=>void}){
 const [n,setN]=useState('');const [ok,setOk]=useState(false);
 return <><h1 className="text-2xl font-extrabold">Disponibilidad</h1><div className="card space-y-2">
  {dp.map((d,i)=><div key={i} className="flex justify-between text-sm"><span>{d}</span><button aria-label="Quitar" onClick={()=>setDp(dp.filter((_,j)=>j!==i))}><Trash2 size={16}/></button></div>)}
  <div className="flex gap-2"><input className="inp" placeholder="Ej. Viernes 10:00–12:00" value={n} onChange={e=>setN(e.target.value)}/><button className="btn" onClick={()=>{if(n.trim()){setDp([...dp,n.trim()]);setN('')}}}>Agregar</button></div>
  <button className="btn2 flex gap-1 items-center" onClick={()=>{navigator.clipboard.writeText('Mis horarios libres:\n'+dp.map(d=>'• '+d).join('\n'));setOk(true)}}><Copy size={14}/>{ok?'Copiado':'Copiar resumen para Lucas'}</button></div></>;
}

export default function App(){
 const {user,ready}=useAuth();
 if(!ready)return <div className="min-h-screen grid place-items-center text-slate-500">Cargando…</div>;
 if(enabled&&!user)return <div className="min-h-screen grid place-items-center p-4"><div className="card text-center space-y-4 max-w-sm"><h1 className="text-3xl font-extrabold">GaliApp</h1><p className="text-sm text-slate-600">Ingresá con tu cuenta de Google para ver tus clases y tu cuenta con Lucas.</p><button className="btn w-full" onClick={()=>login().catch(()=>alert('No se pudo iniciar sesión. Revisá que Google esté habilitado en Firebase Authentication.'))}>Ingresar con Google</button></div></div>;
 return <Main uid={user?user.uid:null}/>;
}

function Materias({ms,setMs}:{ms:Materia[];setMs:(v:Materia[])=>void}){
 const [m,setM]=useState<Materia|null>(null);
 const save=()=>{if(!m||!m.nombre.trim())return;setMs(ms.some(x=>x.id===m.id)?ms.map(x=>x.id===m.id?m:x):[...ms,m]);setM(null)};
 return <><div className="flex justify-between items-center"><h1 className="text-2xl font-extrabold">Materias</h1><button className="btn flex gap-1 items-center" onClick={()=>setM({id:newId(),nombre:'',color:'#3b82f6',tarifa:TARIFA})}><Plus size={16}/>Nueva materia</button></div>
 {ms.length===0&&<p className="text-sm text-slate-500">Todavía no cargaste materias. Tocá Nueva materia para agregar la primera.</p>}
 {ms.map(x=><div key={x.id} className="card flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="w-4 h-4 rounded-full" style={{background:x.color}}/><div><p className="font-semibold">{x.nombre}</p><p className="text-sm text-slate-500">{ars(x.tarifa)} por hora</p></div></div>
  <div className="flex gap-2"><button aria-label="Editar" onClick={()=>setM(x)}><Pencil size={16}/></button><button aria-label="Eliminar" onClick={()=>setMs(ms.filter(y=>y.id!==x.id))}><Trash2 size={16}/></button></div></div>)}
 {m&&<Modal t="Materia" onClose={()=>setM(null)}><F l="Nombre" v={m.nombre} s={v=>setM({...m,nombre:v})}/><F l="Tarifa base por hora (ARS)" t="number" v={String(m.tarifa)} s={v=>setM({...m,tarifa:parseFloat(v)||0})}/>
  <label className="block text-sm">Color<input className="mt-1 block h-10 w-full rounded-2xl" type="color" value={m.color} onChange={e=>setM({...m,color:e.target.value})}/></label><button className="btn w-full" onClick={save}>Guardar materia</button></Modal>}</>;
}
function Estudiantes({es,setEs,ms}:{es:Estudiante[];setEs:(v:Estudiante[])=>void;ms:Materia[]}){
 const [e,setE]=useState<Estudiante|null>(null);
 const save=()=>{if(!e||!e.nombre.trim())return;setEs(es.some(x=>x.id===e.id)?es.map(x=>x.id===e.id?e:x):[...es,e]);setE(null)};
 return <><div className="flex justify-between items-center"><h1 className="text-2xl font-extrabold">Estudiantes y grupos</h1><button className="btn flex gap-1 items-center" onClick={()=>setE({id:newId(),nombre:'',tipo:'individual',materias:[],wa:''})}><Plus size={16}/>Nuevo</button></div>
 {es.length===0&&<p className="text-sm text-slate-500">Todavía no cargaste estudiantes. Tocá Nuevo para agregar el primero.</p>}
 {es.map(x=><div key={x.id} className="card flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{x.nombre} <span className="text-xs text-slate-500">({x.tipo})</span></p><p className="text-sm text-slate-500">{x.materias.map(id=>ms.find(m=>m.id===id)?.nombre).filter(Boolean).join(', ')||'Sin materia'}</p></div>
  <div className="flex gap-2 items-center">{x.wa&&<button className="btn !py-1 flex gap-1 items-center" onClick={()=>window.open(waUrl(x.wa),'_blank')}><MessageCircle size={14}/>WhatsApp</button>}<button aria-label="Editar" onClick={()=>setE(x)}><Pencil size={16}/></button><button aria-label="Eliminar" onClick={()=>setEs(es.filter(y=>y.id!==x.id))}><Trash2 size={16}/></button></div></div>)}
 {e&&<Modal t="Estudiante o grupo" onClose={()=>setE(null)}><F l="Nombre" v={e.nombre} s={v=>setE({...e,nombre:v})}/>
  <label className="block text-sm">Tipo<select className="inp mt-1" value={e.tipo} onChange={ev=>setE({...e,tipo:ev.target.value as Estudiante['tipo']})}><option value="individual">Individual</option><option value="grupo">Grupo</option></select></label>
  <div className="space-y-1"><p className="text-sm">Materias</p>{ms.map(m=><label key={m.id} className="flex gap-2 text-sm"><input type="checkbox" checked={e.materias.includes(m.id)} onChange={()=>setE({...e,materias:e.materias.includes(m.id)?e.materias.filter(i=>i!==m.id):[...e.materias,m.id]})}/>{m.nombre}</label>)}</div>
  <F l="Teléfono o link del grupo de WhatsApp" v={e.wa} s={v=>setE({...e,wa:v.trim()})}/><button className="btn w-full" onClick={save}>Guardar</button></Modal>}</>;
}
function Cal({cl,col,onEdit,onNew}:{cl:Clase[];col:(n:string)=>string;onEdit:(c:Clase)=>void;onNew:(d:Date)=>void}){
 const [v,setV]=useState<'mes'|'semana'|'dia'>('mes');const [d,setD]=useState(new Date());
 const w={weekStartsOn:1 as const};
 const mv=(n:number)=>setD(v==='mes'?addMonths(d,n):addDays(d,v==='semana'?7*n:n));
 const days=v==='mes'?eachDayOfInterval({start:startOfWeek(startOfMonth(d),w),end:endOfWeek(endOfMonth(d),w)}):v==='semana'?eachDayOfInterval({start:startOfWeek(d,w),end:endOfWeek(d,w)}):[d];
 const of=(x:Date)=>cl.filter(c=>isSameDay(parseISO(c.fecha),x)).sort((a,b)=>a.fecha.localeCompare(b.fecha));
 const chip=(c:Clase,full:boolean)=><button key={c.id} onClick={e=>{e.stopPropagation();onEdit(c)}} style={{background:col(c.materia)}} className={`block w-full text-left text-white rounded-lg px-2 py-1 text-xs truncate ${c.estado==='cancelada'?'opacity-40 line-through':''}`}>{format(parseISO(c.fecha),'HH:mm')} {c.alumno}{full?` · ${c.horas} hs · ${c.estado}`:''}</button>;
 return <><h1 className="text-2xl font-extrabold">Calendario</h1>
 <div className="flex flex-wrap gap-2 items-center"><button className="btn2" onClick={()=>mv(-1)} aria-label="Anterior">‹</button><button className="btn2" onClick={()=>setD(new Date())}>Hoy</button><button className="btn2" onClick={()=>mv(1)} aria-label="Siguiente">›</button>
  <span className="font-semibold capitalize flex-1">{format(d,v==='dia'?"EEEE d 'de' MMMM":'MMMM yyyy',{locale:esLoc})}</span>
  {(['mes','semana','dia'] as const).map(k=><button key={k} onClick={()=>setV(k)} className={`rounded-full px-3 py-1 text-sm font-semibold ${v===k?'bg-blue-500 text-white':'bg-slate-100'}`}>{k}</button>)}</div>
 {v==='mes'&&<div className="grid grid-cols-7 gap-1 text-xs text-center text-slate-500">{['L','M','X','J','V','S','D'].map(x=><span key={x}>{x}</span>)}</div>}
 <div className={v==='mes'?'grid grid-cols-7 gap-1':`grid gap-3 ${v==='semana'?'md:grid-cols-4 lg:grid-cols-7':''}`}>
  {days.map(x=><div key={x.toISOString()} onClick={()=>{if(v==='mes'){setD(x);setV('dia')}}} className={`rounded-2xl p-2 space-y-1 ${v==='mes'?'min-h-20 cursor-pointer bg-white':'card'} ${isSameDay(x,new Date())?'ring-2 ring-blue-500':''} ${v==='mes'&&x.getMonth()!==d.getMonth()?'opacity-40':''}`}>
   <p className="text-xs font-semibold">{v==='mes'?format(x,'d'):format(x,"EEE d",{locale:esLoc})}</p>
   {of(x).map(c=>chip(c,v!=='mes'))}
   {v!=='mes'&&<button className="text-xs text-blue-500 font-semibold" onClick={()=>onNew(x)}>+ Agregar clase</button>}</div>)}</div></>;
}
function Mini({cl}:{cl:Clase[]}){
 const d=new Date();const days=eachDayOfInterval({start:startOfWeek(startOfMonth(d),{weekStartsOn:1}),end:endOfWeek(endOfMonth(d),{weekStartsOn:1})});
 return <div className="card"><h2 className="font-bold mb-2 capitalize">{format(d,'MMMM yyyy',{locale:esLoc})}</h2><div className="grid grid-cols-7 gap-1 text-center text-xs">
  {['L','M','X','J','V','S','D'].map(x=><span key={x} className="text-slate-500">{x}</span>)}
  {days.map(x=>{const has=cl.some(c=>c.estado!=='cancelada'&&isSameDay(parseISO(c.fecha),x));return <span key={x.toISOString()} className={`rounded-full py-1 ${isSameDay(x,d)?'bg-blue-500 text-white':x.getMonth()!==d.getMonth()?'opacity-30':has?'bg-blue-100 text-blue-700 font-bold':''}`}>{x.getDate()}</span>})}</div></div>;
}
