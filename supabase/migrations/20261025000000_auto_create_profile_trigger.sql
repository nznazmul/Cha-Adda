-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER FOR AUTH USERS
-- ==============================================================================

-- 1. Create function to automatically insert profile, user_settings, and profile_preferences
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  -- Determine display name: raw_user_meta_data -> email username -> 'Member'
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Member'
  );

  -- Insert starter profile
  INSERT INTO public.profiles (
    id,
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
    ARRAY['English']
  )
  ON CONFLICT (id) DO NOTHING;

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

-- 2. Drop existing trigger if present and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
