/* Documento HTML para imprimir o exportar a PDF los reportes (escritorio y web). */
export const documentoImpresion = (inner: string, titulo: string) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${titulo}</title><style>
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;margin:18px}table{border-collapse:collapse;width:100%}td,th{padding:3px 5px;vertical-align:top;text-align:left}
.r{text-align:right}.c{text-align:center}.pt{text-align:center;margin:4px 0}.pdet th{border-top:1px solid #000;border-bottom:1px solid #000;font-size:10px}.pdet .sq td{font-weight:bold;border-top:1px dashed #999}
.pdet .tt td{font-weight:bold;border-top:1px solid #000}.i1{padding-left:14px}.i2{padding-left:24px}.i3{padding-left:34px}.i4{padding-left:44px}.i5{padding-left:54px}.pfirm td{text-align:center;padding-top:50px}
.tbl th,.tbl td{border:1px solid #bbb}.tbl th{background:#eee}h3.sec{background:#0e8ab5;color:#fff;padding:4px 8px;font-size:12px}.kv td:first-child{width:28%;font-weight:bold}</style></head><body>${inner}</body></html>`;
