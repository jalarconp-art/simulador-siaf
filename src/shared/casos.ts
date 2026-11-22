/* Casos Prácticos 1, 2 y 3: definición declarativa de fases, asientos y controles. Generado por tools/port-data.js */
import type { CasoDef } from './types';

/* Casos habilitados en la aplicación: solo el Caso Práctico 1 (obra P.S. Aymaña, CUI 2308220). */
export const CTX_ORDER = ["cp1"] as const;
export type CtxId = typeof CTX_ORDER[number];

export const CASOS: Record<string, CasoDef> = {
 "cp1": {
  "grupo": "Caso Práctico 1",
  "titulo": "Obra P.S. Aymaña - Certificación, compromiso anual, compromiso mensual, devengado y girado",
  "corto": "CP1 · Obra Aymaña (AF 2022)",
  "anio": 2022,
  "nivel": "GR",
  "entidad": {
   "pliego": "458",
   "pliegoNom": "GOBIERNO REGIONAL DEL DEPARTAMENTO DE PUNO",
   "ue": "001",
   "ueNom": "REGION PUNO-SEDE CENTRAL",
   "secEjec": "000902",
   "ruc": "20406325815",
   "depto": "21 PUNO",
   "prov": "01 PUNO",
   "dir": "Jr. Deustua N.° 356, Puno"
  },
  "metas": [
   {
    "sec": "0902",
    "cadena": "9002 · 2308220 · 41000075 · 20 · 044 · 0096",
    "nombre": "MEJORAMIENTO DE LA CAPACIDAD RESOLUTIVA DEL PUESTO DE SALUD DE AYMAÑA",
    "cat": "9002",
    "prod": "2308220",
    "act": "41000075",
    "fn": "20",
    "div": "044",
    "grp": "0096"
   }
  ],
  "pim": [
   [
    "0902",
    "18",
    "2.6.2.2.3.2",
    6200000
   ],
   [
    "0902",
    "18",
    "2.6.3.2.4.2",
    1750000
   ],
   [
    "0902",
    "18",
    "2.6.8.1.4.3",
    250000
   ]
  ],
  "proveedores": [
   [
    "RUC",
    "20999999991",
    "CONSORCIO AMERICANO (RUC ilustrativo)"
   ],
   [
    "RUC",
    "20406325815",
    "GOBIERNO REGIONAL PUNO - CUENTA DE GARANTIAS"
   ],
   [
    "DNI",
    "77126557",
    "QUISPE FERNANDEZ ADRIAN JUNIOR (REPRESENTANTE COMUN)"
   ]
  ],
  "seq": {
   "cert": 230,
   "ca": 30,
   "exp": 1240,
   "ing": 10,
   "mod": 20
  },
  "subcasos": [
   {
    "id": "aym",
    "titulo": "Obra P.S. Aymaña (Tareas 1 y 2)",
    "ff": "5",
    "rubro": "18",
    "meta": "0902",
    "enunciado": [
     "La Oficina de Abastecimientos y Servicios Auxiliares del Gobierno Regional Puno solicita, con el Memorándum N.° 100-2021-GR-PUNO/ORA/OASA del 18/10/2021 y el Formato N.° 01, la certificación de crédito presupuestario por S/ 5,959,341.13 (valor referencial del Componente I) para ejecutar la obra «Mejoramiento de la capacidad resolutiva del Puesto de Salud de Aymaña», CUI 2308220.",
     "La Sub Gerencia de Presupuesto emite la Nota de Certificación N.° 0000000233, aprobada el 19/01/2022. El 18/01/2022 se suscribe el Contrato N.° 08-2022-AS-GR PUNO con el Consorcio Americano por S/ 7,652,879.09 (obra S/ 5,959,341.13 + equipamiento médico etapa I S/ 1,693,537.96), por lo que la certificación se amplía en S/ 1,693,537.96.",
     "La valorización N.° 04 (junio 2022) por S/ 105,115.67 obtiene procedencia con el Informe N.° 1629-2022-GR PUNO-GGR-ORSyLP/JJCC (29/09/2022), conformidad de la GRI (30/09/2022) y Factura N.° 001-1050 del 05/10/2022. Se registra en octubre de 2022: compromiso mensual, devengado y girado (la retención del 10 % por fiel cumplimiento absorbe todo el pago del mes)."
    ],
    "datos": [
     [
      "Pliego / UE",
      "458 Gobierno Regional del Departamento de Puno / 001 Región Puno-Sede Central (000902)"
     ],
     [
      "Categoría / Proyecto / Acción",
      "9002 / 2308220 / 41000075 Infraestructura de salud"
     ],
     [
      "Función / División / Grupo",
      "20 Salud / 044 / 0096"
     ],
     [
      "Meta",
      "0902 Mejoramiento de la capacidad resolutiva del P.S. Aymaña"
     ],
     [
      "Fuente / Rubro",
      "5 Recursos Determinados / 18 Canon y sobrecanon, regalías, renta de aduanas y participaciones"
     ],
     [
      "Clasificador obra",
      "2.6.2.2.3.2 Costo de construcción por contrata"
     ],
     [
      "Clasificador equipamiento",
      "2.6.3.2.4.2 Equipos (adquisición de mobiliario, equipos y aparatos médicos)"
     ],
     [
      "Certificación",
      "Nota N.° 0000000233 · S/ 5,959,341.13 · aprobada 19/01/2022"
     ],
     [
      "Contrato",
      "N.° 08-2022-AS-GR PUNO · 18/01/2022 · S/ 7,652,879.09 · suma alzada · 210 días"
     ],
     [
      "Garantía fiel cumplimiento",
      "Retención 10 %: S/ 765,287.91 (art. 149.4 RLCE)"
     ],
     [
      "Valorizaciones 1 a 3",
      "S/ 85,750.53 + S/ 127,287.77 + S/ 505,796.19 = S/ 718,834.49 (ya comprometidas)"
     ],
     [
      "Valorización N.° 04",
      "S/ 105,115.67 · Factura N.° 001-1050 · 05/10/2022"
     ]
    ],
    "nota": "El documento del caso cita el clasificador 2.6.3.2.5.2 para el equipamiento; en el Clasificador Económico de Gastos 2026 ese código es «Equipo de uso agrícola y pesquero». El simulador usa 2.6.3.2.4.2 «Equipos» de la subgenérica 2.6.3.2.4 «Adquisición de mobiliario, equipos y aparatos médicos».",
    "ops": [
     {
      "op": "cert",
      "fase": "Certificación",
      "key": "cert",
      "num": 233,
      "mes": 1,
      "fecha": "19/01/2022",
      "doc": [
       "086",
       "100-2021-GR-PUNO/ORA/OASA",
       "18/10/2021"
      ],
      "tipoCert": "ADQUISICION / SEACE",
      "justif": "EJECUCION DE LA OBRA MEJORAMIENTO DE LA CAPACIDAD RESOLUTIVA DEL PUESTO DE SALUD DE AYMAÑA DEL CENTRO POBLADO DE AYMAÑA, DISTRITO DE CORANI, PROVINCIA DE CARABAYA, DEPARTAMENTO DE PUNO, CUI 2308220",
      "items": [
       [
        "2.6.2.2.3.2",
        "0902",
        5959341.13
       ]
      ],
      "sin": "La certificación solo reserva el crédito presupuestario: no genera asiento contable."
     },
     {
      "op": "certAmp",
      "fase": "Ampliación de la certificación (equipamiento)",
      "key": "amp",
      "ref": "cert",
      "mes": 1,
      "fecha": "20/01/2022",
      "doc": [
       "086",
       "012-2022-GR-PUNO/ORA/OASA",
       "20/01/2022"
      ],
      "items": [
       [
        "2.6.3.2.4.2",
        "0902",
        1693537.96
       ]
      ],
      "sin": "La ampliación de la certificación no genera asiento contable."
     },
     {
      "op": "ca",
      "fase": "Compromiso anual",
      "key": "ca",
      "ref": "cert",
      "num": 33,
      "mes": 1,
      "fecha": "21/01/2022",
      "tipoOp": "N",
      "doc": [
       "070",
       "08-2022-AS-GR PUNO",
       "18/01/2022"
      ],
      "prov": [
       "RUC",
       "20999999991"
      ],
      "justif": "CONTRATO Nº 08-2022-AS-GR PUNO CON EL CONSORCIO AMERICANO, EJECUCION DE OBRA COMPONENTE I Y EQUIPAMIENTO MEDICO ETAPA I DEL PI CUI 2308220, AS Nº 136-2021-CS/GR PUNO, SUMA ALZADA, 210 DIAS",
      "items": [
       [
        "2.6.2.2.3.2",
        "0902",
        5959341.13
       ],
       [
        "2.6.3.2.4.2",
        "0902",
        1693537.96
       ]
      ],
      "as": [
       [
        1,
        "Presupuestaria",
        "8301.0504",
        "Presupuesto de gastos - Canon, sobrecanon, regalías, renta de aduanas y participaciones",
        7652879.09,
        0,
        ""
       ],
       [
        1,
        "Presupuestaria",
        "8401.0504",
        "Asignaciones comprometidas - Canon, sobrecanon, regalías...",
        0,
        7652879.09,
        ""
       ],
       [
        2,
        "De orden",
        "9101.01",
        "Contratos y proyectos aprobados",
        7652879.09,
        0,
        "Documento SIAF 070 - Contrato suscrito (obras)"
       ],
       [
        2,
        "De orden",
        "9102.01",
        "Contratos y proyectos por ejecutar",
        0,
        7652879.09,
        ""
       ]
      ]
     },
     {
      "op": "cm",
      "hist": true,
      "fase": "Compromiso mensual valorización N.° 01 (antecedente)",
      "ref": "ca",
      "exp": 1101,
      "mes": 4,
      "fecha": "28/04/2022",
      "doc": [
       "070",
       "08-2022-AS-GR PUNO",
       "28/04/2022"
      ],
      "notas": "VALORIZACION Nº 01 (MARZO 2022)",
      "items": [
       [
        "2.6.2.2.3.2",
        "0902",
        85750.53
       ]
      ]
     },
     {
      "op": "cm",
      "hist": true,
      "fase": "Compromiso mensual valorización N.° 02 (antecedente)",
      "ref": "ca",
      "exp": 1132,
      "mes": 5,
      "fecha": "31/05/2022",
      "doc": [
       "070",
       "08-2022-AS-GR PUNO",
       "31/05/2022"
      ],
      "notas": "VALORIZACION Nº 02 (ABRIL 2022)",
      "items": [
       [
        "2.6.2.2.3.2",
        "0902",
        127287.77
       ]
      ]
     },
     {
      "op": "cm",
      "hist": true,
      "fase": "Compromiso mensual valorización N.° 03 (antecedente)",
      "ref": "ca",
      "exp": 1178,
      "mes": 6,
      "fecha": "30/06/2022",
      "doc": [
       "070",
       "08-2022-AS-GR PUNO",
       "30/06/2022"
      ],
      "notas": "VALORIZACION Nº 03 (MAYO 2022)",
      "items": [
       [
        "2.6.2.2.3.2",
        "0902",
        505796.19
       ]
      ]
     },
     {
      "op": "cm",
      "fase": "Compromiso mensual",
      "key": "cm",
      "ref": "ca",
      "exp": 1245,
      "mes": 10,
      "fecha": "05/10/2022",
      "modalidad": "CA - LEY DE CONTRATACIONES DEL ESTADO",
      "tipoProc": "ADJUDICACION SIMPLIFICADA",
      "doc": [
       "070",
       "08-2022-AS-GR PUNO",
       "05/10/2022"
      ],
      "notas": "VALORIZACION Nº 04 (JUNIO 2022). INFORME Nº 1629-2022-GR PUNO-GGR-ORSyLP/JJCC, CONFORMIDAD GRI 30/09/2022, FACTURA Nº 001-1050",
      "tipoPago": "A - ABONO EN CUENTA",
      "items": [
       [
        "2.6.2.2.3.2",
        "0902",
        105115.67
       ]
      ],
      "sin": "El compromiso mensual no genera asiento contable: programa la obligación del mes."
     },
     {
      "op": "dev",
      "fase": "Devengado",
      "key": "dev",
      "ref": "cm",
      "mes": 10,
      "fecha": "10/10/2022",
      "doc": [
       "001",
       "0001",
       "00001050",
       "05/10/2022"
      ],
      "notas": "DEVENGADO DE LA VALORIZACION Nº 04 (JUNIO 2022), CONFORMIDAD GRI 30/09/2022, FACTURA Nº 001-1050",
      "items": [
       [
        "2.6.2.2.3.2",
        "0902",
        105115.67
       ]
      ],
      "as": [
       [
        3,
        "Patrimonial",
        "1501.070301",
        "Edificios y estructuras - Construcción de edificios no residenciales - Instalaciones médicas - Por contrata",
        105115.67,
        0,
        ""
       ],
       [
        3,
        "Patrimonial",
        "2103.0201",
        "Cuentas por pagar - Activos no financieros por pagar",
        0,
        105115.67,
        ""
       ],
       [
        4,
        "Presupuestaria",
        "8401.0504",
        "Asignaciones comprometidas - Canon...",
        105115.67,
        0,
        ""
       ],
       [
        4,
        "Presupuestaria",
        "8601.0504",
        "Ejecución de gastos - Canon...",
        0,
        105115.67,
        "Específica 2.6.2.2.3.2"
       ],
       [
        5,
        "De orden",
        "9102.01",
        "Contratos y proyectos por ejecutar",
        105115.67,
        0,
        ""
       ],
       [
        5,
        "De orden",
        "9101.01",
        "Contratos y proyectos aprobados",
        0,
        105115.67,
        "Extinción parcial del control del contrato"
       ]
      ]
     },
     {
      "op": "gir",
      "fase": "Girado",
      "key": "gir",
      "ref": "dev",
      "mes": 10,
      "fecha": "28/10/2022",
      "medio": "RETENCION - GARANTIA DE FIEL CUMPLIMIENTO",
      "tipoGiro": "PRINCIPAL",
      "benef": [
       "RUC",
       "20999999991"
      ],
      "docGiro": "COMPROBANTE DE PAGO Nº 2022-04512",
      "ret": [
       [
        "RETENCION GARANTIA DE FIEL CUMPLIMIENTO 10% (ART. 149.4 RLCE)",
        105115.67
       ]
      ],
      "items": [
       [
        "2.6.2.2.3.2",
        "0902",
        105115.67
       ]
      ],
      "as": [
       [
        6,
        "Patrimonial",
        "2103.0201",
        "Activos no financieros por pagar",
        105115.67,
        0,
        ""
       ],
       [
        6,
        "Patrimonial",
        "2103.03",
        "Depósitos recibidos en garantía (retención fiel cumplimiento)",
        0,
        105115.67,
        "Pago líquido al contratista S/ 0.00: todo el mes queda retenido"
       ]
      ]
     }
    ],
    "controles": [
     [
      "El compromiso anual no supera la certificación (con ampliación)",
      "ca",
      [
       "cert",
       "certAmp"
      ]
     ],
     [
      "El compromiso mensual no supera el compromiso anual",
      "cm",
      [
       "ca"
      ]
     ],
     [
      "El devengado no supera el compromiso mensual",
      "dev",
      [
       "cm"
      ]
     ],
     [
      "El girado no supera el devengado",
      "gir",
      [
       "dev"
      ]
     ]
    ],
    "docsFuente": [
     [
      "Memorándum N.° 100-2021-GR-PUNO/ORA/OASA + Formato N.° 01",
      "Oficina de Abastecimientos (OASA)",
      "Solicita la certificación (fase Certificación)"
     ],
     [
      "Nota de Certificación N.° 0000000233",
      "Sub Gerencia de Presupuesto - GRPPAT",
      "Acredita el crédito presupuestario reservado"
     ],
     [
      "RGR N.° 228-2021-GRI-GR PUNO",
      "Gerencia Regional de Infraestructura",
      "Aprueba el expediente técnico (sustento del valor referencial)"
     ],
     [
      "Contrato N.° 08-2022-AS-GR PUNO (registrado en SEACE)",
      "Gobierno Regional y Consorcio Americano",
      "Sustenta el compromiso anual (código 070)"
     ],
     [
      "Valorización N.° 04 + Informe N.° 1629-2022 ORSyLP",
      "Inspector / Supervisor / ORSyLP",
      "Acredita la ejecución de la obra (compromiso mensual y devengado)"
     ],
     [
      "Conformidad de la GRI (30/09/2022)",
      "Gerencia Regional de Infraestructura",
      "Conformidad del área usuaria para el devengado"
     ],
     [
      "Factura N.° 001-1050 del 05/10/2022",
      "Consorcio Americano",
      "Comprobante del devengado (código 001, serie 0001, número 00001050)"
     ],
     [
      "Comprobante de pago / retención GFC",
      "Tesorería",
      "Sustenta el girado y la retención del 10 %"
     ]
    ],
    "pregunta": "¿Por qué el compromiso mensual de la valorización N.° 04 (junio 2022) se registra en octubre de 2022 y por qué la retención por fiel cumplimiento no reduce el compromiso ni el devengado?",
    "respuesta": "La valorización se presentó el 07/07/2022 con observaciones; la ORSyLP declaró la procedencia el 29/09/2022, la GRI dio conformidad el 30/09/2022 y la factura llegó el 05/10/2022: la obligación recién es exigible en octubre, por eso se compromete y devenga en ese mes. La retención (art. 149.4 RLCE) es una forma de garantía: la obligación con el contratista es por el total facturado (S/ 105,115.67); en el girado se separa el monto retenido (2103.03) y el pago líquido de junio fue S/ 0.00.",
    "pasos": [
     [
      "Certificados",
      "MA-3: Crear certificado (+), documento 086 Memorándum, rubro 18, tipo de certificación, justificación, Agregar meta 0902 con 2.6.2.2.3.2 y monto. Grabar › Confirmar › Enviar."
     ],
     [
      "opl",
      "Guía CCP: la OPP aprueba la solicitud en SIAF Operaciones en Línea (Módulo presupuestal UE)."
     ],
     [
      "madaf",
      "MA-6: el responsable autoriza la certificación en el MADAF (PIN + clave dinámica)."
     ],
     [
      "Certificados",
      "MA-3 VII: Ampliar (⋮) la certificación en S/ 1,693,537.96 con 2.6.3.2.4.2 y Enviar."
     ],
     [
      "Compromiso Anual",
      "MA-4: seleccionar el certificado, Insertar Compromiso, tipo N, doc 070, proveedor RUC, Con origen, Grabar › Enviar › MADAF."
     ],
     [
      "Registro SIAF - Compromiso Mensual",
      "MA-7 III: Crear expediente, elegir el CA, Siguiente, monto 105,115.67, Documento A 070, Grabar › Enviar (aprobación automática)."
     ],
     [
      "Registro SIAF - Devengado",
      "MA-7 IV: Insertar Devengado, código 001 Factura, serie 0001, número 00001050, Con origen, Grabar › Enviar › MADAF (DGA)."
     ],
     [
      "Registro SIAF - Girado",
      "MA-6 VI: Girado con retención de garantía de fiel cumplimiento; autorización de giros en el MADAF."
     ],
     [
      "Módulo Contable",
      "Revise los asientos en las tres capas y los controles del ciclo."
     ]
    ]
   }
  ]
 },
 "cp2a": {
  "grupo": "Caso Práctico 2",
  "titulo": "Casos 1 a 4 · Gobierno Regional del Altiplano - Caja chica, encargo interno, sentencia judicial y planilla CAS",
  "corto": "CP2 · GR Altiplano (Casos 1-4)",
  "anio": 2026,
  "nivel": "GR",
  "entidad": {
   "pliego": "999",
   "pliegoNom": "GOBIERNO REGIONAL DEL ALTIPLANO (ENTIDAD FICTICIA)",
   "ue": "001",
   "ueNom": "SEDE CENTRAL",
   "secEjec": "000999",
   "ruc": "20999999992",
   "depto": "21 PUNO",
   "prov": "01 PUNO",
   "dir": "Ficticia"
  },
  "metas": [
   {
    "sec": "0010",
    "cadena": "9001 · 3999999 · 5000003 · 03 · 006 · 0008",
    "nombre": "GESTION ADMINISTRATIVA",
    "cat": "9001",
    "prod": "3999999",
    "act": "5000003",
    "fn": "03",
    "div": "006",
    "grp": "0008"
   },
   {
    "sec": "0045",
    "cadena": "9002 · 3999999 · 5000501 · 23 · 051 · 0115",
    "nombre": "DESARROLLO DE CAPACIDADES - TALLER ETICA EN LA FUNCION PUBLICA (GRDS)",
    "cat": "9002",
    "prod": "3999999",
    "act": "5000501",
    "fn": "23",
    "div": "051",
    "grp": "0115"
   },
   {
    "sec": "0032",
    "cadena": "9002 · 3999999 · 5000991 · 24 · 053 · 0119",
    "nombre": "OBLIGACIONES PREVISIONALES - PAGO DE SENTENCIAS JUDICIALES",
    "cat": "9002",
    "prod": "3999999",
    "act": "5000991",
    "fn": "24",
    "div": "053",
    "grp": "0119"
   }
  ],
  "pim": [
   [
    "0010",
    "09",
    "2.3.1.5.1.2",
    8000
   ],
   [
    "0010",
    "09",
    "2.3.1.5.3.1",
    5000
   ],
   [
    "0010",
    "09",
    "2.3.2.4.2.1",
    10000
   ],
   [
    "0010",
    "09",
    "2.3.2.1.2.99",
    6000
   ],
   [
    "0010",
    "09",
    "2.3.2.7.11.99",
    20000
   ],
   [
    "0010",
    "00",
    "2.1.1.13.1.1",
    520000
   ],
   [
    "0010",
    "00",
    "2.1.1.13.1.2",
    120000
   ],
   [
    "0010",
    "00",
    "2.1.3.1.1.15",
    46000
   ],
   [
    "0045",
    "00",
    "2.3.2.1.2.1",
    15000
   ],
   [
    "0045",
    "00",
    "2.3.1.1.1.1",
    12000
   ],
   [
    "0045",
    "00",
    "2.3.1.9.1.2",
    9000
   ],
   [
    "0045",
    "00",
    "2.3.2.1.2.2",
    10000
   ],
   [
    "0032",
    "00",
    "2.2.1.2.1.1",
    180000
   ],
   [
    "0032",
    "00",
    "2.1.5.1.1.1",
    60000
   ]
  ],
  "proveedores": [
   [
    "DNI",
    "40000001",
    "QUISPE RAMOS MARIA (RESPONSABLE CAJA CHICA - FICTICIO)"
   ],
   [
    "DNI",
    "40000002",
    "PEREZ MAMANI JUAN (ENCARGADO - FICTICIO)"
   ],
   [
    "DNI",
    "40000003",
    "CONDORI HUANCA PEDRO (PENSIONISTA - FICTICIO)"
   ],
   [
    "RUC",
    "20999999992",
    "GOBIERNO REGIONAL DEL ALTIPLANO - PLANILLA CAS (12 TRABAJADORES)"
   ],
   [
    "RUC",
    "20131312955",
    "SUNAT - PDT PLAME (ONP Y ESSALUD)"
   ],
   [
    "RUC",
    "20999999993",
    "AFP - RECAUDACION AFPnet (ilustrativo)"
   ]
  ],
  "seq": {
   "cert": 60,
   "ca": 70,
   "exp": 300,
   "ing": 10,
   "mod": 20
  },
  "subcasos": [
   {
    "id": "cc",
    "titulo": "Caso 1 · Apertura y reposición de la Caja Chica",
    "ff": "2",
    "rubro": "09",
    "meta": "0010",
    "enunciado": [
     "La Oficina Regional de Administración aprueba, con R.D.A. N.° 012-2026-GRA/ORA del 05/01/2026, la apertura del Fondo para Caja Chica del AF 2026 por S/ 5 000,00 con cargo a Recursos Directamente Recaudados. Designa responsable a María Quispe Ramos (Tesorería), fija el monto máximo por pago en el 20 % de la UIT (S/ 1 100,00) y dispone reponer cuando se use el 70 % o más.",
     "El fondo se entrega con Orden de Pago Electrónica el 08/01/2026. En enero se pagan S/ 3 750,00 (75 % del fondo) y el 30/01/2026 la responsable rinde y solicita la reposición."
    ],
    "datos": [
     [
      "Resolución de apertura",
      "R.D.A. N.° 012-2026-GRA/ORA · 05/01/2026"
     ],
     [
      "Monto del fondo",
      "S/ 5 000,00 · RDR (FF 2 / Rb 09)"
     ],
     [
      "Monto máximo por pago",
      "20 % de la UIT 2026 = S/ 1 100,00"
     ],
     [
      "Entrega del fondo",
      "Orden de Pago Electrónica · 08/01/2026"
     ],
     [
      "Factura F001-000845 · 12/01/2026",
      "Útiles de escritorio · S/ 980,00"
     ],
     [
      "Factura F002-001233 · 15/01/2026",
      "Artículos de limpieza · S/ 520,00"
     ],
     [
      "Boleta B001-000417 · 20/01/2026",
      "Servicio de cerrajería (cambio de chapas) · S/ 1 050,00"
     ],
     [
      "Planilla de movilidad local N.° 001-2026",
      "18 traslados en enero · S/ 1 200,00"
     ],
     [
      "Rendición y solicitud de reposición",
      "30/01/2026 · S/ 3 750,00"
     ]
    ],
    "ops": [
     {
      "op": "cert",
      "fase": "Certificación (apertura)",
      "key": "cert",
      "num": 15,
      "mes": 1,
      "fecha": "05/01/2026",
      "doc": [
       "086",
       "Nº 005-2026-GRA/ORA",
       "05/01/2026"
      ],
      "tipoCert": "OTROS",
      "justif": "APERTURA DEL FONDO PARA CAJA CHICA AF 2026 SEGUN R.D.A. Nº 012-2026-GRA/ORA, RESPONSABLE MARIA QUISPE RAMOS",
      "items": [
       [
        "2.3.1.5.1.2",
        "0010",
        1500
       ],
       [
        "2.3.1.5.3.1",
        "0010",
        1000
       ],
       [
        "2.3.2.4.2.1",
        "0010",
        1200
       ],
       [
        "2.3.2.1.2.99",
        "0010",
        1300
       ]
      ],
      "sin": "Solo reserva el crédito."
     },
     {
      "op": "ca",
      "fase": "Compromiso anual (apertura)",
      "key": "ca",
      "ref": "cert",
      "num": 71,
      "mes": 1,
      "fecha": "05/01/2026",
      "tipoOp": "C",
      "doc": [
       "234",
       "R.D.A. Nº 012-2026-GRA/ORA",
       "05/01/2026"
      ],
      "prov": [
       "DNI",
       "40000001"
      ],
      "justif": "APERTURA DEL FONDO PARA CAJA CHICA AF 2026 SEGUN R.D.A. Nº 012-2026-GRA/ORA",
      "items": [
       [
        "2.3.1.5.1.2",
        "0010",
        1500
       ],
       [
        "2.3.1.5.3.1",
        "0010",
        1000
       ],
       [
        "2.3.2.4.2.1",
        "0010",
        1200
       ],
       [
        "2.3.2.1.2.99",
        "0010",
        1300
       ]
      ],
      "as": [
       [
        1,
        "Presupuestaria",
        "8301.0201",
        "Presupuesto de gastos - Recursos Directamente Recaudados",
        5000,
        0,
        ""
       ],
       [
        1,
        "Presupuestaria",
        "8401.0201",
        "Asignaciones comprometidas - Recursos Directamente Recaudados",
        0,
        5000,
        "Sin cuentas de orden: no es contrato"
       ]
      ]
     },
     {
      "op": "cm",
      "fase": "Compromiso mensual (apertura)",
      "key": "cm",
      "ref": "ca",
      "exp": 301,
      "mes": 1,
      "fecha": "06/01/2026",
      "modalidad": "CC - CAJA CHICA",
      "tipoProc": "NO APLICA",
      "doc": [
       "234",
       "R.D.A. Nº 012-2026-GRA/ORA",
       "05/01/2026"
      ],
      "notas": "APERTURA DEL FONDO PARA CAJA CHICA 2026",
      "tipoPago": "O - ORDEN DE PAGO ELECTRONICA",
      "items": [
       [
        "2.3.1.5.1.2",
        "0010",
        1500
       ],
       [
        "2.3.1.5.3.1",
        "0010",
        1000
       ],
       [
        "2.3.2.4.2.1",
        "0010",
        1200
       ],
       [
        "2.3.2.1.2.99",
        "0010",
        1300
       ]
      ],
      "sin": "Sin asiento contable."
     },
     {
      "op": "dev",
      "rol": "apertura",
      "fase": "Devengado (apertura)",
      "key": "dev",
      "ref": "cm",
      "mes": 1,
      "fecha": "07/01/2026",
      "doc": [
       "234",
       "",
       "R.D.A. 012-2026-GRA/ORA",
       "05/01/2026"
      ],
      "notas": "DEVENGADO DE LA APERTURA DEL FONDO PARA CAJA CHICA",
      "items": [
       [
        "2.3.1.5.1.2",
        "0010",
        1500
       ],
       [
        "2.3.1.5.3.1",
        "0010",
        1000
       ],
       [
        "2.3.2.4.2.1",
        "0010",
        1200
       ],
       [
        "2.3.2.1.2.99",
        "0010",
        1300
       ]
      ],
      "as": [
       [
        2,
        "Patrimonial",
        "1101.02",
        "Efectivo - Fondos fijos - Caja chica",
        5000,
        0,
        "El fondo es un activo, no un gasto"
       ],
       [
        2,
        "Patrimonial",
        "2103.0101",
        "Cuentas por pagar - Fondo para caja chica",
        0,
        5000,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8401.0201",
        "Asignaciones comprometidas - RDR",
        5000,
        0,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8601.0201",
        "Ejecución de gastos - RDR",
        0,
        5000,
        "Clasificadores provisionales de la apertura"
       ]
      ]
     },
     {
      "op": "gir",
      "rol": "apertura",
      "fase": "Girado (apertura)",
      "key": "gir",
      "ref": "dev",
      "mes": 1,
      "fecha": "08/01/2026",
      "medio": "OPE - ORDEN DE PAGO ELECTRONICA",
      "tipoGiro": "PRINCIPAL",
      "benef": [
       "DNI",
       "40000001"
      ],
      "docGiro": "OPE Nº 0000012",
      "ret": [],
      "items": [
       [
        "2.3.1.5.1.2",
        "0010",
        1500
       ],
       [
        "2.3.1.5.3.1",
        "0010",
        1000
       ],
       [
        "2.3.2.4.2.1",
        "0010",
        1200
       ],
       [
        "2.3.2.1.2.99",
        "0010",
        1300
       ]
      ],
      "as": [
       [
        4,
        "Patrimonial",
        "2103.0101",
        "Cuentas por pagar - Fondo para caja chica",
        5000,
        0,
        ""
       ],
       [
        4,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes en instituciones financieras - RDR",
        0,
        5000,
        "Entrega del fondo con OPE"
       ]
      ]
     },
     {
      "op": "rend",
      "fase": "Devengado (rendición)",
      "key": "rend",
      "ref": "dev",
      "mes": 1,
      "fecha": "30/01/2026",
      "doc": [
       "OTRO",
       "",
       "RENDICION CAJA CHICA Nº 001-2026",
       "30/01/2026"
      ],
      "notas": "RENDICION DE CAJA CHICA ENERO 2026 Y SOLICITUD DE REPOSICION (75% DEL FONDO)",
      "comp": [
       [
        "FACTURA",
        "F001-000845",
        "12/01/2026",
        "UTILES DE ESCRITORIO",
        "2.3.1.5.1.2",
        980
       ],
       [
        "FACTURA",
        "F002-001233",
        "15/01/2026",
        "ARTICULOS DE LIMPIEZA",
        "2.3.1.5.3.1",
        520
       ],
       [
        "BOLETA DE VENTA",
        "B001-000417",
        "20/01/2026",
        "SERVICIO DE CERRAJERIA (CAMBIO DE CHAPAS)",
        "2.3.2.4.2.1",
        1050
       ],
       [
        "PLANILLA DE MOVILIDAD (036)",
        "001-2026",
        "30/01/2026",
        "MOVILIDAD LOCAL - 18 TRASLADOS",
        "2.3.2.1.2.99",
        1200
       ]
      ],
      "items": [
       [
        "2.3.1.5.1.2",
        "0010",
        980
       ],
       [
        "2.3.1.5.3.1",
        "0010",
        520
       ],
       [
        "2.3.2.4.2.1",
        "0010",
        1050
       ],
       [
        "2.3.2.1.2.99",
        "0010",
        1200
       ]
      ],
      "as": [
       [
        5,
        "Patrimonial",
        "5301.1501",
        "Compra de bienes - Materiales y útiles de oficina (2.3.1.5.1.2)",
        980,
        0,
        "",
        "2.3.1.5.1.2"
       ],
       [
        5,
        "Patrimonial",
        "5301.1503",
        "Compra de bienes - Aseo, limpieza y tocador (2.3.1.5.3.1)",
        520,
        0,
        "",
        "2.3.1.5.3.1"
       ],
       [
        5,
        "Patrimonial",
        "5302.0402",
        "Contratación de servicios - Mantenimiento de edificaciones y oficinas (2.3.2.4.2.1)",
        1050,
        0,
        "",
        "2.3.2.4.2.1"
       ],
       [
        5,
        "Patrimonial",
        "5302.010299",
        "Viajes domésticos - Otros gastos: movilidad local (2.3.2.1.2.99)",
        1200,
        0,
        "",
        "2.3.2.1.2.99"
       ],
       [
        5,
        "Patrimonial",
        "1101.02",
        "Efectivo - Fondos fijos - Caja chica",
        0,
        3750,
        "Sale del fondo lo gastado"
       ],
       [
        6,
        "Presupuestaria",
        "8301.0201",
        "Presupuesto de gastos - RDR",
        3750,
        0,
        "Reposición: compromiso con clasificadores definitivos"
       ],
       [
        6,
        "Presupuestaria",
        "8401.0201",
        "Asignaciones comprometidas - RDR",
        0,
        3750,
        ""
       ],
       [
        7,
        "Presupuestaria",
        "8401.0201",
        "Asignaciones comprometidas - RDR",
        3750,
        0,
        ""
       ],
       [
        7,
        "Presupuestaria",
        "8601.0201",
        "Ejecución de gastos - RDR",
        0,
        3750,
        "Al 31/12 el saldo del fondo se devuelve con T-6"
       ]
      ]
     },
     {
      "op": "gir",
      "rol": "reposicion",
      "fase": "Girado (reposición)",
      "key": "girRep",
      "ref": "rend",
      "mes": 1,
      "fecha": "30/01/2026",
      "medio": "OPE - ORDEN DE PAGO ELECTRONICA",
      "tipoGiro": "REPOSICION",
      "benef": [
       "DNI",
       "40000001"
      ],
      "docGiro": "OPE Nº 0000031",
      "ret": [],
      "items": [
       [
        "2.3.1.5.1.2",
        "0010",
        980
       ],
       [
        "2.3.1.5.3.1",
        "0010",
        520
       ],
       [
        "2.3.2.4.2.1",
        "0010",
        1050
       ],
       [
        "2.3.2.1.2.99",
        "0010",
        1200
       ]
      ],
      "as": [
       [
        8,
        "Patrimonial",
        "1101.02",
        "Efectivo - Fondos fijos - Caja chica",
        3750,
        0,
        "El fondo vuelve a S/ 5 000,00"
       ],
       [
        8,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes en instituciones financieras - RDR",
        0,
        3750,
        ""
       ]
      ]
     }
    ],
    "controles": [
     [
      "El compromiso anual no supera la certificación",
      "ca",
      [
       "cert"
      ]
     ],
     [
      "El devengado no supera el compromiso mensual",
      "dev",
      [
       "cm"
      ]
     ],
     [
      "El girado (apertura) no supera el devengado",
      "gir:apertura",
      [
       "dev"
      ]
     ],
     [
      "La reposición no supera lo rendido",
      "gir:reposicion",
      [
       "rend"
      ]
     ],
     [
      "Ningún comprobante supera el tope por pago (S/ 1 100,00 = 20 % UIT); la planilla de movilidad agrupa 18 pagos menores",
      "maxcomp",
      1100
     ]
    ],
    "docsFuente": [
     [
      "R.D.A. N.° 012-2026-GRA/ORA",
      "Oficina Regional de Administración",
      "Autoriza la apertura: sustenta certificación, compromiso y devengado de apertura (código 234)"
     ],
     [
      "Orden de Pago Electrónica",
      "Tesorería",
      "Entrega del fondo a la responsable (girado de apertura)"
     ],
     [
      "Facturas F001-000845 y F002-001233",
      "Proveedores",
      "Sustentan los bienes pagados (rendición)"
     ],
     [
      "Boleta B001-000417",
      "Cerrajero",
      "Sustenta el servicio de mantenimiento (rendición)"
     ],
     [
      "Planilla de movilidad local N.° 001-2026 (036)",
      "Responsable / usuarios",
      "Sustenta la movilidad local (rendición)"
     ],
     [
      "Rendición documentada y solicitud de reposición",
      "Responsable de caja chica",
      "Devengado de la rendición y girado de reposición"
     ]
    ],
    "pregunta": "¿Se podría haber pagado con la Caja Chica una factura de S/ 1 500,00? ¿Qué ocurre con el saldo del fondo al 31 de diciembre?",
    "respuesta": "No. El monto máximo por pago es el 20 % de la UIT (S/ 1 100,00, Directiva N.° 003-2024-EF/52.06): una factura de S/ 1 500,00 debe atenderse por el ciclo regular (orden de compra o servicio, compromiso, devengado y girado al proveedor) y no puede fraccionarse. Al cierre del ejercicio la responsable rinde lo gastado y deposita el saldo no utilizado con Papeleta T-6 en la cuenta de la fuente; el fondo se liquida (se rebaja la ejecución no utilizada) y en el año siguiente se aprueba una nueva apertura.",
    "pasos": [
     [
      "Certificados",
      "Certificar S/ 5 000,00 (rubro 09) en los cuatro clasificadores previstos, meta 0010."
     ],
     [
      "Compromiso Anual",
      "Tipo de operación C - Fondo fijo para caja chica, documento 234 (R.D.A.), DNI de la responsable."
     ],
     [
      "Registro SIAF - Compromiso Mensual",
      "Crear expediente con el CA de la apertura."
     ],
     [
      "Registro SIAF - Devengado",
      "Devengado de la apertura (tipo de registro: Normal)."
     ],
     [
      "Registro SIAF - Girado",
      "Giro con OPE a la responsable (MADAF - Giros)."
     ],
     [
      "Registro SIAF - Devengado",
      "Devengado tipo Rendición con los cuatro comprobantes y sus clasificadores."
     ],
     [
      "Registro SIAF - Girado",
      "Giro de reposición por S/ 3 750,00."
     ]
    ]
   },
   {
    "id": "enc",
    "titulo": "Caso 2 · Habilitación y rendición de un Encargo Interno",
    "ff": "1",
    "rubro": "00",
    "meta": "0045",
    "enunciado": [
     "Para el taller descentralizado «Ética en la Función Pública» en Juliaca (12 y 13/03/2026), la Gerencia Regional de Desarrollo Social autoriza con R.G.R. N.° 045-2026-GRA/GRDS del 02/03/2026 un Encargo Interno a favor de Juan Pérez Mamani por S/ 8 000,00 (Recursos Ordinarios): pasajes S/ 2 600,00, alimentación S/ 3 000,00 y material didáctico S/ 2 400,00.",
     "El 17/03/2026 rinde S/ 7 600,00 (pasajes 2 600, alimentación 3 000 y material didáctico 2 000) y devuelve S/ 400,00 en efectivo, depositados con Papeleta T-6."
    ],
    "datos": [
     [
      "Resolución que autoriza el encargo",
      "R.G.R. N.° 045-2026-GRA/GRDS · 02/03/2026"
     ],
     [
      "Encargado",
      "Juan Pérez Mamani · DNI 40000002 (ficticio)"
     ],
     [
      "Monto del encargo",
      "S/ 8 000,00 · Recursos Ordinarios (FF 1 / Rb 00)"
     ],
     [
      "Gasto previsto",
      "Pasajes 2 600,00 · alimentación 3 000,00 · material didáctico 2 400,00"
     ],
     [
      "Entrega del encargo",
      "Girado · 04/03/2026"
     ],
     [
      "Rendición",
      "17/03/2026 · gasto ejecutado S/ 7 600,00"
     ],
     [
      "Detalle ejecutado",
      "Pasajes 2 600,00 · alimentación 3 000,00 · material didáctico 2 000,00"
     ],
     [
      "Devolución del saldo",
      "S/ 400,00 en efectivo · Papeleta T-6 · 17/03/2026"
     ]
    ],
    "ops": [
     {
      "op": "cert",
      "fase": "Certificación",
      "key": "cert",
      "num": 41,
      "mes": 3,
      "fecha": "02/03/2026",
      "doc": [
       "086",
       "Nº 078-2026-GRA/GRDS",
       "02/03/2026"
      ],
      "tipoCert": "OTROS",
      "justif": "ENCARGO INTERNO A FAVOR DE JUAN PEREZ MAMANI PARA EL TALLER DESCENTRALIZADO ETICA EN LA FUNCION PUBLICA, JULIACA 12 Y 13/03/2026, R.G.R. Nº 045-2026-GRA/GRDS",
      "items": [
       [
        "2.3.2.1.2.1",
        "0045",
        2600
       ],
       [
        "2.3.1.1.1.1",
        "0045",
        3000
       ],
       [
        "2.3.1.9.1.2",
        "0045",
        2400
       ]
      ],
      "sin": "Solo reserva el crédito."
     },
     {
      "op": "ca",
      "fase": "Compromiso anual",
      "key": "ca",
      "ref": "cert",
      "num": 74,
      "mes": 3,
      "fecha": "02/03/2026",
      "tipoOp": "A",
      "doc": [
       "234",
       "R.G.R. Nº 045-2026-GRA/GRDS",
       "02/03/2026"
      ],
      "prov": [
       "DNI",
       "40000002"
      ],
      "justif": "ENCARGO INTERNO PARA EL TALLER ETICA EN LA FUNCION PUBLICA, JULIACA, SEGUN R.G.R. Nº 045-2026-GRA/GRDS",
      "items": [
       [
        "2.3.2.1.2.1",
        "0045",
        2600
       ],
       [
        "2.3.1.1.1.1",
        "0045",
        3000
       ],
       [
        "2.3.1.9.1.2",
        "0045",
        2400
       ]
      ],
      "as": [
       [
        1,
        "Presupuestaria",
        "8301.0101",
        "Presupuesto de gastos - Recursos Ordinarios",
        8000,
        0,
        ""
       ],
       [
        1,
        "Presupuestaria",
        "8401.0101",
        "Asignaciones comprometidas - Recursos Ordinarios",
        0,
        8000,
        ""
       ]
      ]
     },
     {
      "op": "cm",
      "fase": "Compromiso mensual",
      "key": "cm",
      "ref": "ca",
      "exp": 322,
      "mes": 3,
      "fecha": "03/03/2026",
      "modalidad": "NA - NO APLICA (PLANILLAS, ENCARGOS, VIATICOS, SENTENCIAS)",
      "tipoProc": "NO APLICA",
      "doc": [
       "234",
       "R.G.R. Nº 045-2026-GRA/GRDS",
       "02/03/2026"
      ],
      "notas": "ENCARGO INTERNO TALLER ETICA EN LA FUNCION PUBLICA - JULIACA",
      "tipoPago": "A - ABONO EN CUENTA",
      "items": [
       [
        "2.3.2.1.2.1",
        "0045",
        2600
       ],
       [
        "2.3.1.1.1.1",
        "0045",
        3000
       ],
       [
        "2.3.1.9.1.2",
        "0045",
        2400
       ]
      ],
      "sin": "Sin asiento contable."
     },
     {
      "op": "dev",
      "rol": "entrega",
      "fase": "Devengado (entrega)",
      "key": "dev",
      "ref": "cm",
      "mes": 3,
      "fecha": "03/03/2026",
      "doc": [
       "234",
       "",
       "R.G.R. 045-2026-GRA/GRDS",
       "02/03/2026"
      ],
      "notas": "DEVENGADO DE LA ENTREGA DEL ENCARGO INTERNO A JUAN PEREZ MAMANI",
      "items": [
       [
        "2.3.2.1.2.1",
        "0045",
        2600
       ],
       [
        "2.3.1.1.1.1",
        "0045",
        3000
       ],
       [
        "2.3.1.9.1.2",
        "0045",
        2400
       ]
      ],
      "as": [
       [
        2,
        "Patrimonial",
        "1205.0302",
        "Entregas a rendir cuenta - Encargos internos",
        8000,
        0,
        "Aún no es gasto: es un anticipo por rendir"
       ],
       [
        2,
        "Patrimonial",
        "2103.0101",
        "Cuentas por pagar - Encargos",
        0,
        8000,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8401.0101",
        "Asignaciones comprometidas - RO",
        8000,
        0,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8601.0101",
        "Ejecución de gastos - RO",
        0,
        8000,
        ""
       ]
      ]
     },
     {
      "op": "gir",
      "rol": "entrega",
      "fase": "Girado (entrega)",
      "key": "gir",
      "ref": "dev",
      "mes": 3,
      "fecha": "04/03/2026",
      "medio": "ABONO EN CUENTA",
      "tipoGiro": "PRINCIPAL",
      "benef": [
       "DNI",
       "40000002"
      ],
      "docGiro": "C/P Nº 0000214",
      "ret": [],
      "items": [
       [
        "2.3.2.1.2.1",
        "0045",
        2600
       ],
       [
        "2.3.1.1.1.1",
        "0045",
        3000
       ],
       [
        "2.3.1.9.1.2",
        "0045",
        2400
       ]
      ],
      "as": [
       [
        4,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios (asignación financiera del Tesoro)",
        8000,
        0,
        "Asiento automático de RO"
       ],
       [
        4,
        "Patrimonial",
        "4401.0101",
        "Traspasos y remesas recibidas - Recursos Ordinarios",
        0,
        8000,
        ""
       ],
       [
        5,
        "Patrimonial",
        "2103.0101",
        "Cuentas por pagar - Encargos",
        8000,
        0,
        ""
       ],
       [
        5,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios",
        0,
        8000,
        "Abono en la cuenta del encargado"
       ]
      ]
     },
     {
      "op": "rend",
      "fase": "Devengado (rendición)",
      "key": "rend",
      "ref": "dev",
      "mes": 3,
      "fecha": "17/03/2026",
      "doc": [
       "OTRO",
       "",
       "RENDICION ENCARGO INTERNO Nº 001-2026",
       "17/03/2026"
      ],
      "notas": "RENDICION DE CUENTAS DEL ENCARGO INTERNO TALLER ETICA EN LA FUNCION PUBLICA",
      "comp": [
       [
        "BOLETOS DE VIAJE",
        "B001-VARIOS",
        "11/03/2026",
        "PASAJES IDA Y VUELTA PUNO - JULIACA",
        "2.3.2.1.2.1",
        2600
       ],
       [
        "FACTURAS",
        "F001-002210/F001-002245",
        "13/03/2026",
        "ALIMENTACION DE PARTICIPANTES",
        "2.3.1.1.1.1",
        3000
       ],
       [
        "FACTURA",
        "F003-000518",
        "10/03/2026",
        "MATERIAL DIDACTICO",
        "2.3.1.9.1.2",
        2000
       ]
      ],
      "items": [
       [
        "2.3.2.1.2.1",
        "0045",
        2600
       ],
       [
        "2.3.1.1.1.1",
        "0045",
        3000
       ],
       [
        "2.3.1.9.1.2",
        "0045",
        2000
       ]
      ],
      "as": [
       [
        6,
        "Patrimonial",
        "5302.010201",
        "Viajes domésticos - Pasajes y gastos de transporte (2.3.2.1.2.1)",
        2600,
        0,
        "",
        "2.3.2.1.2.1"
       ],
       [
        6,
        "Patrimonial",
        "5301.1101",
        "Compra de bienes - Alimentos y bebidas para consumo humano (2.3.1.1.1.1)",
        3000,
        0,
        "",
        "2.3.1.1.1.1"
       ],
       [
        6,
        "Patrimonial",
        "5301.1901",
        "Compra de bienes - Material didáctico y útiles de enseñanza (2.3.1.9.1.2)",
        2000,
        0,
        "",
        "2.3.1.9.1.2"
       ],
       [
        6,
        "Patrimonial",
        "1205.0302",
        "Entregas a rendir cuenta - Encargos internos",
        0,
        7600,
        "La ejecución presupuestaria ya se registró en la entrega"
       ]
      ]
     },
     {
      "op": "t6",
      "fase": "Devolución T-6",
      "key": "t6",
      "ref": "gir",
      "mes": 3,
      "fecha": "17/03/2026",
      "doc": [
       "T6",
       "",
       "0000045",
       "17/03/2026"
      ],
      "notas": "DEVOLUCION DEL SALDO NO UTILIZADO DEL ENCARGO INTERNO (MATERIAL DIDACTICO)",
      "items": [
       [
        "2.3.1.9.1.2",
        "0045",
        400
       ]
      ],
      "as": [
       [
        7,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios",
        400,
        0,
        ""
       ],
       [
        7,
        "Patrimonial",
        "1205.0302",
        "Entregas a rendir cuenta - Encargos internos",
        0,
        400,
        ""
       ],
       [
        8,
        "Presupuestaria",
        "8601.0101",
        "Ejecución de gastos - RO",
        400,
        0,
        "Rebaja de la ejecución por devolución (no es extorno)"
       ],
       [
        8,
        "Presupuestaria",
        "8401.0101",
        "Asignaciones comprometidas - RO",
        0,
        400,
        ""
       ]
      ]
     }
    ],
    "controles": [
     [
      "El compromiso anual no supera la certificación",
      "ca",
      [
       "cert"
      ]
     ],
     [
      "El girado no supera el devengado",
      "gir",
      [
       "dev"
      ]
     ],
     [
      "Lo rendido no supera lo entregado",
      "rend",
      [
       "gir"
      ]
     ],
     [
      "Rendición + devolución = monto entregado",
      "eq",
      [
       "rend",
       "t6"
      ],
      [
       "gir"
      ]
     ]
    ],
    "docsFuente": [
     [
      "R.G.R. N.° 045-2026-GRA/GRDS",
      "Gerencia Regional de Desarrollo Social",
      "Autoriza el encargo: certificación, compromiso y devengado de entrega (234)"
     ],
     [
      "Comprobante de pago / abono en cuenta",
      "Tesorería",
      "Girado de la entrega al encargado"
     ],
     [
      "Boletos de viaje y facturas",
      "Proveedores",
      "Sustentan la rendición por clasificador"
     ],
     [
      "Rendición de cuentas documentada",
      "Encargado",
      "Devengado de la rendición"
     ],
     [
      "Papeleta de depósito T-6",
      "Tesorería / Banco",
      "Acredita la devolución del saldo (S/ 400,00)"
     ]
    ],
    "pregunta": "¿Por qué la rendición, y no la entrega del dinero, es el momento en que se reconoce el gasto por clasificador? Distinga la devolución de un extorno.",
    "respuesta": "Con la entrega la entidad solo transfiere fondos a un servidor que debe rendir cuenta: es un anticipo (1205 Entregas a rendir cuenta), no un consumo de bienes o servicios. El gasto real se conoce cuando el encargado presenta los comprobantes: recién ahí se sabe cuánto se gastó y en qué clasificador (pasajes, alimentación, material didáctico). La devolución con T-6 es un registro nuevo que rebaja la ejecución por el saldo no utilizado; el extorno, en cambio, anula un registro equivocado como si no hubiera existido.",
    "pasos": [
     [
      "Certificados",
      "Certificar S/ 8 000,00 (rubro 00) en 2.3.2.1.2.1, 2.3.1.1.1.1 y 2.3.1.9.1.2, meta 0045."
     ],
     [
      "Compromiso Anual",
      "Tipo A - Encargo interno, documento 234, DNI del encargado."
     ],
     [
      "Registro SIAF - Compromiso Mensual",
      "Expediente del encargo."
     ],
     [
      "Registro SIAF - Devengado",
      "Devengado de la entrega (Normal)."
     ],
     [
      "Registro SIAF - Girado",
      "Abono en cuenta al encargado."
     ],
     [
      "Registro SIAF - Devengado",
      "Devengado tipo Rendición con los comprobantes."
     ],
     [
      "Registro SIAF - Papeleta T-6",
      "Devolución de S/ 400,00."
     ]
    ]
   },
   {
    "id": "sent",
    "titulo": "Caso 3 · Pago de una sentencia judicial en materia previsional",
    "ff": "1",
    "rubro": "00",
    "meta": "0032",
    "enunciado": [
     "La Procuraduría Pública Regional comunica que en el Expediente N.° 00XXX-2023-0-2101-JR-LA-01 (ficticio) la sentencia que ordena pagar al pensionista cesante Pedro Condori Huanca S/ 25 000,00 por pensiones devengadas fue declarada consentida con Resolución N.° 15 del 10/02/2026 (cosa juzgada). La deuda figura en el listado priorizado del Comité Permanente (Ley N.° 30137).",
     "La Oficina Regional de Planeamiento y Presupuesto certifica con Recursos Ordinarios en la genérica 2.2 Pensiones y Otras Prestaciones Sociales. El pago se realiza por abono en la cuenta del beneficiario."
    ],
    "datos": [
     [
      "Expediente judicial",
      "N.° 00XXX-2023-0-2101-JR-LA-01 (ficticio)"
     ],
     [
      "Resolución que declara consentida la sentencia",
      "Resolución N.° 15 · 10/02/2026"
     ],
     [
      "Beneficiario",
      "Pedro Condori Huanca · pensionista · DNI 40000003 (ficticio)"
     ],
     [
      "Monto",
      "S/ 25 000,00 · pensiones devengadas"
     ],
     [
      "Priorización",
      "Listado priorizado del Comité Permanente (Ley N.° 30137)"
     ],
     [
      "Fuente y genérica",
      "Recursos Ordinarios · genérica 2.2"
     ],
     [
      "Clasificador",
      "2.2.1.2.1.1 Pago de sentencias judiciales en calidad de cosa juzgada por adeudos - Pensionistas"
     ],
     [
      "Medio de pago",
      "Abono en cuenta del beneficiario (CCI)"
     ]
    ],
    "ops": [
     {
      "op": "cert",
      "fase": "Certificación",
      "key": "cert",
      "num": 27,
      "mes": 2,
      "fecha": "16/02/2026",
      "doc": [
       "086",
       "Nº 021-2026-GRA/PPR",
       "13/02/2026"
      ],
      "tipoCert": "OTROS",
      "justif": "PAGO DE SENTENCIA JUDICIAL CONSENTIDA, EXP. Nº 00XXX-2023-0-2101-JR-LA-01, RES. Nº 15, PENSIONISTA PEDRO CONDORI HUANCA, LISTADO PRIORIZADO LEY Nº 30137",
      "items": [
       [
        "2.2.1.2.1.1",
        "0032",
        25000
       ]
      ],
      "sin": "Solo reserva el crédito."
     },
     {
      "op": "ca",
      "fase": "Compromiso anual",
      "key": "ca",
      "ref": "cert",
      "num": 72,
      "mes": 2,
      "fecha": "17/02/2026",
      "tipoOp": "OTRO",
      "doc": [
       "234",
       "RES. JUDICIAL Nº 15 - EXP. 00XXX-2023",
       "10/02/2026"
      ],
      "prov": [
       "DNI",
       "40000003"
      ],
      "justif": "TIPO DE OPERACION: PAGO DE SENTENCIA JUDICIAL EN MATERIA PREVISIONAL A FAVOR DE PEDRO CONDORI HUANCA, RES. Nº 15 DEL 10/02/2026",
      "items": [
       [
        "2.2.1.2.1.1",
        "0032",
        25000
       ]
      ],
      "as": [
       [
        1,
        "Presupuestaria",
        "8301.0101",
        "Presupuesto de gastos - Recursos Ordinarios",
        25000,
        0,
        ""
       ],
       [
        1,
        "Presupuestaria",
        "8401.0101",
        "Asignaciones comprometidas - Recursos Ordinarios",
        0,
        25000,
        "Sin cuentas de orden"
       ]
      ]
     },
     {
      "op": "cm",
      "fase": "Compromiso mensual",
      "key": "cm",
      "ref": "ca",
      "exp": 311,
      "mes": 2,
      "fecha": "18/02/2026",
      "modalidad": "NA - NO APLICA (PLANILLAS, ENCARGOS, VIATICOS, SENTENCIAS)",
      "tipoProc": "NO APLICA",
      "doc": [
       "234",
       "RES. JUDICIAL Nº 15 - EXP. 00XXX-2023",
       "10/02/2026"
      ],
      "notas": "PAGO DE SENTENCIA JUDICIAL - PENSIONES DEVENGADAS",
      "tipoPago": "T - TRANSFERENCIA INTERBANCARIA (CCI)",
      "items": [
       [
        "2.2.1.2.1.1",
        "0032",
        25000
       ]
      ],
      "sin": "Sin asiento contable."
     },
     {
      "op": "dev",
      "fase": "Devengado",
      "key": "dev",
      "ref": "cm",
      "mes": 2,
      "fecha": "18/02/2026",
      "doc": [
       "234",
       "",
       "RES. Nº 15 Y LIQUIDACION",
       "10/02/2026"
      ],
      "notas": "DEVENGADO DE LA SENTENCIA CONSENTIDA, REGISTRADA EN EL APLICATIVO DE DEMANDAS JUDICIALES Y ARBITRALES",
      "items": [
       [
        "2.2.1.2.1.1",
        "0032",
        25000
       ]
      ],
      "as": [
       [
        2,
        "Patrimonial",
        "5201.12",
        "Pensiones y prestaciones - Pago de sentencias judiciales a pensionistas",
        25000,
        0,
        "Si la contingencia estaba provisionada (2401), se carga la provisión"
       ],
       [
        2,
        "Patrimonial",
        "2102.01",
        "Obligaciones previsionales por pagar - Pensiones",
        0,
        25000,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8401.0101",
        "Asignaciones comprometidas - RO",
        25000,
        0,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8601.0101",
        "Ejecución de gastos - RO",
        0,
        25000,
        ""
       ]
      ]
     },
     {
      "op": "gir",
      "fase": "Girado",
      "key": "gir",
      "ref": "dev",
      "mes": 2,
      "fecha": "20/02/2026",
      "medio": "TRANSFERENCIA INTERBANCARIA (CCI)",
      "tipoGiro": "PRINCIPAL",
      "benef": [
       "DNI",
       "40000003"
      ],
      "docGiro": "C/P Nº 0000156",
      "ret": [],
      "items": [
       [
        "2.2.1.2.1.1",
        "0032",
        25000
       ]
      ],
      "as": [
       [
        4,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios (asignación financiera del Tesoro)",
        25000,
        0,
        "Asiento automático de RO"
       ],
       [
        4,
        "Patrimonial",
        "4401.0101",
        "Traspasos y remesas recibidas - Recursos Ordinarios",
        0,
        25000,
        ""
       ],
       [
        5,
        "Patrimonial",
        "2102.01",
        "Obligaciones previsionales por pagar - Pensiones",
        25000,
        0,
        ""
       ],
       [
        5,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios",
        0,
        25000,
        "Abono en CCI del beneficiario"
       ]
      ]
     },
     {
      "op": "pag",
      "fase": "Pagado",
      "key": "pag",
      "ref": "gir",
      "mes": 2,
      "fecha": "23/02/2026",
      "notas": "CONFIRMACION DEL ABONO POR EL BANCO DE LA NACION",
      "items": [
       [
        "2.2.1.2.1.1",
        "0032",
        25000
       ]
      ],
      "sin": "El pagado confirma la salida efectiva del dinero; el asiento se registró en el girado."
     }
    ],
    "controles": [
     [
      "El compromiso anual no supera la certificación",
      "ca",
      [
       "cert"
      ]
     ],
     [
      "El devengado no supera el compromiso mensual",
      "dev",
      [
       "cm"
      ]
     ],
     [
      "El girado no supera el devengado",
      "gir",
      [
       "dev"
      ]
     ],
     [
      "El pagado no supera el girado",
      "pag",
      [
       "gir"
      ]
     ]
    ],
    "docsFuente": [
     [
      "Resolución N.° 15 (sentencia consentida, cosa juzgada)",
      "Juzgado laboral",
      "Sustenta la obligación: compromiso y devengado"
     ],
     [
      "Comunicación de la Procuraduría Pública Regional",
      "Procuraduría",
      "Informa el estado procesal"
     ],
     [
      "Listado priorizado del Comité Permanente (Ley N.° 30137)",
      "Comité Permanente",
      "Orden de prelación del pago"
     ],
     [
      "Registro en el aplicativo de demandas judiciales y arbitrales (MEF)",
      "Procuraduría / OGA",
      "Requisito para el devengado de sentencias"
     ],
     [
      "Liquidación de pensiones devengadas",
      "Oficina de RR.HH. / Pensiones",
      "Monto a devengar"
     ],
     [
      "Comprobante de pago y abono en CCI",
      "Tesorería / Banco",
      "Girado y pagado"
     ]
    ],
    "pregunta": "¿Por qué la sentencia se paga con cargo al presupuesto institucional y con qué criterio se prioriza frente a otras deudas judiciales?",
    "respuesta": "Porque el D. Leg. N.° 1440 (art. 73) dispone que los pagos de sentencias en calidad de cosa juzgada se atienden con cargo al presupuesto institucional de cada entidad, priorizando las asignaciones de la propia entidad y sin afectar el cumplimiento de sus metas; no existe un fondo aparte del Tesoro. La Ley N.° 30137 ordena que un Comité Permanente apruebe el listado priorizado con criterios de prelación: primero las deudas de materia laboral, luego previsional, después las de víctimas en actos de defensa del Estado y por último otras; dentro de cada grupo se prioriza por edad (mayores de 65 años), enfermedad grave y menor monto.",
    "pasos": [
     [
      "Certificados",
      "Certificar S/ 25 000,00 en 2.2.1.2.1.1 (meta 0032, RO)."
     ],
     [
      "Compromiso Anual",
      "Tipo OTRO (sentencia), documento 234 (resolución judicial), DNI del pensionista."
     ],
     [
      "Registro SIAF - Compromiso Mensual",
      "Expediente de la sentencia."
     ],
     [
      "Registro SIAF - Devengado",
      "Devengado con la resolución y la liquidación."
     ],
     [
      "Registro SIAF - Girado",
      "Abono en CCI del beneficiario; luego registrar el Pagado."
     ]
    ]
   },
   {
    "id": "cas",
    "titulo": "Caso 4 · Planilla CAS (D. Leg. N.° 1057) - mayo 2026",
    "ff": "1",
    "rubro": "00",
    "meta": "0010",
    "enunciado": [
     "Al cierre de mayo de 2026, Recursos Humanos remite la planilla de 12 trabajadores CAS de la meta «Gestión Administrativa», con cargo a Recursos Ordinarios. Retribución bruta: S/ 41 325,00.",
     "Retenciones previsionales: ONP S/ 1 560,00 (4 trabajadores) y AFP S/ 3 765,00 (8 trabajadores); sin retención de Impuesto a la Renta. Neto a pagar S/ 36 000,00. EsSalud de cargo de la entidad S/ 3 675,00: costo total S/ 45 000,00."
    ],
    "datos": [
     [
      "Periodo y meta",
      "Mayo 2026 · «Gestión Administrativa» · 12 trabajadores CAS"
     ],
     [
      "Retribución bruta",
      "S/ 41 325,00 · 2.1.1.13.1.1 CAS - Indeterminado"
     ],
     [
      "Retención ONP (4 trabajadores)",
      "S/ 1 560,00"
     ],
     [
      "Retención AFP (8 trabajadores)",
      "S/ 3 765,00"
     ],
     [
      "Retención Impuesto a la Renta",
      "S/ 0,00"
     ],
     [
      "Pago neto a trabajadores",
      "S/ 36 000,00"
     ],
     [
      "EsSalud (cargo de la entidad)",
      "S/ 3 675,00 · 2.1.3.1.1.15 Contribuciones a EsSalud de CAS"
     ],
     [
      "Costo total de la planilla",
      "S/ 45 000,00"
     ]
    ],
    "nota": "En el Clasificador de Gastos 2026 el CAS está en la genérica 2.1 (2.1.1.13.1.1 indeterminado / 2.1.1.13.1.2 transitorio) y la contribución a EsSalud en 2.1.3.1.1.15.",
    "ops": [
     {
      "op": "cert",
      "fase": "Certificación",
      "key": "cert",
      "num": 52,
      "mes": 5,
      "fecha": "26/05/2026",
      "doc": [
       "086",
       "Nº 210-2026-GRA/ORA-ORH",
       "25/05/2026"
      ],
      "tipoCert": "OTROS",
      "justif": "PLANILLA CAS MAYO 2026, 12 TRABAJADORES, META GESTION ADMINISTRATIVA, D.LEG. Nº 1057",
      "items": [
       [
        "2.1.1.13.1.1",
        "0010",
        41325
       ],
       [
        "2.1.3.1.1.15",
        "0010",
        3675
       ]
      ],
      "sin": "Solo reserva el crédito."
     },
     {
      "op": "ca",
      "fase": "Compromiso anual",
      "key": "ca",
      "ref": "cert",
      "num": 75,
      "mes": 5,
      "fecha": "26/05/2026",
      "tipoOp": "OTRO",
      "doc": [
       "232",
       "RESUMEN CAS MAYO 2026",
       "26/05/2026"
      ],
      "prov": [
       "RUC",
       "20999999992"
      ],
      "justif": "TIPO DE OPERACION: PLANILLA CAS MAYO 2026 DE 12 TRABAJADORES, RETRIBUCION Y CONTRIBUCION A ESSALUD",
      "items": [
       [
        "2.1.1.13.1.1",
        "0010",
        41325
       ],
       [
        "2.1.3.1.1.15",
        "0010",
        3675
       ]
      ],
      "as": [
       [
        1,
        "Presupuestaria",
        "8301.0101",
        "Presupuesto de gastos - Recursos Ordinarios",
        45000,
        0,
        ""
       ],
       [
        1,
        "Presupuestaria",
        "8401.0101",
        "Asignaciones comprometidas - Recursos Ordinarios",
        0,
        45000,
        ""
       ]
      ]
     },
     {
      "op": "cm",
      "fase": "Compromiso mensual",
      "key": "cm",
      "ref": "ca",
      "exp": 356,
      "mes": 5,
      "fecha": "27/05/2026",
      "modalidad": "NA - NO APLICA (PLANILLAS, ENCARGOS, VIATICOS, SENTENCIAS)",
      "tipoProc": "NO APLICA",
      "doc": [
       "232",
       "RESUMEN CAS MAYO 2026",
       "26/05/2026"
      ],
      "notas": "PLANILLA CAS MAYO 2026 - 12 TRABAJADORES",
      "tipoPago": "A - ABONO EN CUENTA",
      "items": [
       [
        "2.1.1.13.1.1",
        "0010",
        41325
       ],
       [
        "2.1.3.1.1.15",
        "0010",
        3675
       ]
      ],
      "sin": "Sin asiento contable."
     },
     {
      "op": "dev",
      "fase": "Devengado",
      "key": "dev",
      "ref": "cm",
      "mes": 5,
      "fecha": "29/05/2026",
      "doc": [
       "OTRO",
       "",
       "PLANILLA UNICA DE PAGO CAS Nº 05-2026",
       "29/05/2026"
      ],
      "notas": "DEVENGADO DE LA PLANILLA CAS MAYO 2026: BRUTO 41,325.00, ONP 1,560.00, AFP 3,765.00, NETO 36,000.00, ESSALUD 3,675.00",
      "items": [
       [
        "2.1.1.13.1.1",
        "0010",
        41325
       ],
       [
        "2.1.3.1.1.15",
        "0010",
        3675
       ]
      ],
      "as": [
       [
        2,
        "Patrimonial",
        "5101.1301",
        "Gastos de personal - Contrato administrativo de servicios (2.1.1.13.1.1)",
        41325,
        0,
        "",
        "2.1.1.13.1.1"
       ],
       [
        2,
        "Patrimonial",
        "5101.3115",
        "Obligaciones del empleador - Contribuciones a EsSalud de CAS (2.1.3.1.1.15)",
        3675,
        0,
        "",
        "2.1.3.1.1.15"
       ],
       [
        2,
        "Patrimonial",
        "2101.0103",
        "Retribuciones por pagar - CAS (neto)",
        0,
        36000,
        ""
       ],
       [
        2,
        "Patrimonial",
        "2103.0401",
        "Retenciones por pagar - ONP",
        0,
        1560,
        ""
       ],
       [
        2,
        "Patrimonial",
        "2103.0402",
        "Retenciones por pagar - AFP",
        0,
        3765,
        ""
       ],
       [
        2,
        "Patrimonial",
        "2103.0403",
        "Contribuciones por pagar - EsSalud",
        0,
        3675,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8401.0101",
        "Asignaciones comprometidas - RO",
        45000,
        0,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8601.0101",
        "Ejecución de gastos - RO",
        0,
        45000,
        ""
       ]
      ]
     },
     {
      "op": "gir",
      "rol": "trabajadores",
      "fase": "Girado (trabajadores)",
      "key": "g1",
      "ref": "dev",
      "mes": 5,
      "fecha": "29/05/2026",
      "medio": "ABONO EN CUENTA",
      "tipoGiro": "PRINCIPAL",
      "benef": [
       "RUC",
       "20999999992"
      ],
      "docGiro": "C/P Nº 0000498",
      "ret": [],
      "items": [
       [
        "2.1.1.13.1.1",
        "0010",
        36000
       ]
      ],
      "as": [
       [
        4,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios (asignación financiera del Tesoro)",
        36000,
        0,
        "Asiento automático de RO"
       ],
       [
        4,
        "Patrimonial",
        "4401.0101",
        "Traspasos y remesas recibidas - Recursos Ordinarios",
        0,
        36000,
        ""
       ],
       [
        5,
        "Patrimonial",
        "2101.0103",
        "Retribuciones por pagar - CAS",
        36000,
        0,
        ""
       ],
       [
        5,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios",
        0,
        36000,
        "Abono en cuenta de los 12 trabajadores"
       ]
      ]
     },
     {
      "op": "gir",
      "rol": "sunat",
      "fase": "Girado (ONP y EsSalud - SUNAT)",
      "key": "g2",
      "ref": "dev",
      "mes": 6,
      "fecha": "12/06/2026",
      "medio": "TRANSFERENCIA A SUNAT (PDT PLAME)",
      "tipoGiro": "SECUNDARIO",
      "benef": [
       "RUC",
       "20131312955"
      ],
      "docGiro": "PDT PLAME 0601 - MAYO 2026",
      "ret": [],
      "items": [
       [
        "2.1.1.13.1.1",
        "0010",
        1560
       ],
       [
        "2.1.3.1.1.15",
        "0010",
        3675
       ]
      ],
      "as": [
       [
        6,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios (asignación financiera del Tesoro)",
        5235,
        0,
        "Asiento automático de RO"
       ],
       [
        6,
        "Patrimonial",
        "4401.0101",
        "Traspasos y remesas recibidas - Recursos Ordinarios",
        0,
        5235,
        ""
       ],
       [
        7,
        "Patrimonial",
        "2103.0401",
        "Retenciones por pagar - ONP",
        1560,
        0,
        ""
       ],
       [
        7,
        "Patrimonial",
        "2103.0403",
        "Contribuciones por pagar - EsSalud",
        3675,
        0,
        ""
       ],
       [
        7,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios",
        0,
        5235,
        "Pago vía SUNAT"
       ]
      ]
     },
     {
      "op": "gir",
      "rol": "afp",
      "fase": "Girado (AFP)",
      "key": "g3",
      "ref": "dev",
      "mes": 6,
      "fecha": "05/06/2026",
      "medio": "TRANSFERENCIA A AFP (AFPnet)",
      "tipoGiro": "SECUNDARIO",
      "benef": [
       "RUC",
       "20999999993"
      ],
      "docGiro": "PLANILLA AFPnet MAYO 2026",
      "ret": [],
      "items": [
       [
        "2.1.1.13.1.1",
        "0010",
        3765
       ]
      ],
      "as": [
       [
        8,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios (asignación financiera del Tesoro)",
        3765,
        0,
        "Asiento automático de RO"
       ],
       [
        8,
        "Patrimonial",
        "4401.0101",
        "Traspasos y remesas recibidas - Recursos Ordinarios",
        0,
        3765,
        ""
       ],
       [
        9,
        "Patrimonial",
        "2103.0402",
        "Retenciones por pagar - AFP",
        3765,
        0,
        ""
       ],
       [
        9,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Ordinarios",
        0,
        3765,
        "Pago vía AFPnet"
       ]
      ]
     }
    ],
    "controles": [
     [
      "El compromiso anual no supera la certificación",
      "ca",
      [
       "cert"
      ]
     ],
     [
      "El devengado no supera el compromiso mensual",
      "dev",
      [
       "cm"
      ]
     ],
     [
      "Los tres giros no superan el devengado",
      "gir",
      [
       "dev"
      ]
     ],
     [
      "Neto + ONP + AFP + EsSalud = costo total",
      "eq",
      [
       "gir"
      ],
      [
       "dev"
      ]
     ]
    ],
    "docsFuente": [
     [
      "Resumen anualizado de retribuciones CAS (232)",
      "Oficina de Recursos Humanos",
      "Compromiso anual"
     ],
     [
      "Planilla única de pago CAS mayo 2026",
      "Oficina de Recursos Humanos",
      "Devengado (bruto, retenciones, neto, EsSalud)"
     ],
     [
      "Contratos CAS (D. Leg. N.° 1057)",
      "Entidad y trabajadores",
      "Vínculo contractual"
     ],
     [
      "PDT PLAME (formulario 0601)",
      "SUNAT",
      "Giro secundario de ONP y EsSalud"
     ],
     [
      "Planilla AFPnet",
      "AFP",
      "Giro secundario de aportes AFP"
     ],
     [
      "Comprobante de pago / abono en cuenta",
      "Tesorería",
      "Giro principal a los trabajadores"
     ]
    ],
    "pregunta": "¿Por qué EsSalud es un gasto de la entidad y las retenciones ONP/AFP no lo son?",
    "respuesta": "EsSalud (9 % de la retribución) es una contribución que la ley pone a cargo del empleador: la entidad la paga con sus recursos y la registra en su propio clasificador (2.1.3.1.1.15), por eso aumenta el costo de la planilla a S/ 45 000,00. ONP y AFP son aportes del trabajador: forman parte de su retribución bruta (2.1.1.13.1.1) y la entidad solo los retiene y los entrega a SUNAT/AFP como agente retenedor; no son un gasto adicional, solo un pasivo temporal (2103.04) hasta su giro.",
    "pasos": [
     [
      "Certificados",
      "Certificar S/ 45 000,00: 2.1.1.13.1.1 (41 325) y 2.1.3.1.1.15 (3 675), meta 0010, RO."
     ],
     [
      "Compromiso Anual",
      "Documento 232 Resumen anualizado CAS."
     ],
     [
      "Registro SIAF - Compromiso Mensual",
      "Expediente de la planilla de mayo."
     ],
     [
      "Registro SIAF - Devengado",
      "Devengado de la planilla."
     ],
     [
      "Registro SIAF - Girado",
      "Giro principal (36 000) y giros secundarios SUNAT (5 235) y AFP (3 765)."
     ]
    ]
   }
  ]
 },
 "cp2b": {
  "grupo": "Caso Práctico 2",
  "titulo": "Caso 5 · Municipalidad Provincial de Lago Azul - Recaudación de tributos municipales",
  "corto": "CP2 · M.P. Lago Azul (Caso 5)",
  "anio": 2026,
  "nivel": "GL",
  "entidad": {
   "pliego": "301999",
   "pliegoNom": "MUNICIPALIDAD PROVINCIAL DE LAGO AZUL (ENTIDAD FICTICIA)",
   "ue": "301999",
   "ueNom": "MUNICIPALIDAD PROVINCIAL DE LAGO AZUL",
   "secEjec": "301999",
   "ruc": "20999999994",
   "depto": "21 PUNO",
   "prov": "99 LAGO AZUL",
   "dir": "Ficticia"
  },
  "metas": [
   {
    "sec": "0001",
    "cadena": "9001 · 3999999 · 5000003 · 03 · 006 · 0008",
    "nombre": "GESTION ADMINISTRATIVA",
    "cat": "9001",
    "prod": "3999999",
    "act": "5000003",
    "fn": "03",
    "div": "006",
    "grp": "0008"
   }
  ],
  "pim": [
   [
    "0001",
    "08",
    "2.3.2.7.11.99",
    30000
   ],
   [
    "0001",
    "09",
    "2.3.1.5.1.2",
    10000
   ]
  ],
  "pia": [
   [
    "08",
    "1.1.2.1.1.1",
    950000
   ],
   [
    "09",
    "1.3.3.9.2.23",
    180000
   ],
   [
    "09",
    "1.3.3.9.2.27",
    95000
   ]
  ],
  "proveedores": [
   [
    "DNI",
    "40000005",
    "CONTRIBUYENTES VARIOS (VENTANILLA)"
   ]
  ],
  "seq": {
   "cert": 10,
   "ca": 10,
   "exp": 10,
   "ing": 140,
   "mod": 5
  },
  "subcasos": [
   {
    "id": "trib",
    "titulo": "Caso 5 · Recaudación de tributos municipales",
    "ff": "5",
    "rubro": "08",
    "ingreso": true,
    "enunciado": [
     "El 14/04/2026 la caja de la Municipalidad Provincial de Lago Azul cobra en ventanilla S/ 18 500,00 por Impuesto Predial y S/ 4 200,00 por Arbitrios (limpieza pública S/ 2 700,00 y parques y jardines S/ 1 500,00). Cobra S/ 15 900,00 en efectivo y S/ 6 800,00 en cheques; el banco confirma los cheques el 15/04/2026.",
     "El 15/04/2026 deposita lo recaudado. El Impuesto Predial es impuesto municipal (rubro 08); los arbitrios son tasas y van a Recursos Directamente Recaudados (rubro 09)."
    ],
    "datos": [
     [
      "Fecha de cobro",
      "14/04/2026 · recibos de caja de ventanilla"
     ],
     [
      "Impuesto Predial",
      "S/ 18 500,00 · FF 5 / rubro 08 · 1.1.2.1.1.1 Predial"
     ],
     [
      "Arbitrios - limpieza pública",
      "S/ 2 700,00 · FF 2 / rubro 09 · 1.3.3.9.2.23"
     ],
     [
      "Arbitrios - parques y jardines",
      "S/ 1 500,00 · FF 2 / rubro 09 · 1.3.3.9.2.27"
     ],
     [
      "Medios de cobro",
      "Efectivo S/ 15 900,00 · cheques S/ 6 800,00"
     ],
     [
      "Confirmación de cheques y depósito",
      "15/04/2026 · vouchers de depósito"
     ]
    ],
    "ops": [
     {
      "op": "det",
      "fase": "Determinado (predial)",
      "key": "det1",
      "num": 141,
      "mes": 4,
      "fecha": "14/04/2026",
      "ff": "5",
      "rubro": "08",
      "doc": [
       "RI",
       "0001",
       "00012450",
       "14/04/2026"
      ],
      "notas": "COBRO DE IMPUESTO PREDIAL EN VENTANILLA DEL 14/04/2026 SEGUN RECIBOS DE CAJA 0001-00012450 AL 0001-00012610",
      "tipoPago": "E - EFECTIVO",
      "items": [
       [
        "1.1.2.1.1.1",
        "",
        18500
       ]
      ],
      "as": [
       [
        1,
        "Patrimonial",
        "1202.01",
        "Cuentas por cobrar - Impuestos y contribuciones (predial)",
        18500,
        0,
        "Nace el derecho de cobro"
       ],
       [
        1,
        "Patrimonial",
        "4101.02",
        "Impuestos a la propiedad - Predial (1.1.2.1.1.1)",
        0,
        18500,
        ""
       ]
      ]
     },
     {
      "op": "rec",
      "fase": "Recaudado (predial)",
      "key": "rec1",
      "ref": "det1",
      "mes": 4,
      "fecha": "15/04/2026",
      "doc": [
       "VD",
       "",
       "0458712",
       "15/04/2026"
      ],
      "notas": "DEPOSITO DE LO RECAUDADO POR IMPUESTO PREDIAL (EFECTIVO Y CHEQUES CONFIRMADOS EL 15/04/2026)",
      "items": [
       [
        "1.1.2.1.1.1",
        "",
        18500
       ]
      ],
      "as": [
       [
        2,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Impuestos municipales",
        18500,
        0,
        "Cheques: recaudados al confirmarse (15/04)"
       ],
       [
        2,
        "Patrimonial",
        "1202.01",
        "Cuentas por cobrar - Impuestos y contribuciones",
        0,
        18500,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8501.0503",
        "Ejecución de ingresos - Impuestos municipales",
        18500,
        0,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8201.0503",
        "Presupuesto de ingresos - Impuestos municipales",
        0,
        18500,
        ""
       ]
      ]
     },
     {
      "op": "det",
      "fase": "Determinado (arbitrios)",
      "key": "det2",
      "num": 142,
      "mes": 4,
      "fecha": "14/04/2026",
      "ff": "2",
      "rubro": "09",
      "doc": [
       "RI",
       "0002",
       "00004310",
       "14/04/2026"
      ],
      "notas": "COBRO DE ARBITRIOS MUNICIPALES (LIMPIEZA PUBLICA Y PARQUES Y JARDINES) EN VENTANILLA DEL 14/04/2026",
      "tipoPago": "E - EFECTIVO",
      "items": [
       [
        "1.3.3.9.2.23",
        "",
        2700
       ],
       [
        "1.3.3.9.2.27",
        "",
        1500
       ]
      ],
      "as": [
       [
        4,
        "Patrimonial",
        "1202.03",
        "Cuentas por cobrar - Venta de bienes y servicios y derechos administrativos",
        4200,
        0,
        ""
       ],
       [
        4,
        "Patrimonial",
        "4303.0923",
        "Venta de servicios - Limpieza pública (1.3.3.9.2.23)",
        0,
        2700,
        "",
        "1.3.3.9.2.23"
       ],
       [
        4,
        "Patrimonial",
        "4303.0927",
        "Venta de servicios - Parques y jardines (1.3.3.9.2.27)",
        0,
        1500,
        "",
        "1.3.3.9.2.27"
       ]
      ]
     },
     {
      "op": "rec",
      "fase": "Recaudado (arbitrios)",
      "key": "rec2",
      "ref": "det2",
      "mes": 4,
      "fecha": "15/04/2026",
      "doc": [
       "VD",
       "",
       "0458713",
       "15/04/2026"
      ],
      "notas": "DEPOSITO DE LO RECAUDADO POR ARBITRIOS MUNICIPALES",
      "items": [
       [
        "1.3.3.9.2.23",
        "",
        2700
       ],
       [
        "1.3.3.9.2.27",
        "",
        1500
       ]
      ],
      "as": [
       [
        5,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Recursos Directamente Recaudados",
        4200,
        0,
        ""
       ],
       [
        5,
        "Patrimonial",
        "1202.03",
        "Cuentas por cobrar - Venta de bienes y servicios",
        0,
        4200,
        ""
       ],
       [
        6,
        "Presupuestaria",
        "8501.0201",
        "Ejecución de ingresos - RDR",
        4200,
        0,
        ""
       ],
       [
        6,
        "Presupuestaria",
        "8201.0201",
        "Presupuesto de ingresos - RDR",
        0,
        4200,
        ""
       ]
      ]
     }
    ],
    "controles": [
     [
      "Lo recaudado no supera lo determinado (predial)",
      "rec#0",
      [
       "det#0"
      ]
     ],
     [
      "Lo recaudado no supera lo determinado (arbitrios)",
      "rec#1",
      [
       "det#1"
      ]
     ]
    ],
    "docsFuente": [
     [
      "Recibos de caja de ventanilla",
      "Caja municipal",
      "Sustentan el determinado (derecho de cobro) de cada concepto"
     ],
     [
      "Reporte diario de recaudación",
      "Tesorería",
      "Totaliza los cobros por clasificador y medio de pago"
     ],
     [
      "Confirmación de cheques",
      "Banco",
      "Fecha en que los cheques se consideran recaudados"
     ],
     [
      "Vouchers de depósito",
      "Banco",
      "Sustentan el recaudado y el depósito en la cuenta de cada fuente"
     ]
    ],
    "pregunta": "¿Por qué los arbitrios no se registran como Impuestos Municipales? ¿En qué fecha se consideran recaudados los cheques?",
    "respuesta": "Porque el TUO de la Ley de Tributación Municipal (D.S. N.° 156-2004-EF) distingue impuestos (tributo sin contraprestación directa, como el Predial: rubro 08 Impuestos Municipales, FF 5) de tasas: los arbitrios son tasas que se pagan por la prestación o mantenimiento de un servicio público individualizado (limpieza pública, parques y jardines), por eso se clasifican en 1.3.3 Venta de servicios y se registran en rubro 09 RDR (FF 2). Los cheques se consideran recaudados cuando el banco los confirma y se hacen efectivos: el 15/04/2026.",
    "pasos": [
     [
      "Registro SIAF - Determinado",
      "MA-7 V: Crear expediente, FF 5 rubro 08, documento A (recibo), clasificador 1.1.2.1.1.1 por S/ 18 500,00. Grabar › Enviar."
     ],
     [
      "Registro SIAF - Determinado",
      "Insertar Recaudado con el voucher de depósito del 15/04/2026."
     ],
     [
      "Registro SIAF - Determinado",
      "Otro expediente FF 2 rubro 09: 1.3.3.9.2.23 (2 700) y 1.3.3.9.2.27 (1 500); luego su recaudado."
     ]
    ]
   }
  ]
 },
 "cp2c": {
  "grupo": "Caso Práctico 2",
  "titulo": "Caso 6 · Universidad Nacional Andina del Sur - Tasas educativas y venta de publicaciones (RDR)",
  "corto": "CP2 · U.N. Andina del Sur (Caso 6)",
  "anio": 2026,
  "nivel": "GN",
  "entidad": {
   "pliego": "599",
   "pliegoNom": "UNIVERSIDAD NACIONAL ANDINA DEL SUR (ENTIDAD FICTICIA)",
   "ue": "001",
   "ueNom": "UNIVERSIDAD NACIONAL ANDINA DEL SUR",
   "secEjec": "001999",
   "ruc": "20999999995",
   "depto": "21 PUNO",
   "prov": "01 PUNO",
   "dir": "Ficticia"
  },
  "metas": [
   {
    "sec": "0001",
    "cadena": "9001 · 3999999 · 5000003 · 03 · 006 · 0008",
    "nombre": "GESTION ADMINISTRATIVA",
    "cat": "9001",
    "prod": "3999999",
    "act": "5000003",
    "fn": "03",
    "div": "006",
    "grp": "0008"
   }
  ],
  "pim": [
   [
    "0001",
    "09",
    "2.3.1.5.1.2",
    15000
   ]
  ],
  "pia": [
   [
    "09",
    "1.3.2.3.1.7",
    220000
   ],
   [
    "09",
    "1.3.1.5.1.1",
    60000
   ]
  ],
  "proveedores": [
   [
    "DNI",
    "40000006",
    "ESTUDIANTES Y CLIENTES VARIOS"
   ]
  ],
  "seq": {
   "cert": 10,
   "ca": 10,
   "exp": 10,
   "ing": 210,
   "mod": 5
  },
  "subcasos": [
   {
    "id": "tasas",
    "titulo": "Caso 6 · Tasas educativas y venta de publicaciones",
    "ff": "2",
    "rubro": "09",
    "ingreso": true,
    "enunciado": [
     "Entre el 03 y el 07/08/2026 la cuenta recaudadora de la universidad en el Banco de la Nación recibe S/ 35 000,00 por derechos de matrícula 2026-II (700 estudiantes × S/ 50,00) y S/ 12 000,00 por la venta de 240 publicaciones de su fondo editorial (S/ 50,00 cada una), con cargo a Recursos Directamente Recaudados.",
     "Tesorería concilia los abonos con el extracto bancario y los reportes de recaudación, y emite los recibos de ingreso."
    ],
    "datos": [
     [
      "Periodo de recaudación",
      "03/08/2026 - 07/08/2026 · cuenta recaudadora BN"
     ],
     [
      "Derechos de matrícula 2026-II",
      "700 × S/ 50,00 = S/ 35 000,00 · 1.3.2.3.1.7 Matrículas"
     ],
     [
      "Venta de publicaciones",
      "240 × S/ 50,00 = S/ 12 000,00 · 1.3.1.5.1.1 Venta de publicaciones"
     ],
     [
      "Total recaudado",
      "S/ 47 000,00 · RDR (FF 2 / Rb 09)"
     ],
     [
      "Sustento",
      "Extracto bancario, reporte de recaudación y recibos de ingreso"
     ]
    ],
    "ops": [
     {
      "op": "det",
      "fase": "Determinado (matrícula)",
      "key": "det1",
      "num": 211,
      "mes": 8,
      "fecha": "07/08/2026",
      "ff": "2",
      "rubro": "09",
      "doc": [
       "RI",
       "0001",
       "00002301",
       "07/08/2026"
      ],
      "notas": "DERECHOS DE MATRICULA 2026-II, 700 ESTUDIANTES X S/ 50.00, ABONOS DEL 03 AL 07/08/2026 EN LA CUENTA RECAUDADORA BN",
      "tipoPago": "A - ABONO EN CUENTA",
      "items": [
       [
        "1.3.2.3.1.7",
        "",
        35000
       ]
      ],
      "as": [
       [
        1,
        "Patrimonial",
        "1202.03",
        "Cuentas por cobrar - Venta de bienes y servicios y derechos administrativos",
        35000,
        0,
        ""
       ],
       [
        1,
        "Patrimonial",
        "4302.03",
        "Derechos administrativos de educación - Matrículas (1.3.2.3.1.7)",
        0,
        35000,
        "Tasa"
       ]
      ]
     },
     {
      "op": "rec",
      "fase": "Recaudado (matrícula)",
      "key": "rec1",
      "ref": "det1",
      "mes": 8,
      "fecha": "07/08/2026",
      "doc": [
       "EB",
       "",
       "EXTRACTO BN 03-07/08/2026",
       "07/08/2026"
      ],
      "notas": "RECAUDADO SEGUN EXTRACTO BANCARIO Y REPORTE DE RECAUDACION",
      "items": [
       [
        "1.3.2.3.1.7",
        "",
        35000
       ]
      ],
      "as": [
       [
        2,
        "Patrimonial",
        "1101.0301",
        "Cuenta recaudadora BN - Recursos Directamente Recaudados",
        35000,
        0,
        ""
       ],
       [
        2,
        "Patrimonial",
        "1202.03",
        "Cuentas por cobrar - Venta de bienes y servicios y derechos administrativos",
        0,
        35000,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8501.0201",
        "Ejecución de ingresos - RDR",
        35000,
        0,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8201.0201",
        "Presupuesto de ingresos - RDR",
        0,
        35000,
        ""
       ]
      ]
     },
     {
      "op": "det",
      "fase": "Determinado (publicaciones)",
      "key": "det2",
      "num": 212,
      "mes": 8,
      "fecha": "07/08/2026",
      "ff": "2",
      "rubro": "09",
      "doc": [
       "RI",
       "0001",
       "00002302",
       "07/08/2026"
      ],
      "notas": "VENTA DE 240 EJEMPLARES DE PUBLICACIONES CIENTIFICAS DEL FONDO EDITORIAL A S/ 50.00",
      "tipoPago": "A - ABONO EN CUENTA",
      "items": [
       [
        "1.3.1.5.1.1",
        "",
        12000
       ]
      ],
      "as": [
       [
        4,
        "Patrimonial",
        "1202.03",
        "Cuentas por cobrar - Venta de bienes y servicios y derechos administrativos",
        12000,
        0,
        ""
       ],
       [
        4,
        "Patrimonial",
        "4301.05",
        "Venta de bienes - Productos de educación: publicaciones (1.3.1.5.1.1)",
        0,
        12000,
        "Venta de bienes"
       ]
      ]
     },
     {
      "op": "rec",
      "fase": "Recaudado (publicaciones)",
      "key": "rec2",
      "ref": "det2",
      "mes": 8,
      "fecha": "07/08/2026",
      "doc": [
       "EB",
       "",
       "EXTRACTO BN 03-07/08/2026",
       "07/08/2026"
      ],
      "notas": "RECAUDADO SEGUN EXTRACTO BANCARIO Y REPORTE DE RECAUDACION",
      "items": [
       [
        "1.3.1.5.1.1",
        "",
        12000
       ]
      ],
      "as": [
       [
        5,
        "Patrimonial",
        "1101.0301",
        "Cuenta recaudadora BN - Recursos Directamente Recaudados",
        12000,
        0,
        ""
       ],
       [
        5,
        "Patrimonial",
        "1202.03",
        "Cuentas por cobrar - Venta de bienes y servicios y derechos administrativos",
        0,
        12000,
        ""
       ],
       [
        6,
        "Presupuestaria",
        "8501.0201",
        "Ejecución de ingresos - RDR",
        12000,
        0,
        ""
       ],
       [
        6,
        "Presupuestaria",
        "8201.0201",
        "Presupuesto de ingresos - RDR",
        0,
        12000,
        ""
       ]
      ]
     }
    ],
    "controles": [
     [
      "Lo recaudado no supera lo determinado (matrícula)",
      "rec#0",
      [
       "det#0"
      ]
     ],
     [
      "Lo recaudado no supera lo determinado (publicaciones)",
      "rec#1",
      [
       "det#1"
      ]
     ]
    ],
    "docsFuente": [
     [
      "Extracto bancario de la cuenta recaudadora BN",
      "Banco de la Nación",
      "Acredita los abonos (recaudado)"
     ],
     [
      "Reporte de recaudación",
      "Tesorería",
      "Detalla los abonos por concepto"
     ],
     [
      "Recibos de ingreso",
      "Tesorería",
      "Sustentan el determinado de cada concepto"
     ],
     [
      "TUPA / tarifario de la universidad",
      "Universidad",
      "Fija el derecho de matrícula y el precio de las publicaciones"
     ]
    ],
    "pregunta": "¿Por qué la matrícula y la venta de publicaciones se registran en clasificadores de ingreso distintos dentro de la misma genérica?",
    "respuesta": "Ambos son ingresos de la genérica 1.3 Venta de bienes y servicios y derechos administrativos, pero tienen naturaleza distinta. La matrícula es un derecho administrativo (tasa) que se paga por un procedimiento a cargo de la universidad: 1.3.2 Derechos y tasas administrativos › 1.3.2.3.1.7 Matrículas. Las publicaciones son bienes que la universidad vende de su fondo editorial: 1.3.1 Venta de bienes › 1.3.1.5.1.1 Venta de publicaciones. Separarlos permite medir cuánto se recauda por tasas y cuánto por ventas, y cada uno se contabiliza en una cuenta de ingreso distinta (4302 y 4301).",
    "pasos": [
     [
      "Registro SIAF - Determinado",
      "Crear expediente FF 2 rubro 09, clasificador 1.3.2.3.1.7 por S/ 35 000,00 y su recaudado."
     ],
     [
      "Registro SIAF - Determinado",
      "Crear expediente con 1.3.1.5.1.1 por S/ 12 000,00 y su recaudado."
     ]
    ]
   }
  ]
 },
 "cp3": {
  "grupo": "Caso Práctico 3",
  "titulo": "Viáticos y pasajes del Gerente de Infraestructura - Municipalidad Provincial",
  "corto": "CP3 · Viáticos Municipalidad Provincial",
  "anio": 2026,
  "nivel": "GL",
  "entidad": {
   "pliego": "301998",
   "pliegoNom": "MUNICIPALIDAD PROVINCIAL (CASO VIATICOS)",
   "ue": "301998",
   "ueNom": "MUNICIPALIDAD PROVINCIAL",
   "secEjec": "301998",
   "ruc": "20999999996",
   "depto": "21 PUNO",
   "prov": "01 PUNO",
   "dir": "Puno"
  },
  "metas": [
   {
    "sec": "0022",
    "cadena": "9001 · 3999999 · 5000003 · 03 · 006 · 0008",
    "nombre": "GESTION ADMINISTRATIVA",
    "cat": "9001",
    "prod": "3999999",
    "act": "5000003",
    "fn": "03",
    "div": "006",
    "grp": "0008"
   }
  ],
  "pim": [
   [
    "0022",
    "07",
    "2.3.2.1.2.1",
    12000
   ],
   [
    "0022",
    "07",
    "2.3.2.1.2.2",
    18000
   ],
   [
    "0022",
    "07",
    "2.3.2.1.2.99",
    3000
   ],
   [
    "0022",
    "07",
    "2.3.1.5.1.2",
    6000
   ]
  ],
  "proveedores": [
   [
    "DNI",
    "40000004",
    "MENDOZA CARLOS (GERENTE DE INFRAESTRUCTURA - FICTICIO)"
   ]
  ],
  "seq": {
   "cert": 830,
   "ca": 120,
   "exp": 1260,
   "ing": 10,
   "mod": 10
  },
  "subcasos": [
   {
    "id": "via",
    "titulo": "Rendición de viáticos y pasajes - comisión a Lima (3 días)",
    "ff": "5",
    "rubro": "07",
    "meta": "0022",
    "enunciado": [
     "El Ing. Carlos Mendoza, Gerente de Infraestructura, viaja en comisión de servicios a Lima del 08 al 10/06/2026 (3 días). La Oficina de Administración le otorga S/ 1 360,00 en su cuenta: viáticos S/ 960,00 (S/ 320,00 diarios) y pasajes S/ 400,00, con cargo al Fondo de Compensación Municipal, meta 0022 Gestión Administrativa. Resolución Administrativa N.° 152-2026-OGA del 03/06/2026.",
     "Rinde: hospedaje S/ 400,00 (factura), alimentación S/ 300,00 (facturas), movilidad local S/ 150,00 (boletas y recibos), declaración jurada de movilidad S/ 60,00 y pasajes S/ 400,00 (factura de la empresa de transportes). La directiva permite declaración jurada hasta el 30 % de los viáticos."
    ],
    "datos": [
     [
      "Informe del área usuaria",
      "Informe N.° 045-2026-MP/GI · 01/06/2026"
     ],
     [
      "Certificación",
      "Nota N.° 0000000842 · 02/06/2026 · FF 5 / Rb 07 FONCOMUN · meta 0022"
     ],
     [
      "Resolución",
      "R.A. N.° 152-2026-OGA · 03/06/2026"
     ],
     [
      "Viáticos",
      "S/ 960,00 (320 × 3 días) · 2.3.2.1.2.2"
     ],
     [
      "Pasajes",
      "S/ 400,00 · 2.3.2.1.2.1"
     ],
     [
      "Expediente SIAF",
      "0000001275 (compromiso, devengado y girado)"
     ],
     [
      "Rendición",
      "RV-0007-2026 · 15/06/2026 · sustentado S/ 1 310,00"
     ],
     [
      "Declaración jurada",
      "S/ 60,00 = 6.25 % de los viáticos (tope 30 % = S/ 288,00)"
     ],
     [
      "Saldo",
      "S/ 50,00 a favor de la Municipalidad · devuelto con T-6"
     ]
    ],
    "ops": [
     {
      "op": "cert",
      "fase": "Certificación",
      "key": "cert",
      "num": 842,
      "mes": 6,
      "fecha": "02/06/2026",
      "doc": [
       "OTRO",
       "INFORME Nº 045-2026-MP/GI",
       "01/06/2026"
      ],
      "tipoCert": "OTROS",
      "justif": "COMISION DE SERVICIOS DEL GERENTE DE INFRAESTRUCTURA ING. CARLOS MENDOZA A LA CIUDAD DE LIMA DEL 08 AL 10/06/2026 PARA CUMPLIR FUNCIONES INSTITUCIONALES",
      "items": [
       [
        "2.3.2.1.2.1",
        "0022",
        400
       ],
       [
        "2.3.2.1.2.2",
        "0022",
        960
       ]
      ],
      "sin": "Solo reserva el crédito."
     },
     {
      "op": "ca",
      "fase": "Compromiso anual",
      "key": "ca",
      "ref": "cert",
      "num": 121,
      "mes": 6,
      "fecha": "03/06/2026",
      "tipoOp": "AV",
      "doc": [
       "234",
       "R.A. Nº 152-2026-OGA",
       "03/06/2026"
      ],
      "prov": [
       "DNI",
       "40000004"
      ],
      "justif": "VIATICOS Y PASAJES POR COMISION DE SERVICIOS A LIMA DEL 08 AL 10/06/2026 SEGUN R.A. Nº 152-2026-OGA",
      "items": [
       [
        "2.3.2.1.2.1",
        "0022",
        400
       ],
       [
        "2.3.2.1.2.2",
        "0022",
        960
       ]
      ],
      "as": [
       [
        1,
        "Presupuestaria",
        "8301.0502",
        "Presupuesto de gastos - Fondo de Compensación Municipal",
        1360,
        0,
        ""
       ],
       [
        1,
        "Presupuestaria",
        "8401.0502",
        "Asignaciones comprometidas - Fondo de Compensación Municipal",
        0,
        1360,
        ""
       ]
      ]
     },
     {
      "op": "cm",
      "fase": "Compromiso mensual",
      "key": "cm",
      "ref": "ca",
      "exp": 1275,
      "mes": 6,
      "fecha": "04/06/2026",
      "modalidad": "NA - NO APLICA (PLANILLAS, ENCARGOS, VIATICOS, SENTENCIAS)",
      "tipoProc": "NO APLICA",
      "doc": [
       "043",
       "PLANILLA DE VIATICOS Nº 045-2026",
       "04/06/2026"
      ],
      "notas": "VIATICOS Y PASAJES COMISION A LIMA - ING. CARLOS MENDOZA",
      "tipoPago": "A - ABONO EN CUENTA",
      "items": [
       [
        "2.3.2.1.2.1",
        "0022",
        400
       ],
       [
        "2.3.2.1.2.2",
        "0022",
        960
       ]
      ],
      "sin": "Sin asiento contable."
     },
     {
      "op": "dev",
      "rol": "entrega",
      "fase": "Devengado (habilitación)",
      "key": "dev",
      "ref": "cm",
      "mes": 6,
      "fecha": "04/06/2026",
      "doc": [
       "043",
       "",
       "045-2026",
       "04/06/2026"
      ],
      "notas": "DEVENGADO DE LA PLANILLA DE VIATICOS Nº 045-2026",
      "items": [
       [
        "2.3.2.1.2.1",
        "0022",
        400
       ],
       [
        "2.3.2.1.2.2",
        "0022",
        960
       ]
      ],
      "as": [
       [
        2,
        "Patrimonial",
        "1205.0301",
        "Entregas a rendir cuenta - Viáticos",
        1360,
        0,
        ""
       ],
       [
        2,
        "Patrimonial",
        "2103.0101",
        "Cuentas por pagar - Viáticos",
        0,
        1360,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8401.0502",
        "Asignaciones comprometidas - FONCOMUN",
        1360,
        0,
        ""
       ],
       [
        3,
        "Presupuestaria",
        "8601.0502",
        "Ejecución de gastos - FONCOMUN",
        0,
        1360,
        ""
       ]
      ]
     },
     {
      "op": "gir",
      "rol": "entrega",
      "fase": "Girado (habilitación)",
      "key": "gir",
      "ref": "dev",
      "mes": 6,
      "fecha": "05/06/2026",
      "medio": "ABONO EN CUENTA",
      "tipoGiro": "PRINCIPAL",
      "benef": [
       "DNI",
       "40000004"
      ],
      "docGiro": "C/P Nº 0000733",
      "ret": [],
      "items": [
       [
        "2.3.2.1.2.1",
        "0022",
        400
       ],
       [
        "2.3.2.1.2.2",
        "0022",
        960
       ]
      ],
      "as": [
       [
        4,
        "Patrimonial",
        "2103.0101",
        "Cuentas por pagar - Viáticos",
        1360,
        0,
        ""
       ],
       [
        4,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Fondo de Compensación Municipal",
        0,
        1360,
        "Abono en la cuenta del comisionado"
       ]
      ]
     },
     {
      "op": "rend",
      "fase": "Devengado (rendición)",
      "key": "rend",
      "ref": "dev",
      "mes": 6,
      "fecha": "15/06/2026",
      "doc": [
       "OTRO",
       "",
       "RV-0007-2026",
       "15/06/2026"
      ],
      "notas": "RENDICION DE VIATICOS Y PASAJES RV-0007-2026, COMISION A LIMA DEL 08 AL 10/06/2026",
      "comp": [
       [
        "FACTURA ELECTRONICA",
        "F001-000412",
        "10/06/2026",
        "HOSPEDAJE HOTEL LIMA REAL",
        "2.3.2.1.2.2",
        400
       ],
       [
        "FACTURAS ELECTRONICAS",
        "VARIAS",
        "08-10/06/2026",
        "ALIMENTACION",
        "2.3.2.1.2.2",
        300
       ],
       [
        "BOLETAS Y RECIBOS",
        "VARIOS",
        "08-10/06/2026",
        "MOVILIDAD LOCAL (TAXI)",
        "2.3.2.1.2.2",
        150
       ],
       [
        "DECLARACION JURADA",
        "DJ-001",
        "10/06/2026",
        "MOVILIDAD LOCAL SIN COMPROBANTE (6.25% <= 30%)",
        "2.3.2.1.2.2",
        60
       ],
       [
        "FACTURA ELECTRONICA",
        "F010-008821",
        "07/06/2026",
        "PASAJES INTERPROVINCIALES IDA Y VUELTA",
        "2.3.2.1.2.1",
        400
       ]
      ],
      "items": [
       [
        "2.3.2.1.2.1",
        "0022",
        400
       ],
       [
        "2.3.2.1.2.2",
        "0022",
        910
       ]
      ],
      "as": [
       [
        5,
        "Patrimonial",
        "5302.010201",
        "Viajes domésticos - Pasajes y gastos de transporte (2.3.2.1.2.1)",
        400,
        0,
        "",
        "2.3.2.1.2.1"
       ],
       [
        5,
        "Patrimonial",
        "5302.010202",
        "Viajes domésticos - Viáticos y asignaciones por comisión de servicio (2.3.2.1.2.2)",
        910,
        0,
        "",
        "2.3.2.1.2.2"
       ],
       [
        5,
        "Patrimonial",
        "1205.0301",
        "Entregas a rendir cuenta - Viáticos",
        0,
        1310,
        "La ejecución presupuestaria ya se registró en la habilitación"
       ]
      ]
     },
     {
      "op": "t6",
      "fase": "Devolución T-6",
      "key": "t6",
      "ref": "gir",
      "mes": 6,
      "fecha": "15/06/2026",
      "doc": [
       "T6",
       "",
       "0000112",
       "15/06/2026"
      ],
      "notas": "DEVOLUCION DEL SALDO NO UTILIZADO DE VIATICOS RV-0007-2026",
      "items": [
       [
        "2.3.2.1.2.2",
        "0022",
        50
       ]
      ],
      "as": [
       [
        6,
        "Patrimonial",
        "1101.0301",
        "Cuentas corrientes - Fondo de Compensación Municipal",
        50,
        0,
        ""
       ],
       [
        6,
        "Patrimonial",
        "1205.0301",
        "Entregas a rendir cuenta - Viáticos",
        0,
        50,
        ""
       ],
       [
        7,
        "Presupuestaria",
        "8601.0502",
        "Ejecución de gastos - FONCOMUN",
        50,
        0,
        "Rebaja de la ejecución por devolución"
       ],
       [
        7,
        "Presupuestaria",
        "8401.0502",
        "Asignaciones comprometidas - FONCOMUN",
        0,
        50,
        ""
       ]
      ]
     }
    ],
    "controles": [
     [
      "El compromiso anual no supera la certificación",
      "ca",
      [
       "cert"
      ]
     ],
     [
      "El girado no supera el devengado",
      "gir",
      [
       "dev"
      ]
     ],
     [
      "Lo rendido no supera lo entregado",
      "rend",
      [
       "gir"
      ]
     ],
     [
      "Rendición + devolución = monto entregado",
      "eq",
      [
       "rend",
       "t6"
      ],
      [
       "gir"
      ]
     ],
     [
      "Declaración jurada no supera el 30 % de los viáticos (S/ 288,00)",
      "dj",
      0.3
     ]
    ],
    "docsFuente": [
     [
      "Informe N.° 045-2026-MP/GI",
      "Gerencia de Infraestructura",
      "Solicita la comisión y los viáticos (sustento de la certificación)"
     ],
     [
      "Nota de Certificación N.° 0842-2026",
      "Oficina de Planeamiento y Presupuesto",
      "Crédito disponible en la meta 0022 (FONCOMUN)"
     ],
     [
      "R.A. N.° 152-2026-OGA",
      "Oficina General de Administración",
      "Autoriza el viaje y otorga S/ 1 360,00: compromiso anual (234)"
     ],
     [
      "Planilla de viáticos N.° 045-2026 (043)",
      "Oficina de Administración",
      "Compromiso mensual y devengado de la habilitación"
     ],
     [
      "Facturas, boletas y recibos",
      "Proveedores (hotel, restaurantes, taxis, transporte)",
      "Sustentan la rendición"
     ],
     [
      "Declaración jurada de movilidad",
      "Comisionado",
      "Gastos sin comprobante, hasta 30 % de los viáticos"
     ],
     [
      "Papeleta T-6",
      "Tesorería / Banco",
      "Devolución de S/ 50,00"
     ]
    ],
    "pregunta": "Determine el monto válidamente sustentado y si existe saldo a favor de la Municipalidad o del trabajador.",
    "respuesta": "Viáticos sustentados: hospedaje 400 + alimentación 300 + movilidad 150 + declaración jurada 60 = S/ 910,00 (la DJ es 6.25 % de S/ 960,00, menor al tope de 30 % = S/ 288,00). Pasajes sustentados: S/ 400,00. Total sustentado: S/ 1 310,00. Entregado S/ 1 360,00 - sustentado S/ 1 310,00 = S/ 50,00 a favor de la Municipalidad, que el comisionado devuelve con Papeleta T-6 (D.S. N.° 007-2013-EF y directiva interna). Devengado definitivo por clasificador: 2.3.2.1.2.1 S/ 400,00 y 2.3.2.1.2.2 S/ 910,00.",
    "pasos": [
     [
      "Certificados",
      "Certificado Nº 0000000842: documento OTRO (Informe 045-2026-MP/GI), rubro 07, 2.3.2.1.2.1 (400) y 2.3.2.1.2.2 (960), meta 0022."
     ],
     [
      "Compromiso Anual",
      "Tipo AV - Encargo interno para viáticos, documento 234 (R.A. Nº 152-2026-OGA), DNI del comisionado."
     ],
     [
      "Registro SIAF - Compromiso Mensual",
      "Expediente 0000001275, documento 043 Planilla de viáticos."
     ],
     [
      "Registro SIAF - Devengado",
      "Devengado de la habilitación."
     ],
     [
      "Registro SIAF - Girado",
      "Abono en cuenta del comisionado."
     ],
     [
      "Registro SIAF - Devengado",
      "Rendición RV-0007-2026 con los cinco comprobantes."
     ],
     [
      "Registro SIAF - Papeleta T-6",
      "Devolución de S/ 50,00."
     ]
    ]
   }
  ]
 }
} as unknown as Record<string, CasoDef>;
