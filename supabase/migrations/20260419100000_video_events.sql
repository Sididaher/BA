-- video_events: audit log for video stream access and client-side abuse signals
-- Written by service_role key only; regular auth has no access.

create table if not exists public.video_events (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  lesson_id   uuid        not null references public.lessons(id)  on delete cascade,
  event_type  text        not null,   -- 'stream_access' | 'seek_abuse' | 'tab_hidden'
  metadata    jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

-- Indexes for admin queries (by student, by lesson, by time, by event type)
create index if not exists video_events_user_id_idx    on public.video_events(user_id);
create index if not exists video_events_lesson_id_idx  on public.video_events(lesson_id);
create index if not exists video_events_event_type_idx on public.video_events(event_type);
create index if not exists video_events_created_at_idx on public.video_events(created_at desc);

-- RLS: enabled — all writes go through service_role key (bypasses RLS)
-- No direct client-side access to this table is intended.
alter table public.video_events enable row level security;
