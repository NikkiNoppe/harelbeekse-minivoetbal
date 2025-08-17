
-- Team_users: vervang policies die auth.role() vereisen door policies op basis van custom rol
alter table public.team_users enable row level security;

drop policy if exists "Authenticated can manage team users" on public.team_users;
drop policy if exists "Authenticated can read team users" on public.team_users;

-- Admins mogen alles op team_users
create policy "Admins can select team_users"
  on public.team_users
  for select
  using (public.get_current_user_role() = 'admin');

create policy "Admins can insert team_users"
  on public.team_users
  for insert
  with check (public.get_current_user_role() = 'admin');

create policy "Admins can update team_users"
  on public.team_users
  for update
  using (public.get_current_user_role() = 'admin')
  with check (public.get_current_user_role() = 'admin');

create policy "Admins can delete team_users"
  on public.team_users
  for delete
  using (public.get_current_user_role() = 'admin');
