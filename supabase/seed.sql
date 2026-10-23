-- ==============================================================================
-- CHA ADDA — FICTIONAL DEVELOPMENT SEED DATA
-- Safe development test users and sample profiles (All 18+)
-- ==============================================================================

-- 1. Insert Sample Dev Users into auth.users (if running locally against Supabase CLI)
DO $$
DECLARE
  v_user1_id UUID := '11111111-1111-4111-a111-111111111111';
  v_user2_id UUID := '22222222-2222-4222-a222-222222222222';
  v_user3_id UUID := '33333333-3333-4333-a333-333333333333';
  v_user4_id UUID := '44444444-4444-4444-a444-444444444444';
  v_admin_id UUID := '99999999-9999-4999-a999-999999999999';
BEGIN
  -- Insert into profiles
  INSERT INTO profiles (
    id, display_name, date_of_birth, gender, orientation, bio, 
    city, job_title, education, height_cm, dating_intentions, 
    interests, languages, is_discoverable, profile_complete, account_status, role
  ) VALUES
    (
      v_user1_id, 'Aria Vance', '1998-05-14', 'woman', 'Straight',
      'Architect by day, vinyl collector and rooftop barista by night. Always looking for genuine conversations and great chai.',
      'Dhaka', 'Architect', 'University of Dhaka', 168,
      ARRAY['Long-term relationship', 'Serious dating'],
      ARRAY['Architecture', 'Music', 'Travel', 'Coffee', 'Art'],
      ARRAY['English', 'Bengali'],
      true, true, 'active', 'user'
    ),
    (
      v_user2_id, 'Julian Ross', '1996-09-22', 'man', 'Straight',
      'Software designer, amateur photographer, and weekend trekker. Looking for someone who enjoys spontaneous weekend trips.',
      'Dhaka', 'Product Designer', 'BUET', 182,
      ARRAY['Long-term relationship'],
      ARRAY['Technology', 'Photography', 'Outdoor activities', 'Fitness'],
      ARRAY['English', 'Bengali'],
      true, true, 'active', 'user'
    ),
    (
      v_user3_id, 'Maya Lin', '2000-02-18', 'woman', 'Bisexual',
      'Art curator and avid book lover. Let’s explore independent bookstores and late-night noodle spots.',
      'Dhaka', 'Curator', 'Chittagong University', 164,
      ARRAY['Casual dating', 'Friendship'],
      ARRAY['Art', 'Books', 'Food', 'Movies'],
      ARRAY['English', 'Bengali', 'French'],
      true, true, 'active', 'user'
    ),
    (
      v_user4_id, 'Kaelen Miller', '1995-11-04', 'man', 'Straight',
      'Culinary explorer and jazz enthusiast. Big fan of street food markets and indie films.',
      'Dhaka', 'Chef & Restaurateur', 'Culinary Institute', 178,
      ARRAY['Serious dating'],
      ARRAY['Food', 'Cooking', 'Music', 'Travel', 'Pets'],
      ARRAY['English'],
      true, true, 'active', 'user'
    ),
    (
      v_admin_id, 'System Admin', '1990-01-01', 'nonbinary', 'Queer',
      'Platform administrator for safety & moderation testing.',
      'Dhaka', 'Trust & Safety Lead', 'Master of Law', 172,
      ARRAY['Friendship'],
      ARRAY['Technology', 'Books'],
      ARRAY['English'],
      false, true, 'active', 'admin'
    )
  ON CONFLICT (id) DO NOTHING;

  -- Insert Photos
  INSERT INTO profile_photos (user_id, storage_path, url, display_order, is_primary, moderation_status)
  VALUES
    (v_user1_id, 'dev/aria-1.jpg', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', 0, true, 'approved'),
    (v_user1_id, 'dev/aria-2.jpg', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80', 1, false, 'approved'),
    (v_user2_id, 'dev/julian-1.jpg', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80', 0, true, 'approved'),
    (v_user2_id, 'dev/julian-2.jpg', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80', 1, false, 'approved'),
    (v_user3_id, 'dev/maya-1.jpg', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80', 0, true, 'approved'),
    (v_user4_id, 'dev/kaelen-1.jpg', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80', 0, true, 'approved'),
    (v_admin_id, 'dev/admin-1.jpg', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80', 0, true, 'approved')
  ON CONFLICT DO NOTHING;

  -- Insert Preferences
  INSERT INTO profile_preferences (user_id, min_age, max_age, preferred_genders, max_distance_km)
  VALUES
    (v_user1_id, 23, 35, ARRAY['man'], 30),
    (v_user2_id, 21, 32, ARRAY['woman'], 30),
    (v_user3_id, 20, 34, ARRAY['man', 'woman'], 25),
    (v_user4_id, 22, 33, ARRAY['woman'], 40),
    (v_admin_id, 18, 60, ARRAY['man', 'woman', 'nonbinary'], 100)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert User Settings
  INSERT INTO user_settings (user_id, theme)
  VALUES
    (v_user1_id, 'dark'),
    (v_user2_id, 'dark'),
    (v_user3_id, 'light'),
    (v_user4_id, 'dark'),
    (v_admin_id, 'dark')
  ON CONFLICT (user_id) DO NOTHING;
END $$;
