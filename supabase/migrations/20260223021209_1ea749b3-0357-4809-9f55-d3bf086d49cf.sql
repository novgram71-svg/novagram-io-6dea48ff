
-- Add server-side verification code storage for password reset flow
ALTER TABLE password_reset_requests 
ADD COLUMN IF NOT EXISTS verification_code_hash text,
ADD COLUMN IF NOT EXISTS code_expires_at timestamptz;
