-- ============================================================
-- GOAL 1: SPLIT STUDENT/ADMIN DETAILS CLEANLY
-- ============================================================

-- 1. Create student_profiles table
create table if not exists public.student_profiles (
  profile_id  uuid primary key references public.profiles(id) on delete cascade,
  level       text,  -- e.g. 'Terminal'
  school      text,  -- e.g. 'Lycée Excellence'
  class       text,  -- e.g. '7C'
  bio         text,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- 2. Create admin_profiles table
create table if not exists public.admin_profiles (
  profile_id  uuid primary key references public.profiles(id) on delete cascade,
  title       text,  -- e.g. 'Directeur Pédagogique'
  permissions jsonb default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- 3. Backfill existing students
insert into public.student_profiles (profile_id, created_at)
select id, created_at
from public.profiles
where role = 'student'
on conflict (profile_id) do nothing;

-- 4. Backfill existing admins
insert into public.admin_profiles (profile_id, created_at)
select id, created_at
from public.profiles
where role = 'admin'
on conflict (profile_id) do nothing;

-- 5. Add indexes for faster lookups
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_profiles_is_active on public.profiles(is_active);

-- 6. Updated_at triggers for new tables
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_student_profiles_updated_at
  before update on public.student_profiles
  for each row execute procedure public.handle_updated_at();

create trigger tr_admin_profiles_updated_at
  before update on public.admin_profiles
  for each row execute procedure public.handle_updated_at();

-- 7. Update handle_new_user to also create student_profile by default
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, role)
  values (new.id, new.phone, 'student')
  on conflict (id) do nothing;

  insert into public.student_profiles (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

notify pgrst, 'reload schema';
