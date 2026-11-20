export type Estado='programada'|'dictada'|'cancelada';
export interface Clase{id:string;alumno:string;materia:string;fecha:string;horas:number;estado:Estado;tarifaHora:number;wa?:string;gcalId?:string}
export interface Pago{id:string;fecha:string;monto:number;nota:string}
export const TARIFA=16500;
export function cuenta(cl:Clase[],pg:Pago[],tarifa=TARIFA){
 const devengado=cl.filter(c=>c.estado==='dictada').reduce((s,c)=>s+c.horas*c.tarifaHora,0);
 const cobrado=pg.reduce((s,p)=>s+p.monto,0);const balance=cobrado-devengado;
 return{devengado,cobrado,balance,horasPorCubrir:balance>0?balance/tarifa:0};
}
export interface Materia{id:string;nombre:string;color:string;tarifa:number}
export interface Estudiante{id:string;nombre:string;tipo:'individual'|'grupo';materias:string[];wa:string}
export const waUrl=(w:string)=>/^https?:/.test(w)?w:`https://wa.me/${w.replace(/\D/g,'')}`;
