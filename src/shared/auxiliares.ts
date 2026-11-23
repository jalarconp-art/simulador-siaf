/* Opciones complementarias del menú «Registro» del Módulo de Ejecución (SIAF-WEB):
   definición declarativa de campos, validaciones y presentación. Las usan el servicio y la interfaz. */
import type { Opcion } from './types';
import { CAT } from './catalogo';

export interface CampoAux {
  k: string; t: string; tipo?: 'texto' | 'lista' | 'fecha' | 'monto' | 'area' | 'numero';
  opciones?: string[]; req?: boolean; c?: number; max?: number; patron?: [string, string]; def?: string;
}
export interface DefAux {
  k: string; menu: string; titulo: string; plural: string; buscar: string; opcion?: Opcion;
  /** «busqueda»: el panel izquierdo es un formulario de búsqueda, como en «Solicitud de Apertura de Cuenta Bancaria» */
  modo?: 'lista' | 'busqueda';
  campos: CampoAux[]; filtros?: string[]; lista: [string, string]; vacio: [string, string]; nota?: string;
}

const BANCOS = ['BANCO DE LA NACION', 'BANCO DE CREDITO DEL PERU', 'BBVA PERU', 'SCOTIABANK PERU', 'INTERBANK', 'BANCO INTERAMERICANO DE FINANZAS', 'CAJA MUNICIPAL AREQUIPA', 'CAJA MUNICIPAL CUSCO'];
const TIPDOC = ['01 - DNI', '04 - CARNE DE EXTRANJERIA', '06 - RUC', '07 - PASAPORTE'];
const RUBROS = CAT.rubros.map(r => r[0] + ' - ' + r[1]);
const DNI: [string, string] = ['^\\d{8}$|^\\d{11}$|^[A-Z0-9]{8,12}$', 'Número de documento inválido (DNI 8 dígitos, RUC 11).'];
const CCI: [string, string] = ['^\\d{20}$', 'El CCI tiene 20 dígitos.'];
const MOTIVO = 'Caracteres permitidos: letras, números, espacios y / . , ; : % $ º';

