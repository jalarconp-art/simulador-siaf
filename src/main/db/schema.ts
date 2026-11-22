/* Esquema relacional (SQLite). Cada migración se aplica una sola vez y queda registrada en schema_version. */
export const MIGRACIONES: string[] = [
  /* v1: núcleo de ejecución, seguridad, AERAF, aula y auditoría */
  `
  CREATE TABLE meta (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
  CREATE TABLE usuarios (
    id TEXT PRIMARY KEY, usuario TEXT NOT NULL UNIQUE, dni TEXT NOT NULL, apellidos TEXT NOT NULL, nombres TEXT NOT NULL,
    email TEXT NOT NULL, rol TEXT NOT NULL CHECK (rol IN ('DOCENTE','OPERADOR','OPP')), hash TEXT NOT NULL, salt TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO', creado TEXT NOT NULL);
  CREATE TABLE ejecutoras (
    id TEXT PRIMARY KEY, modo TEXT NOT NULL, sub TEXT NOT NULL, fecha_sis TEXT NOT NULL, seq TEXT NOT NULL, tick INTEGER NOT NULL);
  CREATE TABLE proveedores (ejecutora TEXT NOT NULL REFERENCES ejecutoras(id) ON DELETE CASCADE, tipo TEXT NOT NULL, num TEXT NOT NULL, nombre TEXT NOT NULL, PRIMARY KEY (ejecutora, num));
  CREATE TABLE certificados (
    id TEXT PRIMARY KEY, ejecutora TEXT NOT NULL REFERENCES ejecutoras(id) ON DELETE CASCADE, num INTEGER NOT NULL, sub TEXT NOT NULL,
    mes INTEGER NOT NULL, anio INTEGER NOT NULL, doc_cod TEXT, doc_num TEXT, doc_fecha TEXT, rubro TEXT NOT NULL, ff TEXT NOT NULL,
    tipo_cert TEXT NOT NULL, disp TEXT, justif TEXT NOT NULL, fecha TEXT NOT NULL, t INTEGER NOT NULL);
  CREATE TABLE cert_secuencias (
    id TEXT PRIMARY KEY, cert_id TEXT NOT NULL REFERENCES certificados(id) ON DELETE CASCADE, sec INTEGER NOT NULL, tipo TEXT NOT NULL,
    estado TEXT NOT NULL, fecha TEXT NOT NULL, doc_cod TEXT, doc_serie TEXT, doc_num TEXT, doc_fecha TEXT, fecha_aprob TEXT, aut TEXT, t INTEGER NOT NULL);
  CREATE TABLE compromisos_anuales (
    id TEXT PRIMARY KEY, ejecutora TEXT NOT NULL REFERENCES ejecutoras(id) ON DELETE CASCADE, num INTEGER NOT NULL,
    cert_id TEXT NOT NULL REFERENCES certificados(id) ON DELETE CASCADE, sub TEXT NOT NULL, mes INTEGER NOT NULL, fecha TEXT NOT NULL,
    tipo_op TEXT NOT NULL, doc_cod TEXT, doc_num TEXT, doc_fecha TEXT, prov_tipo TEXT, prov_num TEXT, prov_nom TEXT, justif TEXT NOT NULL,
    estado TEXT NOT NULL, fecha_aprob TEXT, aut TEXT, transf TEXT, t INTEGER NOT NULL);
  CREATE TABLE ca_modificaciones (
    id TEXT PRIMARY KEY, ca_id TEXT NOT NULL REFERENCES compromisos_anuales(id) ON DELETE CASCADE, n INTEGER NOT NULL, tipo TEXT NOT NULL,
    estado TEXT NOT NULL, fecha TEXT NOT NULL, doc_cod TEXT, doc_num TEXT, doc_fecha TEXT, fecha_aprob TEXT, aut TEXT);
  CREATE TABLE expedientes (
    id TEXT PRIMARY KEY, ejecutora TEXT NOT NULL REFERENCES ejecutoras(id) ON DELETE CASCADE, num INTEGER NOT NULL, sub TEXT NOT NULL,
    ca_id TEXT NOT NULL REFERENCES compromisos_anuales(id) ON DELETE CASCADE, tipo_op TEXT NOT NULL, mes INTEGER NOT NULL, modalidad TEXT,
    tipo_proc TEXT, fase_contr TEXT, exp_enc TEXT, ff TEXT NOT NULL, rubro TEXT NOT NULL, t INTEGER NOT NULL);
  CREATE TABLE exp_secuencias (
    id TEXT PRIMARY KEY, exp_id TEXT NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE, sec INTEGER NOT NULL,
    fase TEXT NOT NULL CHECK (fase IN ('C','D','G','P','T6')), rend INTEGER NOT NULL DEFAULT 0, rol TEXT, hist INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL, mes INTEGER NOT NULL, fecha TEXT NOT NULL, doc_cod TEXT, doc_serie TEXT, doc_num TEXT, doc_fecha TEXT,
    prov_tipo TEXT, prov_num TEXT, prov_nom TEXT, notas TEXT, tipo_pago TEXT, tipo_recurso TEXT, tipo_comp TEXT, ent TEXT,
    giro_medio TEXT, giro_tipo TEXT, benef_tipo TEXT, benef_num TEXT, benef_nom TEXT, pagado INTEGER NOT NULL DEFAULT 0, ref INTEGER,
    fecha_aprob TEXT, aut TEXT, t INTEGER NOT NULL);
  CREATE TABLE retenciones (sec_id TEXT NOT NULL REFERENCES exp_secuencias(id) ON DELETE CASCADE, orden INTEGER NOT NULL, concepto TEXT NOT NULL, monto REAL NOT NULL);
  CREATE TABLE comprobantes (
    sec_id TEXT NOT NULL REFERENCES exp_secuencias(id) ON DELETE CASCADE, orden INTEGER NOT NULL, tipo TEXT, num TEXT, fecha TEXT, descripcion TEXT, clas TEXT, monto REAL NOT NULL);
  CREATE TABLE ingresos (
    id TEXT PRIMARY KEY, ejecutora TEXT NOT NULL REFERENCES ejecutoras(id) ON DELETE CASCADE, num INTEGER NOT NULL, sub TEXT NOT NULL,
    mes INTEGER NOT NULL, ff TEXT NOT NULL, rubro TEXT NOT NULL, t INTEGER NOT NULL);
  CREATE TABLE ing_secuencias (
    id TEXT PRIMARY KEY, ing_id TEXT NOT NULL REFERENCES ingresos(id) ON DELETE CASCADE, sec INTEGER NOT NULL, fase TEXT NOT NULL CHECK (fase IN ('D','R')),
    estado TEXT NOT NULL, fecha TEXT NOT NULL, mes INTEGER NOT NULL, doc_cod TEXT, doc_serie TEXT, doc_num TEXT, doc_fecha TEXT, notas TEXT,
    tipo_pago TEXT, fecha_aprob TEXT, aut TEXT, t INTEGER NOT NULL);
  CREATE TABLE modificaciones (
    id TEXT PRIMARY KEY, ejecutora TEXT NOT NULL REFERENCES ejecutoras(id) ON DELETE CASCADE, num INTEGER NOT NULL, tipo TEXT NOT NULL,
    ref_id TEXT NOT NULL, campo TEXT NOT NULL, antes TEXT, despues TEXT, estado TEXT NOT NULL, fecha TEXT NOT NULL, mes INTEGER NOT NULL,
    fecha_aprob TEXT, aut TEXT, t INTEGER NOT NULL);
  CREATE TABLE items (
    ejecutora TEXT NOT NULL REFERENCES ejecutoras(id) ON DELETE CASCADE, owner_tipo TEXT NOT NULL CHECK (owner_tipo IN ('cert_sec','ca','ca_mod','exp_sec','ing_sec')), owner_id TEXT NOT NULL,
    orden INTEGER NOT NULL, clas TEXT NOT NULL, meta TEXT, monto REAL NOT NULL);
  CREATE INDEX ix_items_owner ON items(owner_tipo, owner_id);
  CREATE TABLE responsables (
    id TEXT PRIMARY KEY, ejecutora TEXT NOT NULL, tipo TEXT NOT NULL CHECK (tipo IN ('del','ccp','ca','cta','dev')), dni TEXT NOT NULL,
    nombre TEXT NOT NULL, cargo TEXT, area TEXT, email TEXT, doc TEXT, fdoc TEXT, rol TEXT, email_ok INTEGER NOT NULL DEFAULT 0, estado TEXT NOT NULL);
  CREATE TABLE aulas (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, periodo TEXT NOT NULL, creado TEXT NOT NULL);
  CREATE TABLE estudiantes (id TEXT PRIMARY KEY, aula_id TEXT NOT NULL REFERENCES aulas(id) ON DELETE CASCADE, codigo TEXT NOT NULL, nombres TEXT NOT NULL, dni TEXT, UNIQUE (aula_id, codigo));
  CREATE TABLE entregas (
    id TEXT PRIMARY KEY, estudiante_id TEXT NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE, fecha TEXT NOT NULL, archivo TEXT,
    puntaje REAL NOT NULL, nota20 REAL NOT NULL, detalle TEXT NOT NULL);
  CREATE TABLE auditoria (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha TEXT NOT NULL, usuario TEXT NOT NULL, ejecutora TEXT, accion TEXT NOT NULL, entidad TEXT, detalle TEXT);
  CREATE INDEX ix_auditoria_fecha ON auditoria(fecha);
  `,
  /* v2: perfiles SIAF (Administrador, Operador, Logística, Presupuesto, Contabilidad, Tesorería, Consulta),
     permisos por opción (Consulta/Operación) y acceso con cuenta de Google */
  `
  CREATE TABLE usuarios_v2 (
    id TEXT PRIMARY KEY, usuario TEXT NOT NULL UNIQUE, dni TEXT NOT NULL, apellidos TEXT NOT NULL, nombres TEXT NOT NULL,
    email TEXT NOT NULL, rol TEXT NOT NULL, permisos TEXT NOT NULL DEFAULT '{}', hash TEXT NOT NULL, salt TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'ACTIVO', creado TEXT NOT NULL, proveedor TEXT NOT NULL DEFAULT 'local', google_sub TEXT);
  INSERT INTO usuarios_v2 (id, usuario, dni, apellidos, nombres, email, rol, permisos, hash, salt, estado, creado)
    SELECT id, usuario, dni, apellidos, nombres, email,
      CASE rol WHEN 'DOCENTE' THEN 'ADMINISTRADOR' WHEN 'OPP' THEN 'PRESUPUESTO' ELSE 'OPERADOR' END, '', hash, salt, estado, creado FROM usuarios;
  DROP TABLE usuarios;
  ALTER TABLE usuarios_v2 RENAME TO usuarios;
  CREATE INDEX ix_usuarios_email ON usuarios(lower(email));
  `,
  /* v3: opciones complementarias del menú Registro (cuentas bancarias, CCI, beneficiarios OPE, áreas, convenios, viáticos...) */
  `
  CREATE TABLE registros_aux (
    id TEXT PRIMARY KEY, ejecutora TEXT NOT NULL REFERENCES ejecutoras(id) ON DELETE CASCADE, tipo TEXT NOT NULL, num INTEGER NOT NULL,
    mes INTEGER NOT NULL, fecha TEXT NOT NULL, estado TEXT NOT NULL, datos TEXT NOT NULL, t INTEGER NOT NULL);
  CREATE INDEX ix_registros_aux ON registros_aux(ejecutora, tipo);
  `
];
