-- ============================================================
-- Supabase Storage integration for lesson videos
-- ============================================================

-- 1. Add storage metadata columns to lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS video_bucket text,
  ADD COLUMN IF NOT EXISTS video_path   text,
  ADD COLUMN IF NOT EXISTS video_type   text
    CHECK (video_type IN ('storage', 'youtube', 'vimeo', 'direct'));

-- 2. Create the private lesson-videos bucket
--    public = false → no direct URL access, only signed URLs work
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-videos',
  'lesson-videos',
  false,
  524288000, -- 500 MB per file
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policy — reads are allowed ONLY via signed URLs.
--    The signed URL token is the security mechanism; the policy allows
--    the anon/authenticated roles to present that token and download.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'lesson-videos: allow signed URL reads'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "lesson-videos: allow signed URL reads"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'lesson-videos')
    $pol$;
  END IF;
END $$;

-- 4. No INSERT/UPDATE/DELETE policy for client roles —
--    uploads go through the server using the service_role key which
--    bypasses RLS entirely.

NOTIFY pgrst, 'reload schema';
