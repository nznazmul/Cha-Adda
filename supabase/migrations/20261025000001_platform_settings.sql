-- ==============================================================================
-- PLATFORM SYSTEM SETTINGS TABLE & RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  min_age INTEGER DEFAULT 18 NOT NULL CHECK (min_age >= 18 AND min_age <= 30),
  max_photos INTEGER DEFAULT 6 NOT NULL CHECK (max_photos >= 1 AND max_photos <= 12),
  require_photo_to_discover BOOLEAN DEFAULT true NOT NULL,
  maintenance_mode BOOLEAN DEFAULT false NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public and authenticated) can read system settings
CREATE POLICY "Public read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- 2. Only platform administrators can insert/update system settings
CREATE POLICY "Admin manage platform settings"
  ON public.platform_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Initial default row
INSERT INTO public.platform_settings (id, min_age, max_photos, require_photo_to_discover, maintenance_mode)
VALUES ('current', 18, 6, true, false)
ON CONFLICT (id) DO NOTHING;
