-- ============================================================
-- Subscription enforcement + abuse flagging
-- ============================================================

-- 1. Subscription fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status     text        NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'expired', 'suspended')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_flagged              boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason             text;

-- 2. HLS URL prep on lessons (future segment-based delivery)
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS hls_url text;

-- 3. Index for fast subscription queries (e.g. expiry jobs)
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx
  ON public.profiles(subscription_status);

CREATE INDEX IF NOT EXISTS profiles_subscription_expires_at_idx
  ON public.profiles(subscription_expires_at);

-- 4. New event types are stored as text in video_events — no schema change needed.
--    Extend ALLOWED_EVENTS allowlist in application code:
--    'playback_started' | 'playback_completed' | 'multiple_sessions_detected'

NOTIFY pgrst, 'reload schema';
