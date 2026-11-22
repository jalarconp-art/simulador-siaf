/* Contenedor del Módulo de Ejecución */
import { useApp } from '../../store';
import { BarraCaso, MenuLateral, Migas, Topbar } from '../../components/Shell';
import { Vacio } from '../../components/ui';
import { Certificados } from './Certificados';
import { CompromisoAnual } from './CompromisoAnual';
import { Expedientes } from './Expedientes';
import { Ingresos } from './Ingresos';
import { Modificaciones } from './Modificaciones';
import { Contable, Verificar } from './Consulta';
import { Catalogo, Clasificadores } from './Referencia';
import { Reportes } from './Reportes';
import { Guia } from './Guia';
import { OPCIONES, puede } from '@shared/permisos';

export function Ejecucion() {
  const { pantalla, menuAbierto, guia, ej, sesion } = useApp();
  if (sesion && !OPCIONES.some(o => o.k !== 'opp' && puede(sesion.usuario, o.k, 'C'))) return <><Topbar app="ejecucion" /><div className="welcome"><Vacio titulo="Acceso restringido" texto="Su perfil no tiene opciones habilitadas en el Módulo de Ejecución. Solicítelas al Administrador de usuarios." icono="lock" /></div></>;
  let vista;
  if (!ej) vista = <div className="detail"><Vacio titulo="Cargando ejecutora" texto="Obteniendo los registros desde la base de datos." icono="folder" /></div>;
  else switch (pantalla) {
    case 'cert': vista = <Certificados />; break;
    case 'ca': vista = <CompromisoAnual />; break;
    case 'cm': case 'dev': case 'gir': case 't6': vista = <Expedientes pantalla={pantalla} key={pantalla} />; break;
    case 'det': vista = <Ingresos />; break;
    case 'mod': vista = <Modificaciones />; break;
    case 'cont': vista = <Contable />; break;
    case 'ver': vista = <Verificar />; break;
    case 'clas': vista = <Clasificadores />; break;
    case 'cat': vista = <Catalogo />; break;
    case 'rep': vista = <Reportes />; break;
  }
  return <><Topbar app="ejecucion" />
    <div className={'layout' + (menuAbierto ? '' : ' nomenu')}><MenuLateral />
      <main><Migas /><BarraCaso /><div className="work">{vista}</div></main>{guia && <Guia />}</div></>;
}
