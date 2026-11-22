-- =====================================================================
--  SIAF-WEB Simulador · esquema de Supabase (PostgreSQL)
--  Ejecútelo una sola vez en: Supabase › SQL Editor › New query › Run
--  · perfiles  : datos, perfil SIAF y opciones (Consulta/Operación) de cada usuario
--  · espacios  : espacio de trabajo de cada usuario (ejecutora del Caso Práctico 1)
--  · auditoria : bitácora de operaciones
--  Seguridad por fila (RLS): cada usuario solo lee y escribe lo suyo;
--  el Administrador de usuarios lee todo y asigna perfiles.
--  El PRIMER usuario que se registre queda como ADMINISTRADOR.
-- =====================================================================

create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  usuario text not null unique,
  email text not null,
  dni text not null default '00000000',
  apellidos text not null default '',
  nombres text not null default '',
  rol text not null default 'OPERADOR'
    check (rol in ('ADMINISTRADOR','OPERADOR','LOGISTICA','PRESUPUESTO','CONTABILIDAD','TESORERIA','CONSULTA')),
  permisos jsonb not null default '{}'::jsonb,
  estado text not null default 'ACTIVO' check (estado in ('ACTIVO','INACTIVO')),
  proveedor text not null default 'local',
  creado timestamptz not null default now()
);

create table if not exists public.espacios (
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  caso text not null,
  datos jsonb not null,
  responsables jsonb not null default '[]'::jsonb,
  actualizado timestamptz not null default now(),
  primary key (usuario_id, caso)
);

create table if not exists public.auditoria (
  id bigint generated always as identity primary key,
  usuario_id uuid references public.perfiles(id) on delete set null,
  fecha text not null,
  usuario text not null,
  ejecutora text,
  accion text not null,
  entidad text,
  detalle text
);
create index if not exists ix_auditoria_id on public.auditoria (id desc);

-- ¿El usuario en sesión es Administrador de usuarios activo? (security definer evita recursión de RLS)
create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = auth.uid() and rol = 'ADMINISTRADOR' and estado = 'ACTIVO');
$$;

-- Crea el perfil al registrarse (correo o Google). El primero es ADMINISTRADOR; los demás, OPERADOR.
create or replace function public.crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n int;
  primero boolean;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  todo_o jsonb := '{"cert":"O","ca":"O","cm":"O","dev":"O","gir":"O","mod":"O","det":"O","opp":"O","cont":"O"}'::jsonb;
begin
  select count(*) = 0 into primero from public.perfiles;
  select coalesce(max((substring(usuario from 3))::int), 20260) + 1 into n from public.perfiles where usuario ~ '^RU[0-9]+$';
  insert into public.perfiles (id, usuario, email, dni, apellidos, nombres, rol, permisos, proveedor)
  values (
    new.id,
    case when primero then 'ADMIN' else 'RU' || n end,
    lower(new.email),
    coalesce(nullif(meta->>'dni', ''), '00000000'),
    upper(coalesce(nullif(meta->>'apellidos', ''), nullif(meta->>'family_name', ''), '')),
    upper(coalesce(nullif(meta->>'nombres', ''), nullif(meta->>'given_name', ''), nullif(meta->>'full_name', ''), split_part(new.email, '@', 1))),
    case when primero then 'ADMINISTRADOR' else 'OPERADOR' end,
    todo_o,
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  );
  return new;
end;
$$;
drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users for each row execute function public.crear_perfil();

-- Un usuario no puede cambiarse a sí mismo el perfil, las opciones ni el estado (solo el administrador).
create or replace function public.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() es nulo en el SQL Editor del panel de Supabase: ahí se permite (lo usa el dueño del proyecto)
  if auth.uid() is not null and not public.es_admin() and (new.rol is distinct from old.rol or new.permisos is distinct from old.permisos
     or new.estado is distinct from old.estado or new.usuario is distinct from old.usuario) then
    raise exception 'Solo el Administrador de usuarios puede cambiar perfiles y opciones.';
  end if;
  if new.id = auth.uid() and old.rol = 'ADMINISTRADOR' and new.rol <> 'ADMINISTRADOR' then
    raise exception 'No puede quitarse a sí mismo el perfil de Administrador.';
  end if;
  return new;
end;
$$;
drop trigger if exists proteger_perfil on public.perfiles;
create trigger proteger_perfil before update on public.perfiles for each row execute function public.proteger_perfil();

alter table public.perfiles enable row level security;
alter table public.espacios enable row level security;
alter table public.auditoria enable row level security;

drop policy if exists perfiles_ver on public.perfiles;
create policy perfiles_ver on public.perfiles for select using (id = auth.uid() or public.es_admin());
drop policy if exists perfiles_editar on public.perfiles;
create policy perfiles_editar on public.perfiles for update using (id = auth.uid() or public.es_admin());

drop policy if exists espacios_ver on public.espacios;
create policy espacios_ver on public.espacios for select using (usuario_id = auth.uid() or public.es_admin());
drop policy if exists espacios_crear on public.espacios;
create policy espacios_crear on public.espacios for insert with check (usuario_id = auth.uid());
drop policy if exists espacios_editar on public.espacios;
create policy espacios_editar on public.espacios for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists auditoria_crear on public.auditoria;
create policy auditoria_crear on public.auditoria for insert with check (usuario_id = auth.uid());
drop policy if exists auditoria_ver on public.auditoria;
create policy auditoria_ver on public.auditoria for select using (public.es_admin());

-- Permisos de la API de datos (necesarios cuando el proyecto no expone automáticamente las tablas nuevas).
-- Las reglas RLS de arriba siguen limitando qué filas ve cada usuario.
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.perfiles, public.espacios, public.auditoria to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.es_admin() to authenticated;

-- Para nombrar a otro administrador manualmente (opcional):
--   update public.perfiles set rol = 'ADMINISTRADOR' where email = 'correo@ejemplo.com';
