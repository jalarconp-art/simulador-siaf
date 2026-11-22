/* Logotipo del simulador: anillo y palabra «SIAF» al estilo de la plataforma SIAF-WEB, con la marca «SIMULADOR»
   (no reproduce el emblema oficial del MEF; identifica claramente que se trata de un entorno de práctica). */
export function Logo({ tam = 30, color = '#fff', simulador = true }: { tam?: number; color?: string; simulador?: boolean }) {
  return <span className="siaf-logo" style={{ color }}>
    <svg width={tam} height={tam} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="14.5" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="20" cy="20" r="4.2" fill="currentColor" />
    </svg>
    <span className="siaf-logo-t"><b style={{ fontSize: tam * 0.9 }}>SIAF</b>{simulador && <small>WEB · SIMULADOR</small>}</span>
  </span>;
}
