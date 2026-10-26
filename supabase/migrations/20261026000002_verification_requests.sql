-- ==============================================================================
-- VERIFICATION REQUESTS TABLE (SELFIE CAMERA FACE CAPTURE & BLUE TICK APPROVAL)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selfie_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  duration TEXT CHECK (duration IN ('1_month', '2_months', '3_months', '6_months', '1_year', 'lifetime')),
  admin_notes TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning fast admin queue filtering
CREATE INDEX IF NOT EXISTS idx_verification_requests_status 
  ON public.verification_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user 
  ON public.verification_requests(user_id, status);

-- Enable Row Level Security
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own verification requests"
  ON public.verification_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own verification request
CREATE POLICY "Users can create own verification request"
  ON public.verification_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins/Moderators can view all verification requests
CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Policy: Admins/Moderators can update verification requests
CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );
