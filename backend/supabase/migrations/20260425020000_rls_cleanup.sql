-- ============================================================
-- GOAL 3 & 4: RLS CLEANUP & PERFORMANCE
-- ============================================================

-- 1. Tighten RLS: Disable direct client access for sensitive tables
-- We want the app to use our RPC functions or Server Actions (service role).

-- PROFILES: Users can still see their own profile, but only specific fields.
-- Actually, the prompt says "deno direct access from anon/authenticated where needed".
-- I will keep basic "own profile" select but tighten others.

alter table public.profiles disable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles 
  for select using (auth.uid() = id);

-- OTP_REQUESTS: Ensure it stays locked
alter table public.otp_requests disable row level security;
alter table public.otp_requests enable row level security;
-- No policies = deny all except service role.

-- STUDENT_LESSON_ACCESS: Lock it down
alter table public.student_lesson_access disable row level security;
alter table public.student_lesson_access enable row level security;
-- Service role only for management.

-- VIDEO_EVENTS: Lock it down
alter table public.video_events disable row level security;
alter table public.video_events enable row level security;
-- Service role only for logging (fire-and-forget).

-- 2. Performance: Add missing indexes
create index if not exists idx_auth_sessions_token_hash on public.auth_sessions(token_hash);
create index if not exists idx_student_lesson_access_composite on public.student_lesson_access(student_id, lesson_id);
create index if not exists idx_lessons_course_order on public.lessons(course_id, order_index);
create index if not exists idx_video_events_composite on public.video_events(user_id, lesson_id, event_type, created_at);
create index if not exists idx_user_progress_user_completed on public.user_progress(user_id, completed);

-- 3. Fix Supabase Advisor warnings
-- Security Definer functions should have a search_path set.
-- Already done in get_student_dashboard etc.

-- Fix for public.is_admin if it exists
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

notify pgrst, 'reload schema';
