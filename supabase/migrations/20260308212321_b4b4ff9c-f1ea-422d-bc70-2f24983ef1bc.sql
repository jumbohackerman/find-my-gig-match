
-- Reports table for job/profile reports
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('job', 'profile')),
  target_id text NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_notes text
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Users can view own reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- Audit log table (append-only)
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only the actor can see their own audit entries (admin access via service role)
CREATE POLICY "Users can view own audit entries"
  ON public.audit_log FOR SELECT TO authenticated
  USING (actor_id = auth.uid());

-- Users can insert audit entries for their own actions
CREATE POLICY "Users can insert own audit entries"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Function to hide/unpublish a job (employer only, logs to audit)
CREATE OR REPLACE FUNCTION public.hide_job(_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (SELECT 1 FROM jobs WHERE id = _job_id AND employer_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE jobs SET status = 'hidden' WHERE id = _job_id;

  INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'hide_job', 'job', _job_id::text, jsonb_build_object('previous_status', 'active'));
END;
$$;

-- Function to republish a hidden job
CREATE OR REPLACE FUNCTION public.unhide_job(_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM jobs WHERE id = _job_id AND employer_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE jobs SET status = 'active' WHERE id = _job_id;

  INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), 'unhide_job', 'job', _job_id::text, '{}');
END;
$$;
