-- Per-student lesson entitlement table.
-- When is_protected=true on a lesson, a student must have a row here to access it.
-- is_protected=false lessons are open to all active students with no entitlement check.
-- Admins bypass all entitlement checks in application code (service role key, no RLS needed).

CREATE TABLE IF NOT EXISTS public.student_lesson_access (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  lesson_id  UUID        NOT NULL REFERENCES public.lessons(id)   ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_sla_student ON public.student_lesson_access(student_id);
CREATE INDEX IF NOT EXISTS idx_sla_lesson  ON public.student_lesson_access(lesson_id);

-- No RLS policies needed: the server always uses the service role key
-- (src/lib/supabase/server.ts) and enforces authorization manually.
ALTER TABLE public.student_lesson_access ENABLE ROW LEVEL SECURITY;
