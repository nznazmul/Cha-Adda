-- ==============================================================================
-- ADD VERIFICATION & EXPIRY COLUMNS TO PROFILES TABLE
-- ==============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_verified 
  ON public.profiles(verified, verified_until);
