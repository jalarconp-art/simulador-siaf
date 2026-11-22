import { describe, expect, it } from 'vitest';
import { CASOS, CTX_ORDER } from '@shared/casos';
import { construirSolucion, ejecutoraVacia } from '@shared/domain/fabrica';
import { asientosDe, controlesDe, cuadra, mapearFases, verificar } from '@shared/domain/contabilidad';
import { siguienteTrasVerificacion, transicionValida } from '@shared/domain/estados';
import { caSaldo, certSaldo, expSaldos, pimRows } from '@shared/domain/saldos';
import { validarDocumento, validarJustificacion, ErrorNegocio } from '@shared/domain/reglas';
import { clasNom, mapTot } from '@shared/util';

describe('Solución de los casos prácticos', () => {
  for (const id of CTX_ORDER) {
    const ej = construirSolucion(id);
    for (const sc of CASOS[id].subcasos) {
      it(`${id}/${sc.id}: la solución verifica al 100 %`, () => {
        const v = verificar(ej, sc).flatMap(x => x.checks);
        expect(v.filter(c => !c.ok)).toEqual([]);
      });
      it(`${id}/${sc.id}: todos los asientos cuadran (partida doble)`, () => {
        mapearFases(ej, sc).forEach(f => { const a = asientosDe(f); if (a.lines.length) expect(cuadra(a.lines)).toBe(true); });
      });
      it(`${id}/${sc.id}: los controles del ciclo están OK`, () => {
        controlesDe(sc, mapearFases(ej, sc)).forEach(c => expect(c[3]).toBe('OK'));
      });
    }
  }
});

describe('Saldos', () => {
  it('CP1: el certificado queda totalmente comprometido y el CA conserva S/ 6,828,928.93', () => {
    const ej = construirSolucion('cp1');
    const cert = ej.certs[0]; const ca = ej.cas[0];
    expect(mapTot(certSaldo(ej, cert))).toBe(0);
    expect(mapTot(caSaldo(ej, ca))).toBeCloseTo(6828928.93, 2);
  });
  it('CP3: tras la rendición y la T-6 no queda saldo por rendir', () => {
    const ej = construirSolucion('cp3');
    expect(mapTot(expSaldos(ej.exps[0]).porRendir)).toBe(0);
  });
  it('El PIM disminuye con lo certificado', () => {
    const ej = construirSolucion('cp3');
    const f = pimRows(ej, '07').find(p => p.clas === '2.3.2.1.2.2')!;
    expect(f.saldo).toBe(18000 - 960);
  });
});

describe('Máquina de estados', () => {
  it('certificación pasa a la OPP; compromiso anual a firma; compromiso mensual se aprueba', () => {
    expect(siguienteTrasVerificacion({ k: 'cs', x: 'cp1', id: '', s: 1 }, { estado: 'EN VERIFICACION', tipo: 'INICIAL' })).toBe('ENVIADO A OPP');
    expect(siguienteTrasVerificacion({ k: 'ca', x: 'cp1', id: '' }, { estado: 'EN VERIFICACION' })).toBe('PENDIENTE DE FIRMA');
    expect(siguienteTrasVerificacion({ k: 'es', x: 'cp1', id: '', s: 1 }, { estado: 'EN VERIFICACION', fase: 'C' })).toBe('APROBADO');
    expect(siguienteTrasVerificacion({ k: 'es', x: 'cp1', id: '', s: 1 }, { estado: 'EN VERIFICACION', fase: 'D' })).toBe('PENDIENTE DE FIRMA');
  });
  it('no permite saltos inválidos', () => {
    expect(transicionValida('REGISTRADO', 'APROBADO')).toBe(false);
    expect(transicionValida('APROBADO', 'REGISTRADO')).toBe(false);
    expect(transicionValida('PENDIENTE DE FIRMA', 'APROBADO')).toBe(true);
  });
});

describe('Reglas de validación', () => {
  it('justificación con caracteres no permitidos', () => {
    expect(() => validarJustificacion('TEXTO «CON» COMILLAS ?')).toThrow(ErrorNegocio);
    expect(() => validarJustificacion('COMISION DE SERVICIOS A LIMA, R.A. Nº 152-2026-OGA')).not.toThrow();
  });
  it('factura: serie de 4 y número de 8 dígitos', () => {
    expect(validarDocumento({ cod: '001', serie: '0001', num: '1050', fecha: '05/10/2022' }).num).toBe('00001050');
    expect(() => validarDocumento({ cod: '001', serie: '01', num: '1050', fecha: '05/10/2022' })).toThrow();
    expect(() => validarDocumento({ cod: '001', serie: '0001', num: '1050', fecha: '31/02/2022' })).toThrow();
  });
  it('clasificador 2026 disponible', () => {
    expect(clasNom('2.3.2.1.2.2')).toContain('VIATICOS');
    expect(clasNom('1.1.2.1.1.1')).toBe('PREDIAL');
  });
  it('ejecutora vacía no tiene registros', () => {
    const e = ejecutoraVacia('cp2a'); expect(e.certs.length + e.cas.length + e.exps.length).toBe(0);
  });
});
