
CREATE TABLE public.assistant_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  program_id text,
  program_name text,
  ai_confidence text,
  engine_verdict text,
  reason text,
  signals jsonb,
  message_excerpt text,
  route text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.assistant_events TO anon, authenticated;
GRANT SELECT ON public.assistant_events TO authenticated;
GRANT ALL ON public.assistant_events TO service_role;
ALTER TABLE public.assistant_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_insert_any ON public.assistant_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY events_select_admin ON public.assistant_events FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.chat_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role text NOT NULL,
  content text NOT NULL,
  signals jsonb,
  route text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.chat_answers TO anon, authenticated;
GRANT SELECT ON public.chat_answers TO authenticated;
GRANT ALL ON public.chat_answers TO service_role;
ALTER TABLE public.chat_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY answers_insert_any ON public.chat_answers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY answers_select_admin ON public.chat_answers FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX assistant_events_created_at_idx ON public.assistant_events (created_at DESC);
CREATE INDEX chat_answers_created_at_idx ON public.chat_answers (created_at DESC);
