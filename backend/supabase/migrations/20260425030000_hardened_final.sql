-- ============================================================
-- FINAL HARDENED BACKEND ARCHITECTURE
-- BacEnglish - Production-Grade Security & Performance
-- ============================================================

-- 0. ENSURE TABLES EXIST (Safe creation)
-- ------------------------------------------------------------

create table if not exists public.auth_sessions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  token_hash text        not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.video_events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  lesson_id  uuid        not null references public.lessons(id) on delete cascade,
  event_type text        not null,
  metadata   jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.student_lesson_access (
  id         uuid        primary key default gen_random_uuid(),
  student_id uuid        not null references public.profiles(id) on delete cascade,
  lesson_id  uuid        not null references public.lessons(id) on delete cascade,
  granted_by uuid        references public.profiles(id),
  granted_at timestamptz not null default now(),
  unique(student_id, lesson_id)
);

create table if not exists public.user_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  completed       boolean not null default false,
  watched_seconds integer not null default 0,
  completed_at    timestamptz,
  unique(user_id, lesson_id)
);

-- 1. HARDEN RLS (Deny All Default)
-- ------------------------------------------------------------

-- Lock sensitive tables from direct client access
alter table public.auth_sessions          enable row level security;
alter table public.video_events           enable row level security;
alter table public.student_lesson_access  enable row level security;
alter table public.otp_requests           enable row level security;
alter table public.user_progress          enable row level security;

-- Explicitly deny all for direct client access
drop policy if exists "no direct access" on public.auth_sessions;
create policy "no direct access" on public.auth_sessions for all using (false);

drop policy if exists "no direct access" on public.video_events;
create policy "no direct access" on public.video_events for all using (false);

drop policy if exists "no direct access" on public.student_lesson_access;
create policy "no direct access" on public.student_lesson_access for all using (false);

drop policy if exists "no direct access" on public.otp_requests;
create policy "no direct access" on public.otp_requests for all using (false);

-- Note: PROFILES, COURSES, LESSONS still have standard RLS if needed,
-- but our RPC layer will handle most logic.

-- 2. SECURE API LAYER (RPC)
-- ------------------------------------------------------------

-- Nettoyage des anciennes versions (permet le renommage des paramètres)
drop function if exists public.get_student_dashboard(uuid);
drop function if exists public.get_student_course_detail(uuid, text);
drop function if exists public.check_lesson_access(uuid, uuid);
drop function if exists public.admin_get_monitoring_stats();
drop function if exists public.admin_get_overview();
drop function if exists public.admin_get_recent_students();
drop function if exists public.admin_get_top_courses();
drop function if exists public.auth_validate_session(text);
drop function if exists public.auth_invalidate_session(text);
drop function if exists public.log_video_event(uuid, uuid, text, jsonb);
drop function if exists public.auth_create_session(uuid, text, timestamptz);
drop function if exists public.otp_create_request(text, text, timestamptz);
drop function if exists public.otp_verify_and_mark(text, text);
drop function if exists public.admin_get_student_access_state(uuid);
drop function if exists public.admin_set_lesson_access(uuid, uuid, boolean);
drop function if exists public.admin_get_analytics();
drop function if exists public.admin_get_all_students();
drop function if exists public.admin_toggle_student_active(uuid, boolean);

-- A. Student Dashboard
create or replace function public.get_student_dashboard(p_user_id uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  -- Debug log
  raise log '[API] Dashboard fetch for user: %', p_user_id;

  return (
    select json_build_object(
      'profile', (
        select json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url,
          'role', p.role,
          'is_active', p.is_active,
          'level', sp.level
        )
        from profiles p
        left join student_profiles sp on sp.profile_id = p.id
        where p.id = p_user_id
      ),
      'stats', json_build_object(
        'completed_lessons', (select count(*) from user_progress where user_id = p_user_id and completed = true),
        'total_notes',       (select count(*) from notes where user_id = p_user_id),
        'total_favorites',   (select count(*) from favorites where user_id = p_user_id)
      ),
      'recent_courses', (
        select json_agg(c)
        from (
          select id, title, slug, thumbnail_url, category
          from courses
          where is_published = true
          order by created_at desc
          limit 6
        ) c
      )
    )
  );
end;
$$;

