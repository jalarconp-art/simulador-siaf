import { createRoot } from 'react-dom/client';
import { fijarModo, preferencia, usarPuente } from './puente';
import './styles/app.css';
import './styles/extra.css';

/* El escritorio trabaja conectado a la nube (Supabase), compartiendo cuentas y registros con la versión web.
   Sin configuración de la nube, o si el usuario elige «sin conexión», usa la base SQLite del equipo. */
async function iniciar(): Promise<void> {
  const nativo = window.siaf;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const clave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const forzado = new URLSearchParams(location.search).get('modo');
  const nube = !!(nativo.nube && url && clave) && (forzado ? forzado === 'nube' : preferencia() === 'nube');
  if (nube) {
    const [{ PuenteWeb }, { BackendSupabase }] = await Promise.all([import('../../web/puente'), import('../../web/backend/supabase')]);
    const n = nativo.nube!;
    usarPuente(new PuenteWeb(new BackendSupabase(url!, clave!, { preparar: n.oauthPreparar, abrir: n.oauthAbrir }), { wasm: n.wasm, delegado: nativo }));
    fijarModo('nube');
    document.documentElement.classList.add('modo-nube');
  } else fijarModo('local');
  const { App } = await import('./App');
  createRoot(document.getElementById('root')!).render(<App />);
}
iniciar();
