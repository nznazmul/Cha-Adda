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

  -- Insert Safe Meeting Spots (নিরাপদ ক্যাফে স্পট)
  INSERT INTO meeting_spots (name, area, city, address, google_maps_url, safety_tip, image_url, is_active, display_order)
  VALUES
    (
      'North End Coffee Roasters (Banani 11)',
      'Banani',
      'Dhaka',
      'Road 11, Block D, Banani, Dhaka 1213',
      'https://maps.google.com/?q=North+End+Coffee+Roasters+Banani',
      'উন্মুক্ত পরিবেশ, ডেডিকেটেড সিকিউরিটি এবং প্রচুর ক্রাউড থাকার কারণে প্রথম সাক্ষাতের জন্য অত্যন্ত নিরাপদ।',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      true,
      1
    ),
    (
      'Gloria Jean''s Coffees (Gulshan-1)',
      'Gulshan-1',
      'Dhaka',
      'Plot 35, Road 24, Navana Tower, Gulshan-1, Dhaka',
      'https://maps.google.com/?q=Gloria+Jeans+Coffees+Gulshan+1',
      'মূল সড়কের পাশে, সিসিটিভি সম্বলিত আন্তর্জাতিক ক্যাফে চেইন।',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
      true,
      2
    ),
    (
      'Crimson Cup (Dhanmondi 27)',
      'Dhanmondi',
      'Dhaka',
      'House 27, Road 27 (Old), Dhanmondi, Dhaka',
      'https://maps.google.com/?q=Crimson+Cup+Coffee+Dhanmondi',
      'পর্যাপ্ত আলো ও সেন্ট্রাল ধানমন্ডি লোকেশন। প্রথম মিটের জন্য আদর্শ।',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
      true,
      3
    ),
    (
      'Tabaq Coffee (Jamuna Future Park)',
      'Bashundhara',
      'Dhaka',
      'Level 5, Jamuna Future Park, Kuril, Dhaka',
      'https://maps.google.com/?q=Jamuna+Future+Park+Dhaka',
      'বিশাল শপিংমল সিকিউরিটি ও পারিবারিক আবহে স্বাচ্ছন্দ্য বোধ করবেন।',
      'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=800&q=80',
      true,
      4
    ),
    (
      'The Coffee Bean & Tea Leaf (Uttara)',
      'Uttara',
      'Dhaka',
      'Sector 3, Jasimuddin Avenue, Uttara, Dhaka',
      'https://maps.google.com/?q=Coffee+Bean+Tea+Leaf+Uttara',
      'উত্তরা এয়ারপোর্ট রোডের কাছে পরিচ্ছন্ন ও সার্বক্ষণিক পাবলিক স্পেস।',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80',
      true,
      5
    ),
    (
      'Ajo Idea Space (Uttara Sector 13)',
      'Uttara',
      'Dhaka',
      'House 28, Gausul Azam Avenue, Sector 13, Uttara, Dhaka',
      'https://maps.google.com/?q=Ajo+Idea+Space+Uttara',
      'শান্ত ও নান্দনিক ক্রিয়েটিভ পরিবেশ, চিল আড্ডার জন্য প্রশংসিত।',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
      true,
      6
    )
  ON CONFLICT DO NOTHING;
END $$;

