/* Entrada de la versión web: instala el puente (Supabase o modo local) y monta la misma interfaz React del escritorio. */
import { createRoot } from 'react-dom/client';
import { PuenteWeb } from './puente';
import { BackendSupabase } from './backend/supabase';
import { BackendLocal } from './backend/local';
import '@/styles/app.css';
import '@/styles/extra.css';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const backend = url && clave ? new BackendSupabase(url, clave) : new BackendLocal();
window.siaf = new PuenteWeb(backend);
document.documentElement.classList.add('plat-web');
if (backend.nombre === 'local') document.documentElement.classList.add('modo-local');

import('@/App').then(({ App }) => createRoot(document.getElementById('root')!).render(<App />));
