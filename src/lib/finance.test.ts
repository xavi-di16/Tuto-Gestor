import {test,expect} from 'vitest';import {cuenta,waUrl} from './finance';
test('adelanto',()=>{const r=cuenta([{id:'1',alumno:'a',materia:'m',fecha:'',horas:2,estado:'dictada',tarifaHora:16500}],[{id:'p',fecha:'',monto:100000,nota:''}]);
expect(r.balance).toBe(67000);expect(r.horasPorCubrir).toBeCloseTo(4.06,1);});
test('waUrl',()=>{expect(waUrl('+54 9 351 000')).toBe('https://wa.me/549351000');expect(waUrl('https://chat.whatsapp.com/x')).toBe('https://chat.whatsapp.com/x')});
