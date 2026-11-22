/* Contenedor del Módulo de Ejecución Presupuestal (menú Registro, Consultas y Reportes como en el SIAF-WEB) */
import { useApp } from '../../store';
import { MenuLateral, Migas, pantallaVisible, Topbar } from '../../components/Shell';
import { Vacio } from '../../components/ui';
import { Certificados } from './Certificados';
import { CompromisoAnual } from './CompromisoAnual';
import { Expedientes } from './Expedientes';
import { Ingresos } from './Ingresos';
import { Modificaciones } from './Modificaciones';
import { Reportes } from './Reportes';
import { Auxiliar } from './Auxiliares';
import { AsignacionTesoro, Contratos, ReporteCertificacion, ReporteTransferencia } from './ConsultasReportes';
import { AUX_POR_K } from '@shared/auxiliares';
import { OPCIONES, puede } from '@shared/permisos';

export function Ejecucion() {
  const { pantalla, menuAbierto, ej, sesion } = useApp();
  if (sesion && !OPCIONES.some(o => o.k !== 'opp' && puede(sesion.usuario, o.k, 'C'))) return <><Topbar app="ejecucion" /><div className="welcome"><Vacio titulo="Acceso restringido" texto="Su perfil no tiene opciones habilitadas en el Módulo de Ejecución. Solicítelas al Administrador de usuarios." icono="lock" /></div></>;
  let vista;
  if (!ej) vista = <div className="detail"><Vacio titulo="Cargando" texto="Obteniendo los registros de la unidad ejecutora." icono="folder" /></div>;
  else if (!pantallaVisible(sesion?.usuario, pantalla)) vista = <div className="detail"><Vacio titulo="Acceso restringido" texto="El Administrador de usuarios no le ha habilitado esta opción." icono="lock" /></div>;
  else if (AUX_POR_K[pantalla]) vista = <Auxiliar def={AUX_POR_K[pantalla]} key={pantalla} />;
  else switch (pantalla) {
    case 'cert': vista = <Certificados />; break;
    case 'ca': vista = <CompromisoAnual />; break;
    case 'cm': case 'dev': case 'gir': case 't6': vista = <Expedientes pantalla={pantalla} key={pantalla} />; break;
    case 'ren': vista = <Expedientes pantalla="dev" key="ren" />; break;
    case 'det': case 'rec': vista = <Ingresos key={pantalla} />; break;
    case 'mod': vista = <Modificaciones />; break;
    case 'contratos': vista = <Contratos />; break;
    case 'atp': vista = <AsignacionTesoro />; break;
    case 'repcca': vista = <ReporteCertificacion />; break;
    case 'rep': vista = <Reportes />; break;
    case 'transf': vista = <ReporteTransferencia />; break;
  }
  return <><Topbar app="ejecucion" />
    <div className={'layout' + (menuAbierto ? '' : ' nomenu')}><MenuLateral />
      <main><Migas /><div className="work">{vista}</div></main></div></>;
}
