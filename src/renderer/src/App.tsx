/* Componente raíz: enrutamiento por aplicativo, eventos del proceso principal y comandos del menú nativo. */
import { siaf } from '@/puente';
import { useEffect } from 'react';
import { useApp } from './store';
import { api } from './api';
import { Avisos, HostDialogos } from './components/Dialogos';
import { Portal } from './features/Portal';
import { Bienvenida, Casos } from './features/Inicio';
import { Ejecucion } from './features/ejecucion/Ejecucion';
import { Opl } from './features/Opl';
import { Aeraf } from './features/Aeraf';
import { Madaf } from './features/Madaf';
import { Docente } from './features/Docente';
import { exportarEntrega, exportarRespaldo, restaurarRespaldo } from './features/Usuario';

export function App() {
  const { app, sesion, ir, setSesion, recargar, ejecutoraId, avisar } = useApp();
  useEffect(() => {
    api.sesion().then(s => { if (s) { setSesion(s); ir('bienvenida'); } }).catch(() => undefined);
    const off1 = siaf().alCambiar(d => {
      const st = useApp.getState();
      if (d.ejecutora === st.ejecutoraId || !d.ejecutora) st.recargar();
      if (d.mensaje) st.avisar(d.mensaje.texto, d.mensaje.tipo || 'info');
    });
    const off2 = siaf().alMenu(async cmd => {
      const st = useApp.getState();
      st.dialogos.forEach(x => st.cerrarDialogo(x.id));
      if (cmd === 'inicio') st.ir(st.sesion ? 'bienvenida' : 'portal');
      if (cmd === 'respaldo-exportar') exportarRespaldo();
      if (cmd === 'respaldo-importar') restaurarRespaldo();
      if (cmd === 'entrega') exportarEntrega();
      if (cmd === 'logout') { await api.logout(); st.setSesion(null); st.ir('portal'); }
    });
    return () => { off1(); off2(); };
  }, []);
  useEffect(() => { if (sesion) recargar(); }, [sesion, ejecutoraId]);
  useEffect(() => { if (!sesion && ['bienvenida', 'ejecucion', 'opl', 'casos', 'docente', 'aeraf', 'madaf'].includes(app)) { ir('portal'); avisar('Inicie sesión para continuar.', 'info'); } }, [app, sesion]);

  let vista;
  switch (app) {
    case 'bienvenida': vista = <Bienvenida />; break;
    case 'ejecucion': vista = <Ejecucion />; break;
    case 'opl': vista = <Opl />; break;
    case 'aeraf': vista = <Aeraf />; break;
    case 'madaf': vista = <Madaf />; break;
    case 'casos': vista = <Casos />; break;
    case 'docente': vista = <Docente />; break;
    default: vista = <Portal />;
  }
  return <>{vista}<HostDialogos /><Avisos /></>;
}
