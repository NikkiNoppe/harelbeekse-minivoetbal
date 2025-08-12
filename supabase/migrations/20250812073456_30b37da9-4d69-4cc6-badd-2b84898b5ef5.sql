
-- 1) Zorg dat pgcrypto aanwezig is in schema "extensions" (Supabase-standaard)
create extension if not exists pgcrypto with schema extensions;

-- 2) Fix: wachtwoord updaten met schema-gekwalificeerde functies
create or replace function public.update_user_password(user_id_param integer, new_password text)
returns boolean
language plpgsql
security definer
set search_path = 'public,extensions'
as $function$
begin
  update public.users 
  set password = extensions.crypt(new_password, extensions.gen_salt('bf', 8))
  where user_id = user_id_param;

  return found;
end;
$function$;

-- 3) Fix: nieuwe gebruiker aanmaken met correct gehashte wachtwoorden
--    (verwijdert onveilige fallback naar plaintext)
create or replace function public.create_user_with_hashed_password(
  username_param character varying,
  email_param character varying,
  password_param character varying,
  role_param user_role default 'player_manager'
)
returns users
language plpgsql
security definer
set search_path = 'public,extensions'
as $function$
declare
  new_user public.users;
begin
  insert into public.users (username, email, password, role)
  values (
    username_param,
    email_param,
    extensions.crypt(password_param, extensions.gen_salt('bf', 8)),
    role_param
  )
  returning * into new_user;

  return new_user;
end;
$function$;
