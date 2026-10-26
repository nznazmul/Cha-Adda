-- ==============================================================================
-- UNIQUE MEMBER ID AND AUTOMATIC GENERATION ON SIGNUP
-- ==============================================================================

-- 1. Add unique_id column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS unique_id VARCHAR(32) UNIQUE;

-- 2. Backfill unique_id for existing profiles that don't have one
UPDATE public.profiles
SET unique_id = 'CHA-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 2)) || LPAD((ABS(HASHTEXT(id::text)) % 10000)::text, 4, '0')
WHERE unique_id IS NULL;

-- 3. Update handle_new_user trigger to populate unique_id automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_display_name TEXT;
  v_unique_id TEXT;
BEGIN
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Member'
  );

  v_unique_id := COALESCE(
    NEW.raw_user_meta_data->>'unique_id',
    'CHA-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 2)) || LPAD((ABS(HASHTEXT(NEW.id::text)) % 10000)::text, 4, '0')
  );

  -- Insert starter profile with unique member ID
  INSERT INTO public.profiles (
    id,
    unique_id,
    display_name,
    date_of_birth,
    gender,
    city,
    role,
    account_status,
    is_discoverable,
    profile_complete,
    dating_intentions,
    interests,
    languages
  )
  VALUES (
    NEW.id,
    v_unique_id,
    v_display_name,
    '2000-01-01',
    'other',
    'Dhaka',
    'user',
    'active',
    true,
    false,
    '{}',
    '{}',
    ARRAY['English', 'Bengali']
  )
  ON CONFLICT (id) DO UPDATE
  SET unique_id = COALESCE(public.profiles.unique_id, EXCLUDED.unique_id);

  -- Insert default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert default discovery preferences
  INSERT INTO public.profile_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
