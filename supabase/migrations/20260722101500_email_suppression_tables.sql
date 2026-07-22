-- Transactional email infrastructure (suppression, unsubscribe tokens, send log).
-- Used by edge functions: send-admin-message-emails, send-transactional-email,
-- handle-email-suppression, handle-email-unsubscribe.

CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('bounce', 'complaint', 'unsubscribe')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suppressed_emails_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_suppressed_emails_email
  ON public.suppressed_emails (lower(email));

COMMENT ON TABLE public.suppressed_emails IS
  'E-mailadressen die geen transactionele mail meer mogen ontvangen (bounce/klacht/afmelding).';

CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token text NOT NULL,
  email text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_unsubscribe_tokens_token_key UNIQUE (token),
  CONSTRAINT email_unsubscribe_tokens_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribe_tokens_email
  ON public.email_unsubscribe_tokens (lower(email));

COMMENT ON TABLE public.email_unsubscribe_tokens IS
  'Eén afmeld-token per e-mailadres voor transactionele mails met unsubscribe-link.';

CREATE TABLE IF NOT EXISTS public.email_send_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id uuid,
  template_name text NOT NULL,
  recipient_email text NOT NULL,
  status text NOT NULL CHECK (
    status IN ('pending', 'sent', 'failed', 'suppressed', 'bounced', 'complained')
  ),
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_send_log_recipient_created
  ON public.email_send_log (lower(recipient_email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_send_log_message_id
  ON public.email_send_log (message_id)
  WHERE message_id IS NOT NULL;

COMMENT ON TABLE public.email_send_log IS
  'Auditlog voor transactionele e-mailpogingen (queue, suppressie, fouten).';

ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

-- Alleen edge functions (service_role) mogen deze tabellen benaderen.
REVOKE ALL ON public.suppressed_emails FROM anon, authenticated;
REVOKE ALL ON public.email_unsubscribe_tokens FROM anon, authenticated;
REVOKE ALL ON public.email_send_log FROM anon, authenticated;

GRANT ALL ON public.suppressed_emails TO service_role;
GRANT ALL ON public.email_unsubscribe_tokens TO service_role;
GRANT ALL ON public.email_send_log TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