-- B. Student Course Detail
create or replace function public.get_student_course_detail(p_user_id uuid, p_slug text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_course_id uuid;
begin
  select id into v_course_id from courses where slug = p_slug;
  if v_course_id is null then return null; end if;

  return (
    select json_build_object(
      'course', (select to_jsonb(c) from courses c where c.id = v_course_id),
      'is_favorited', exists(select 1 from favorites where user_id = p_user_id and course_id = v_course_id),
      'lessons', (
        select json_agg(l)
        from (
          select 
            l.id, l.title, l.description, l.duration, l.order_index, l.is_protected,
            exists(select 1 from user_progress up where up.user_id = p_user_id and up.lesson_id = l.id and up.completed = true) as is_completed,
            exists(select 1 from student_lesson_access sla where sla.student_id = p_user_id and sla.lesson_id = l.id) as has_access
          from lessons l
          where l.course_id = v_course_id
          order by l.order_index asc
        ) l
      )
    )
  );
end;
$$;

-- C. Check Lesson Access
create or replace function public.check_lesson_access(p_user_id uuid, p_lesson_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_is_admin boolean;
  v_is_protected boolean;
  v_has_access boolean;
  v_is_active boolean;
begin
  select is_active, (role = 'admin') into v_is_active, v_is_admin from profiles where id = p_user_id;

  if not v_is_active then
    return json_build_object('can_access', false, 'reason', 'inactive');
  end if;

  if v_is_admin then
    return json_build_object('can_access', true, 'reason', 'admin');
  end if;

  select is_protected into v_is_protected from lessons where id = p_lesson_id;
  if not v_is_protected then
    return json_build_object('can_access', true, 'reason', 'public');
  end if;

  select exists(select 1 from student_lesson_access where student_id = p_user_id and lesson_id = p_lesson_id) into v_has_access;

  raise log '[API] Access check: user %, lesson %, result %', p_user_id, p_lesson_id, v_has_access;

  if v_has_access then
    return json_build_object('can_access', true, 'reason', 'granted');
  else
    return json_build_object('can_access', false, 'reason', 'forbidden');
  end if;
end;
$$;

-- D. Admin Monitoring Stats
create or replace function public.admin_get_monitoring_stats()
returns json language plpgsql security definer set search_path = public as $$
begin
  return json_build_object(
    'recent_events', (
      select json_agg(e)
      from (
        select ve.*, p.full_name, l.title as lesson_title
        from video_events ve
        join profiles p on p.id = ve.user_id
        join lessons l on l.id = ve.lesson_id
        order by ve.created_at desc
        limit 20
      ) e
    ),
    'suspicious_activity', (
      select json_agg(s)
      from (
        select user_id, p.full_name, count(distinct (metadata->>'ip')) as ip_count
        from video_events ve
        join profiles p on p.id = ve.user_id
        where ve.created_at > now() - interval '24 hours'
        group by user_id, p.full_name
        having count(distinct (metadata->>'ip')) > 3
      ) s
    )
  );
end;
$$;

-- E. Admin Overview KPI
create or replace function public.admin_get_overview()
returns json language plpgsql security definer set search_path = public as $$
begin
  return json_build_object(
    'totalStudents',      (select count(*) from profiles where role = 'student'),
    'totalCourses',       (select count(*) from courses),
    'totalLessons',       (select count(*) from lessons),
    'completedLessons',   (select count(*) from user_progress where completed = true),
    'totalNotifications', (select count(*) from notifications)
  );
end;
$$;

-- F. Admin Recent Students
create or replace function public.admin_get_recent_students()
returns json language plpgsql security definer set search_path = public as $$
begin
  return (
    select json_agg(s)
    from (
      select id, full_name, phone, created_at, is_active
      from profiles
      where role = 'student'
      order by created_at desc
      limit 5
    ) s
  );
end;
$$;

-- G. Admin Top Courses
create or replace function public.admin_get_top_courses()
returns json language plpgsql security definer set search_path = public as $$
begin
  return (
    select json_agg(c)
    from (
      select id, title, rating, category
      from courses
      where is_published = true
      order by rating desc
      limit 5
    ) c
  );
end;
$$;

-- H. Session Validation
create or replace function public.auth_validate_session(p_token_hash text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_profile json;
begin
  select user_id into v_user_id 
  from auth_sessions 
  where token_hash = p_token_hash 
    and expires_at > now();

  if v_user_id is null then
    return null;
  end if;

  select json_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'role', p.role,
    'is_active', p.is_active
  ) into v_profile
  from profiles p
  where p.id = v_user_id;

  return v_profile;
end;
$$;

-- I. Session Invalidation (Logout)
create or replace function public.auth_invalidate_session(p_token_hash text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from auth_sessions where token_hash = p_token_hash;
end;
$$;

-- J. Video Event Logging
create or replace function public.log_video_event(
  p_user_id uuid, 
  p_lesson_id uuid, 
  p_event_type text, 
  p_metadata jsonb default '{}'::jsonb
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into video_events (user_id, lesson_id, event_type, metadata)
  values (p_user_id, p_lesson_id, p_event_type, p_metadata);
end;
$$;

-- K. Admin Access Management
create or replace function public.admin_get_student_access_state(p_student_id uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  return (
    select json_agg(r)
    from (
      select 
        l.id as lesson_id,
        l.title as lesson_title,
        c.title as course_title,
        l.is_protected,
        exists(select 1 from student_lesson_access sla where sla.student_id = p_student_id and sla.lesson_id = l.id) as has_access
      from lessons l
      join courses c on c.id = l.course_id
      where l.is_protected = true
      order by c.title, l.order_index
    ) r
  );
end;
$$;

create or replace function public.admin_set_lesson_access(
  p_student_id uuid,
  p_lesson_id uuid,
  p_has_access boolean
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_has_access then
    insert into student_lesson_access (student_id, lesson_id, granted_by)
    values (p_student_id, p_lesson_id, auth.uid())
    on conflict (student_id, lesson_id) do nothing;
  else
    delete from student_lesson_access
    where student_id = p_student_id and lesson_id = p_lesson_id;
  end if;
end;
$$;

-- L. Edge Function Helpers (Auth & OTP)
create or replace function public.auth_create_session(
  p_user_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into auth_sessions (user_id, token_hash, expires_at)
  values (p_user_id, p_token_hash, p_expires_at);
end;
$$;

create or replace function public.otp_create_request(
  p_phone text,
  p_code_hash text,
  p_expires_at timestamptz
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into otp_requests (phone, code_hash, expires_at)
  values (p_phone, p_code_hash, p_expires_at);
end;
$$;

create or replace function public.otp_verify_and_mark(
  p_phone text,
  p_code_hash text
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_otp_id uuid;
  v_attempts int;
begin
  select id, attempts into v_otp_id, v_attempts
  from otp_requests
  where phone = p_phone 
    and code_hash = p_code_hash 
    and verified = false 
    and expires_at > now()
  order by created_at desc
  limit 1;

  if v_otp_id is null then
    return json_build_object('success', false, 'reason', 'invalid_or_expired');
  end if;

  update otp_requests set verified = true where id = v_otp_id;
  return json_build_object('success', true);
end;
$$;

-- M. Admin Analytics Aggregation
create or replace function public.admin_get_analytics()
returns json language plpgsql security definer set search_path = public as $$
begin
  return json_build_object(
    'top_courses', (
      select json_agg(c)
      from (
        select c.id, c.title, count(up.id) as completion_count
        from courses c
        join lessons l on l.course_id = c.id
        join user_progress up on up.lesson_id = l.id
        where up.completed = true
        group by c.id, c.title
        order by completion_count desc
        limit 5
      ) c
    ),
    'active_students_count', (
      select count(distinct user_id)
      from user_progress
      where created_at > now() - interval '30 days'
    )
  );
end;
$$;

-- N. Admin Student Management
create or replace function public.admin_get_all_students()
returns json language plpgsql security definer set search_path = public as $$
begin
  return (
    select json_agg(s)
    from (
      select id, full_name, phone, created_at, is_active
      from profiles
      where role = 'student'
      order by created_at desc
    ) s
  );
end;
$$;

create or replace function public.admin_toggle_student_active(
  p_student_id uuid,
  p_is_active boolean
)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles set is_active = p_is_active where id = p_student_id;
end;
$$;

-- 3. PERFORMANCE OPTIMIZATION (Indexes)
-- ------------------------------------------------------------

create index if not exists idx_sessions_token on public.auth_sessions(token_hash);
create index if not exists idx_access_student_lesson on public.student_lesson_access(student_id, lesson_id);
create index if not exists idx_video_events_user_time on public.video_events(user_id, created_at desc);
create index if not exists idx_user_progress_composite on public.user_progress(user_id, lesson_id, completed);

-- 4. HOUSEKEEPING
-- ------------------------------------------------------------

-- Fix mutable search path for is_admin
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

notify pgrst, 'reload schema';
