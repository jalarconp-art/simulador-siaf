/* Logotipo del simulador: anillo y palabra «SIAF» con la tipografía de la plataforma («PLATAFORMA» encima).
   No reproduce el emblema oficial del MEF. */
export function Logo({ tam = 30, color = '#fff', simulador = true, plataforma = false }: { tam?: number; color?: string; simulador?: boolean; plataforma?: boolean }) {
  return <span className="siaf-logo" style={{ color }}>
    <svg width={tam} height={tam} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="20" cy="20" r="4.2" fill="currentColor" />
    </svg>
    <span className="siaf-logo-t">
      {plataforma && <small className="siaf-pl" style={{ fontSize: Math.max(7, tam * 0.16) }}>PLATAFORMA</small>}
      <b style={{ fontSize: tam * 0.9 }}>SIAF</b>
      {simulador && <small>WEB · SIMULADOR</small>}
    </span>
  </span>;
}
