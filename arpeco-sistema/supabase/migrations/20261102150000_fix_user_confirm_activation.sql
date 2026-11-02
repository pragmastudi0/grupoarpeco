-- ============================================================================
-- Fix · Activación al confirmar email bloqueada por la guardia de profiles
--
-- Problema: handle_user_confirmed() hacía UPDATE public.profiles SET active=true
-- sin marcar app.admin_action='on'. El trigger guard_profile_update abortaba el
-- cambio de la columna protegida `active`, lo que hacía fallar TODA el alta en
-- Auth con "Database error creating new user" (al crear con Auto Confirm o al
-- confirmar el email).
--
-- Solución: envolver el UPDATE con set_config('app.admin_action','on',true),
-- igual que las RPC administrativas (set_user_active). La activación por
-- confirmación de email es una acción legítima del sistema.
-- ============================================================================

create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    -- Habilita el cambio de la columna protegida por guard_profile_update.
    perform set_config('app.admin_action', 'on', true);
    update public.profiles
      set active = true, activated_at = now(), updated_at = now()
    where id = new.id and activated_at is null;
    perform set_config('app.admin_action', 'off', true);
  end if;
  return new;
end;
$$;
