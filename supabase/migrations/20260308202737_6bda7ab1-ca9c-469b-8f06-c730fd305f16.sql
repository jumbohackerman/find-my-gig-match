
-- Fix profiles RLS: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Employers can read applicant profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Employers can read applicant profiles" ON public.profiles FOR SELECT USING (
  user_id IN (
    SELECT a.candidate_id FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = auth.uid()
  )
);

-- Fix candidates RLS: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Candidates can manage own profile" ON public.candidates;
DROP POLICY IF EXISTS "Employers can view candidates who applied" ON public.candidates;

CREATE POLICY "Candidates can manage own profile" ON public.candidates FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Employers can view candidates who applied" ON public.candidates FOR SELECT USING (
  (get_user_role(auth.uid()) = 'employer') AND user_id IN (
    SELECT a.candidate_id FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = auth.uid()
  )
);

-- Fix all other tables with restrictive policies
-- applications
DROP POLICY IF EXISTS "Candidates can apply to jobs" ON public.applications;
DROP POLICY IF EXISTS "Candidates can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Candidates can withdraw applications" ON public.applications;
DROP POLICY IF EXISTS "Employers can update application status" ON public.applications;
DROP POLICY IF EXISTS "Employers can view applications to their jobs" ON public.applications;

CREATE POLICY "Candidates can apply to jobs" ON public.applications FOR INSERT WITH CHECK (candidate_id = auth.uid());
CREATE POLICY "Candidates can view own applications" ON public.applications FOR SELECT USING (candidate_id = auth.uid());
CREATE POLICY "Candidates can withdraw applications" ON public.applications FOR DELETE USING (candidate_id = auth.uid());
CREATE POLICY "Employers can update application status" ON public.applications FOR UPDATE USING (job_id IN (SELECT id FROM jobs WHERE employer_id = auth.uid())) WITH CHECK (job_id IN (SELECT id FROM jobs WHERE employer_id = auth.uid()));
CREATE POLICY "Employers can view applications to their jobs" ON public.applications FOR SELECT USING (job_id IN (SELECT id FROM jobs WHERE employer_id = auth.uid()));

-- jobs
DROP POLICY IF EXISTS "Anyone authenticated can view active jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers can delete own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Employers can update own jobs" ON public.jobs;

CREATE POLICY "Anyone authenticated can view active jobs" ON public.jobs FOR SELECT USING (status = 'active' OR employer_id = auth.uid());
CREATE POLICY "Employers can delete own jobs" ON public.jobs FOR DELETE USING (employer_id = auth.uid());
CREATE POLICY "Employers can insert jobs" ON public.jobs FOR INSERT WITH CHECK (employer_id = auth.uid() AND get_user_role(auth.uid()) = 'employer');
CREATE POLICY "Employers can update own jobs" ON public.jobs FOR UPDATE USING (employer_id = auth.uid());

-- messages
DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT USING (
  application_id IN (
    SELECT a.id FROM applications a WHERE a.candidate_id = auth.uid()
    UNION
    SELECT a.id FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = auth.uid()
  )
);
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND application_id IN (
    SELECT a.id FROM applications a WHERE a.candidate_id = auth.uid()
    UNION
    SELECT a.id FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = auth.uid()
  )
);

-- notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- saved_jobs
DROP POLICY IF EXISTS "Users can save jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can unsave jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can view own saved jobs" ON public.saved_jobs;

CREATE POLICY "Users can save jobs" ON public.saved_jobs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unsave jobs" ON public.saved_jobs FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs FOR SELECT USING (user_id = auth.uid());

-- swipe_events
DROP POLICY IF EXISTS "Users can clear own swipe events" ON public.swipe_events;
DROP POLICY IF EXISTS "Users can record swipe events" ON public.swipe_events;
DROP POLICY IF EXISTS "Users can view own swipe events" ON public.swipe_events;

CREATE POLICY "Users can clear own swipe events" ON public.swipe_events FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Users can record swipe events" ON public.swipe_events FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view own swipe events" ON public.swipe_events FOR SELECT USING (user_id = auth.uid());

-- user_preferences
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;

CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own preferences" ON public.user_preferences FOR DELETE USING (user_id = auth.uid());