export const AUX: DefAux[] = [
  { k: 'modexp', menu: 'Modificación Expediente', titulo: 'Modificación de expediente', plural: 'modificaciones', buscar: 'Buscar número de modificación', opcion: 'mod',
    campos: [
      { k: 'expediente', t: 'Expediente', tipo: 'numero', req: true, c: 3 }, { k: 'secuencia', t: 'Secuencia', tipo: 'numero', req: true, c: 3, def: '1' },
      { k: 'dato', t: 'Dato a modificar', tipo: 'lista', req: true, c: 6, opciones: ['Fecha del documento', 'Número del documento', 'Serie del documento', 'Notas', 'Tipo de pago', 'Tipo de recurso', 'Modalidad de compra', 'Tipo de proceso de selección'] },
      { k: 'dice', t: 'Dice', req: true, c: 6 }, { k: 'debe', t: 'Debe decir', req: true, c: 6 },
      { k: 'justif', t: 'Justificación', tipo: 'area', req: true, c: 12 }],
    lista: ['dato', 'expediente'], vacio: ['Detalle de la modificación', 'Para poder visualizar el detalle, Usted debe seleccionar una modificación de la lista izquierda'],
    nota: 'Modifica datos de una secuencia del expediente (compromiso mensual, devengado o girado) sin alterar montos.' },
  { k: 'reasig', menu: 'Reasignacion', titulo: 'Reasignación', plural: 'reasignaciones', buscar: 'Buscar número de reasignación', opcion: 'cm',
    campos: [
      { k: 'expediente', t: 'Expediente', tipo: 'numero', req: true, c: 3 }, { k: 'secuencia', t: 'Secuencia', tipo: 'numero', req: true, c: 3, def: '1' }, { k: 'monto', t: 'Monto a reasignar S/', tipo: 'monto', req: true, c: 6 },
      { k: 'clasOrigen', t: 'Clasificador origen', req: true, c: 6, patron: ['^2(\\.\\d+){4,5}$', 'Clasificador de gasto inválido (ej. 2.3.2.7.11.99).'] }, { k: 'metaOrigen', t: 'Meta origen', req: true, c: 6, max: 4 },
      { k: 'clasDestino', t: 'Clasificador destino', req: true, c: 6, patron: ['^2(\\.\\d+){4,5}$', 'Clasificador de gasto inválido (ej. 2.3.2.7.11.99).'] }, { k: 'metaDestino', t: 'Meta destino', req: true, c: 6, max: 4 },
      { k: 'justif', t: 'Justificación', tipo: 'area', req: true, c: 12 }],
    lista: ['clasDestino', 'monto'], vacio: ['Detalle de la reasignación', 'Para poder visualizar el detalle, Usted debe seleccionar una reasignación de la lista izquierda'] },
  { k: 'apcta', menu: 'Solicitud de Apertura de Cuenta Bancaria', titulo: 'Solicitud de Apertura de Cuenta Bancaria', plural: 'solicitudes', buscar: 'Número documento', opcion: 'gir', modo: 'busqueda',
    filtros: ['condicion', 'tipoDoc', 'numDoc', 'nombres', 'banco'],
    campos: [
      { k: 'condicion', t: 'Condición', tipo: 'lista', req: true, c: 6, opciones: ['TRABAJADOR', 'PENSIONISTA', 'PROVEEDOR', 'BENEFICIARIO'] },
      { k: 'tipoDoc', t: 'Tipo Documento', tipo: 'lista', req: true, c: 6, opciones: TIPDOC }, { k: 'numDoc', t: 'Número Documento', req: true, c: 6, patron: DNI },
      { k: 'nombres', t: 'Nombres', req: true, c: 6 }, { k: 'banco', t: 'Banco', tipo: 'lista', req: true, c: 6, opciones: ['BANCO DE LA NACION'] },
      { k: 'fechaNac', t: 'Fecha de nacimiento', tipo: 'fecha', c: 6 }, { k: 'email', t: 'Correo electrónico', c: 6 }, { k: 'telefono', t: 'Teléfono', c: 6 }],
    lista: ['nombres', 'numDoc'], vacio: ['Lista de solicitudes', 'Para poder visualizar la lista de solicitudes, Usted debe realizar una búsqueda.'] },
  { k: 'ope', menu: 'Beneficiario OPE', titulo: 'Beneficiario OPE', plural: 'beneficiarios', buscar: 'Buscar número de documento', opcion: 'gir',
    campos: [
      { k: 'tipoDoc', t: 'Tipo Documento', tipo: 'lista', req: true, c: 4, opciones: TIPDOC }, { k: 'numDoc', t: 'Número Documento', req: true, c: 4, patron: DNI }, { k: 'banco', t: 'Banco', tipo: 'lista', req: true, c: 4, opciones: BANCOS },
      { k: 'nombres', t: 'Nombres / Razón social', req: true, c: 12 },
      { k: 'tipoCuenta', t: 'Tipo de cuenta', tipo: 'lista', c: 4, opciones: ['AHORROS', 'CORRIENTE'] }, { k: 'cuenta', t: 'Número de cuenta', c: 4 }, { k: 'cci', t: 'CCI', req: true, c: 4, patron: CCI },
      { k: 'email', t: 'Correo electrónico', c: 12 }],
    lista: ['nombres', 'numDoc'], vacio: ['Detalle del beneficiario', 'Para poder visualizar el detalle, Usted debe seleccionar un beneficiario de la lista izquierda'],
    nota: 'Los beneficiarios de la Orden de Pago Electrónica (OPE) cobran en ventanilla del Banco de la Nación sin cuenta bancaria.' },
  { k: 'area', menu: 'Area', titulo: 'Área', plural: 'áreas', buscar: 'Buscar código de área', opcion: 'ca',
    campos: [
      { k: 'codigo', t: 'Código', req: true, c: 3, max: 4, patron: ['^\\d{4}$', 'El código de área tiene 4 dígitos.'] }, { k: 'descripcion', t: 'Descripción', req: true, c: 9 },
      { k: 'responsable', t: 'Responsable', c: 8 }, { k: 'situacion', t: 'Situación', tipo: 'lista', c: 4, opciones: ['ACTIVO', 'INACTIVO'] }],
    lista: ['descripcion', 'codigo'], vacio: ['Detalle del área', 'Para poder visualizar el detalle, Usted debe seleccionar un área de la lista izquierda'] },
  { k: 'ctas', menu: 'Cuentas Bancarias', titulo: 'Cuentas Bancarias', plural: 'cuentas', buscar: 'Buscar número de cuenta', opcion: 'gir',
    campos: [
      { k: 'banco', t: 'Banco', tipo: 'lista', req: true, c: 6, opciones: BANCOS }, { k: 'tipoCuenta', t: 'Tipo de cuenta', tipo: 'lista', req: true, c: 3, opciones: ['CORRIENTE', 'AHORROS'] }, { k: 'moneda', t: 'Moneda', tipo: 'lista', c: 3, opciones: ['S/ - SOLES', 'US$ - DOLARES'] },
      { k: 'cuenta', t: 'Número de cuenta', req: true, c: 6, patron: ['^[\\d-]{6,20}$', 'Número de cuenta inválido.'] }, { k: 'rubro', t: 'Rubro', tipo: 'lista', req: true, c: 6, opciones: RUBROS },
      { k: 'denominacion', t: 'Denominación', req: true, c: 8 }, { k: 'fechaApertura', t: 'Fecha de apertura', tipo: 'fecha', c: 4 }],
    lista: ['banco', 'cuenta'], vacio: ['Detalle de la cuenta bancaria', 'Para poder visualizar el detalle, Usted debe seleccionar una cuenta de la lista izquierda'] },
  { k: 'cci', menu: 'Cuenta Interbancaria (CCI)', titulo: 'Cuenta Interbancaria (CCI)', plural: 'registros', buscar: 'Buscar número de documento', opcion: 'gir',
    campos: [
      { k: 'tipoDoc', t: 'Tipo Documento', tipo: 'lista', req: true, c: 4, opciones: TIPDOC }, { k: 'numDoc', t: 'Número Documento', req: true, c: 4, patron: DNI }, { k: 'moneda', t: 'Moneda', tipo: 'lista', c: 4, opciones: ['S/ - SOLES', 'US$ - DOLARES'] },
      { k: 'nombres', t: 'Nombres / Razón social', req: true, c: 12 }, { k: 'banco', t: 'Banco', tipo: 'lista', req: true, c: 6, opciones: BANCOS }, { k: 'cci', t: 'CCI', req: true, c: 6, patron: CCI }],
    lista: ['nombres', 'cci'], vacio: ['Detalle de la cuenta interbancaria', 'Para poder visualizar el detalle, Usted debe seleccionar un registro de la lista izquierda'],
    nota: 'El CCI se usa para abonar a proveedores y personas mediante transferencia interbancaria.' },
  { k: 'conv', menu: 'Convenios', titulo: 'Convenios', plural: 'convenios', buscar: 'Buscar número de convenio', opcion: 'ca',
    campos: [
      { k: 'numero', t: 'Número de convenio', req: true, c: 6 }, { k: 'fecha', t: 'Fecha de suscripción', tipo: 'fecha', req: true, c: 3 }, { k: 'monto', t: 'Monto S/', tipo: 'monto', req: true, c: 3 },
      { k: 'rucContraparte', t: 'RUC de la contraparte', req: true, c: 4, patron: ['^\\d{11}$', 'El RUC tiene 11 dígitos.'] }, { k: 'contraparte', t: 'Entidad contraparte', req: true, c: 8 },
      { k: 'objeto', t: 'Objeto del convenio', tipo: 'area', req: true, c: 12 }, { k: 'desde', t: 'Vigencia desde', tipo: 'fecha', c: 6 }, { k: 'hasta', t: 'Vigencia hasta', tipo: 'fecha', c: 6 }],
    lista: ['contraparte', 'numero'], vacio: ['Detalle del convenio', 'Para poder visualizar el detalle, Usted debe seleccionar un convenio de la lista izquierda'] },
  { k: 'via', menu: 'Viáticos y Encargos Internos', titulo: 'Viáticos y Encargos Internos', plural: 'solicitudes', buscar: 'Buscar número de solicitud', opcion: 'cm',
    campos: [
      { k: 'tipoSolicitud', t: 'Tipo de solicitud', tipo: 'lista', req: true, c: 6, opciones: ['VIATICO NACIONAL', 'VIATICO INTERNACIONAL', 'ENCARGO INTERNO'] }, { k: 'dni', t: 'DNI del comisionado', req: true, c: 3, patron: ['^\\d{8}$', 'El DNI tiene 8 dígitos.'] }, { k: 'meta', t: 'Meta', req: true, c: 3, max: 4 },
      { k: 'nombres', t: 'Apellidos y nombres', req: true, c: 12 }, { k: 'destino', t: 'Destino', req: true, c: 6 }, { k: 'salida', t: 'Fecha de salida', tipo: 'fecha', req: true, c: 3 }, { k: 'retorno', t: 'Fecha de retorno', tipo: 'fecha', req: true, c: 3 },
      { k: 'clasificador', t: 'Clasificador', tipo: 'lista', req: true, c: 6, opciones: ['2.3.2.1.2.1 - PASAJES Y GASTOS DE TRANSPORTE', '2.3.2.1.2.2 - VIATICOS Y ASIGNACIONES POR COMISION DE SERVICIO', '2.3.2.1.1.1 - PASAJES Y GASTOS DE TRANSPORTE (EXTERIOR)'] }, { k: 'monto', t: 'Monto S/', tipo: 'monto', req: true, c: 6 },
      { k: 'motivo', t: 'Motivo de la comisión', tipo: 'area', req: true, c: 12 }],
    lista: ['nombres', 'monto'], vacio: ['Detalle de la solicitud', 'Para poder visualizar el detalle, Usted debe seleccionar una solicitud de la lista izquierda'],
    nota: 'La solicitud aprobada sustenta el compromiso del encargo interno para viáticos (tipo de operación AV) y su posterior rendición.' },
  { k: 'dliq', menu: 'Distribución de la Liquidación del Viático - Encargo Interno', titulo: 'Distribución de la Liquidación del Viático - Encargo Interno', plural: 'liquidaciones', buscar: 'Buscar número de liquidación', opcion: 'dev',
    campos: [
      { k: 'solicitud', t: 'Número de solicitud', tipo: 'numero', req: true, c: 4 }, { k: 'dni', t: 'DNI del comisionado', req: true, c: 4, patron: ['^\\d{8}$', 'El DNI tiene 8 dígitos.'] }, { k: 'clasificador', t: 'Clasificador', req: true, c: 4, patron: ['^2(\\.\\d+){4,5}$', 'Clasificador de gasto inválido.'] },
      { k: 'otorgado', t: 'Monto otorgado S/', tipo: 'monto', req: true, c: 4 }, { k: 'rendido', t: 'Monto rendido S/', tipo: 'monto', req: true, c: 4 }, { k: 'devolucion', t: 'Devolución (T-6) S/', tipo: 'monto', c: 4 },
      { k: 'observacion', t: 'Observación', tipo: 'area', c: 12 }],
    lista: ['dni', 'rendido'], vacio: ['Detalle de la liquidación', 'Para poder visualizar el detalle, Usted debe seleccionar una liquidación de la lista izquierda'] },
  { k: 'modvia', menu: 'Modificación de Solicitud de Viático y Encargo Interno', titulo: 'Modificación de solicitud de viático y encargo interno', plural: 'Modificaciones', buscar: 'Buscar número solicitud', opcion: 'cm',
    campos: [
      { k: 'tipoSolicitud', t: 'Tipo Solicitud', tipo: 'lista', req: true, c: 6, opciones: ['VIATICO NACIONAL', 'VIATICO INTERNACIONAL', 'ENCARGO INTERNO'] }, { k: 'solicitud', t: 'Número de solicitud', tipo: 'numero', req: true, c: 6 },
      { k: 'dato', t: 'Dato a modificar', tipo: 'lista', req: true, c: 6, opciones: ['Fecha de salida', 'Fecha de retorno', 'Destino', 'Monto', 'Motivo de la comisión'] }, { k: 'debe', t: 'Debe decir', req: true, c: 6 },
      { k: 'justif', t: 'Justificación', tipo: 'area', req: true, c: 12 }],
    filtros: ['tipoSolicitud'],
    lista: ['dato', 'solicitud'], vacio: ['Detalle de la modificación', 'Para poder visualizar el detalle, Usted debe seleccionar una modificación de la lista izquierda'] },
  { k: 'pim', menu: 'Marco presupuestal (PIM)', titulo: 'Marco presupuestal (PIM)', plural: 'metas / clasificadores', buscar: 'Buscar meta o clasificador', opcion: 'cert',
    campos: [
      { k: 'meta', t: 'Meta (secuencia funcional)', req: true, c: 3, max: 4, patron: ['^\\d{4}$', 'La meta tiene 4 dígitos (ej. 0001).'] }, { k: 'metaNom', t: 'Nombre de la meta / finalidad', req: true, c: 9 },
      { k: 'rubro', t: 'Rubro', tipo: 'lista', req: true, c: 6, opciones: RUBROS }, { k: 'clas', t: 'Clasificador de gasto', req: true, c: 3, patron: ['^2(\\.\\d+){4,5}$', 'Clasificador de gasto inválido (ej. 2.3.1.5.1.2).'] }, { k: 'pim', t: 'PIM S/', tipo: 'monto', req: true, c: 3 }],
    lista: ['clas', 'meta'], vacio: ['Marco presupuestal', 'Registre el PIM por meta, rubro y clasificador para certificar sus propias operaciones. Al enviarlo queda disponible en el Seleccionador de Meta.'],
    nota: 'El PIM aprobado (enviado) se suma al marco presupuestal de la unidad ejecutora: aparece en el Seleccionador de Meta de la certificación y en la Asignación de Tesoro Público.' },
  { k: 'ticket', menu: 'Tickets de soporte', titulo: 'Ticket de soporte', plural: 'tickets', buscar: 'Buscar ticket',
    campos: [
      { k: 'cargo', t: 'Cargo', req: true, c: 8 }, { k: 'dni', t: 'Número DNI', req: true, c: 4, patron: ['^\\d{8}$', 'El DNI tiene 8 dígitos.'] },
      { k: 'telefono', t: 'Teléfono', c: 4 }, { k: 'anexo', t: 'Anexo (opcional)', c: 2 }, { k: 'celular', t: 'Celular (opcional)', c: 6 }, { k: 'correo', t: 'Correo', req: true, c: 12 },
      { k: 'asunto', t: 'Asunto', req: true, c: 12 }, { k: 'detalle', t: 'Detalle', tipo: 'area', req: true, c: 12 }],
    lista: ['asunto', 'correo'], vacio: ['Tickets de soporte', 'Registre su consulta para la mesa de ayuda.'] },
];
export const AUX_POR_K: Record<string, DefAux> = Object.fromEntries(AUX.map(d => [d.k, d]));
export const AYUDA_TEXTO = MOTIVO;
