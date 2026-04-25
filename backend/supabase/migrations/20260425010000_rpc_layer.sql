-- ============================================================
-- GOAL 2: CREATE BACKEND FUNCTIONS / RPC LAYER
-- ============================================================

-- 1. Student Dashboard Data
-- Returns profile, stats, and latest courses in one call.
create or replace function public.get_student_dashboard(p_profile_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_result json;
begin
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
      where p.id = p_profile_id
    ),
    'stats', json_build_object(
      'completed_lessons', (select count(*) from user_progress where user_id = p_profile_id and completed = true),
      'total_notes',       (select count(*) from notes where user_id = p_profile_id),
      'total_favorites',   (select count(*) from favorites where user_id = p_profile_id)
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
  ) into v_result;

  return v_result;
end;
$$;

-- 2. Student Course Detail Data
-- Returns course details + lessons + completion state.
create or replace function public.get_student_course_detail(p_profile_id uuid, p_course_slug text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_result json;
  v_course_id uuid;
begin
  select id into v_course_id from courses where slug = p_course_slug;

  if v_course_id is null then
    return null;
  end if;

  select json_build_object(
    'course', (
      select to_jsonb(c) - 'id'
      from courses c
      where c.id = v_course_id
    ),
    'lessons', (
      select json_agg(l)
      from (
        select 
          l.id, l.title, l.description, l.duration, l.order_index, l.is_protected,
          exists(select 1 from user_progress up where up.user_id = p_profile_id and up.lesson_id = l.id and up.completed = true) as is_completed,
          exists(select 1 from student_lesson_access sla where sla.student_id = p_profile_id and sla.lesson_id = l.id) as has_access
        from lessons l
        where l.course_id = v_course_id
        order by l.order_index asc
      ) l
    )
  ) into v_result;

  return v_result;
end;
$$;

-- 3. Student Lesson Access Check
create or replace function public.check_lesson_access(p_profile_id uuid, p_lesson_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_is_admin boolean;
  v_is_protected boolean;
  v_has_access boolean;
  v_is_active boolean;
begin
  -- 1. Check if user is active
  select is_active, (role = 'admin') into v_is_active, v_is_admin 
  from profiles where id = p_profile_id;

  if not v_is_active then
    return json_build_object('can_access', false, 'reason', 'account_inactive');
  end if;

  if v_is_admin then
    return json_build_object('can_access', true, 'reason', 'admin_bypass');
  end if;

  -- 2. Check lesson protection
  select is_protected into v_is_protected from lessons where id = p_lesson_id;

  if not v_is_protected then
    return json_build_object('can_access', true, 'reason', 'lesson_public');
  end if;

  -- 3. Check explicit access
  select exists(
    select 1 from student_lesson_access 
    where student_id = p_profile_id and lesson_id = p_lesson_id
  ) into v_has_access;

  if v_has_access then
    return json_build_object('can_access', true, 'reason', 'granted');
  else
    return json_build_object('can_access', false, 'reason', 'no_permission');
  end if;
end;
$$;

-- 4. Admin Student Access Management
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

-- 5. Admin Monitoring Overview
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
      -- Example: more than 3 IPs for the same user in 24h
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

notify pgrst, 'reload schema';
