-- ==============================================================================
-- CHA ADDA / PAIRUP DATING PLATFORM - INITIAL DATABASE SCHEMA & RLS
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Clean teardown if needed (for fresh execution)
-- DROP TABLE IF EXISTS admin_audit_logs CASCADE;
-- DROP TABLE IF EXISTS subscriptions CASCADE;
-- DROP TABLE IF EXISTS user_settings CASCADE;
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS reports CASCADE;
-- DROP TABLE IF EXISTS blocks CASCADE;
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS matches CASCADE;
-- DROP TABLE IF EXISTS swipes CASCADE;
-- DROP TABLE IF EXISTS profile_photos CASCADE;
-- DROP TABLE IF EXISTS profile_preferences CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL, -- Private! Age is calculated dynamically
  gender TEXT NOT NULL CHECK (gender IN ('man', 'woman', 'nonbinary', 'other')),
  orientation TEXT,
  bio TEXT,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  job_title TEXT,
  education TEXT,
  height_cm INTEGER CHECK (height_cm IS NULL OR (height_cm >= 90 AND height_cm <= 250)),
  dating_intentions TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  is_discoverable BOOLEAN DEFAULT true,
  profile_complete BOOLEAN DEFAULT false,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  -- 18+ Adult Dating Requirement constraint
  CONSTRAINT chk_adult_age CHECK (
    date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')
  )
);

CREATE INDEX IF NOT EXISTS idx_profiles_discoverable ON profiles(is_discoverable, account_status) 
  WHERE deleted_at IS NULL AND profile_complete = true;
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- ------------------------------------------------------------------------------
-- 4. PROFILE PREFERENCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  min_age INTEGER DEFAULT 18 CHECK (min_age >= 18),
  max_age INTEGER DEFAULT 60 CHECK (max_age >= min_age AND max_age <= 120),
  preferred_genders TEXT[] DEFAULT '{}',
  max_distance_km INTEGER DEFAULT 50 CHECK (max_distance_km > 0),
  location_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. PROFILE PHOTOS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profile_photos_user ON profile_photos(user_id, display_order);

-- ------------------------------------------------------------------------------
-- 6. SWIPES TABLE (Likes and Passes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT uq_swipe_directed_pair UNIQUE (from_user_id, to_user_id),
  CONSTRAINT chk_no_self_swipe CHECK (from_user_id <> to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_from_user ON swipes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_to_user_like ON swipes(to_user_id, action);

-- ------------------------------------------------------------------------------
-- 7. MATCHES TABLE (Canonical mutual pairing)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  unmatched_at TIMESTAMPTZ,
  unmatched_by UUID REFERENCES profiles(id),
  
  -- Canonical pair ordering guarantee: user_a_id < user_b_id
  CONSTRAINT chk_canonical_pair CHECK (user_a_id < user_b_id),
  CONSTRAINT uq_matches_pair UNIQUE (user_a_id, user_b_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(user_a_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(user_b_id, status);

-- ------------------------------------------------------------------------------
-- 8. MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  read_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT chk_message_length CHECK (char_length(content) > 0 AND char_length(content) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_messages_match_time ON messages(match_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- ------------------------------------------------------------------------------
-- 9. BLOCKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT uq_blocks_pair UNIQUE (blocker_id, blocked_id),
  CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

-- ------------------------------------------------------------------------------
-- 10. REPORTS TABLE (Safety & Moderation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'harassment', 'inappropriate_photos', 'spam_scam', 
    'fake_profile', 'underage', 'threats', 'other'
  )),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  moderator_id UUID REFERENCES profiles(id),
  moderation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  CONSTRAINT chk_no_self_report CHECK (reporter_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_user_id);

-- ------------------------------------------------------------------------------
-- 11. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('match', 'message', 'like', 'moderation', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- ------------------------------------------------------------------------------
-- 12. USER SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  notifications_matches BOOLEAN DEFAULT true NOT NULL,
  notifications_messages BOOLEAN DEFAULT true NOT NULL,
  notifications_likes BOOLEAN DEFAULT true NOT NULL,
  incognito_mode BOOLEAN DEFAULT false NOT NULL,
  show_online_status BOOLEAN DEFAULT true NOT NULL,
  show_distance BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 13. SUBSCRIPTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'plus', 'gold', 'platinum')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 14. ADMIN AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON admin_audit_logs(created_at DESC);

-- ==============================================================================
-- 15. ATOMIC BUSINESS LOGIC FUNCTIONS
-- ==============================================================================

-- Function 1: Atomic Swipe and Match Creation
CREATE OR REPLACE FUNCTION record_swipe(
  p_target_id UUID,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id UUID;
  v_reciprocal_like BOOLEAN := false;
  v_user_a UUID;
  v_user_b UUID;
  v_match_id UUID := NULL;
  v_target_profile RECORD;
  v_actor_profile RECORD;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be authenticated to swipe.';
  END IF;

  IF v_actor_id = p_target_id THEN
    RAISE EXCEPTION 'Cannot swipe on own profile.';
  END IF;

  IF p_action NOT IN ('like', 'pass') THEN
    RAISE EXCEPTION 'Invalid swipe action. Must be like or pass.';
  END IF;

  -- Verify no blocks exist between users
  IF EXISTS (
    SELECT 1 FROM blocks 
    WHERE (blocker_id = v_actor_id AND blocked_id = p_target_id)
       OR (blocker_id = p_target_id AND blocked_id = v_actor_id)
  ) THEN
    RAISE EXCEPTION 'Action unavailable due to user safety blocks.';
  END IF;

  -- Record or update the directed swipe atomically
  INSERT INTO swipes (from_user_id, to_user_id, action, created_at)
  VALUES (v_actor_id, p_target_id, p_action, now())
  ON CONFLICT (from_user_id, to_user_id) 
  DO UPDATE SET action = EXCLUDED.action, created_at = now();

  -- If it's a pass, return immediately
  IF p_action = 'pass' THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_match', false,
      'action', 'pass'
    );
  END IF;

  -- If it's a like, check if reciprocal like exists
  SELECT EXISTS (
    SELECT 1 FROM swipes
    WHERE from_user_id = p_target_id
      AND to_user_id = v_actor_id
      AND action = 'like'
  ) INTO v_reciprocal_like;

  IF v_reciprocal_like THEN
    -- Canonical ordering to prevent race duplicates
    v_user_a := LEAST(v_actor_id, p_target_id);
    v_user_b := GREATEST(v_actor_id, p_target_id);

    -- Insert match atomically
    INSERT INTO matches (user_a_id, user_b_id, status, created_at)
    VALUES (v_user_a, v_user_b, 'active', now())
    ON CONFLICT (user_a_id, user_b_id) 
    DO UPDATE SET status = 'active', unmatched_at = NULL, unmatched_by = NULL
    RETURNING id INTO v_match_id;

    -- Fetch names for notifications
    SELECT display_name INTO v_actor_profile FROM profiles WHERE id = v_actor_id;
    SELECT display_name INTO v_target_profile FROM profiles WHERE id = p_target_id;

    -- Create notification for target user
    INSERT INTO notifications (recipient_id, type, title, body, reference_id)
    VALUES (
      p_target_id,
      'match',
      'New Match!',
      'You matched with ' || COALESCE(v_actor_profile.display_name, 'someone special') || '!',
      v_match_id
    );

    -- Create notification for actor user
    INSERT INTO notifications (recipient_id, type, title, body, reference_id)
    VALUES (
      v_actor_id,
      'match',
      'New Match!',
      'You matched with ' || COALESCE(v_target_profile.display_name, 'someone special') || '!',
      v_match_id
    );

    RETURN jsonb_build_object(
      'success', true,
      'is_match', true,
      'match_id', v_match_id,
      'action', 'like'
    );
  END IF;

  -- Liked, but not yet reciprocal
  RETURN jsonb_build_object(
    'success', true,
    'is_match', false,
    'action', 'like'
  );
END;
$$;

-- Function 2: Discovery Feed Generator
CREATE OR REPLACE FUNCTION get_discovery_candidates(
  p_limit INT DEFAULT 20,
  p_city_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  age INT,
  gender TEXT,
  orientation TEXT,
  bio TEXT,
  city TEXT,
  job_title TEXT,
  education TEXT,
  height_cm INT,
  dating_intentions TEXT[],
  interests TEXT[],
  languages TEXT[],
  photos JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_pref RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be signed in for discovery.';
  END IF;

  -- Retrieve user preferences
  SELECT * INTO v_user_pref FROM profile_preferences WHERE user_id = v_user_id;

  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth))::INT AS age,
    p.gender,
    p.orientation,
    p.bio,
    p.city,
    p.job_title,
    p.education,
    p.height_cm,
    p.dating_intentions,
    p.interests,
    p.languages,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ph.id,
            'url', ph.url,
            'is_primary', ph.is_primary,
            'display_order', ph.display_order
          ) ORDER BY ph.is_primary DESC, ph.display_order ASC
        )
        FROM profile_photos ph
        WHERE ph.user_id = p.id AND ph.moderation_status = 'approved'
      ),
      '[]'::jsonb
    ) AS photos
  FROM profiles p
  WHERE p.id <> v_user_id
    AND p.is_discoverable = true
    AND p.profile_complete = true
    AND p.account_status = 'active'
    AND p.deleted_at IS NULL
    -- Exclude candidates already swiped by current user
    AND NOT EXISTS (
      SELECT 1 FROM swipes s 
      WHERE s.from_user_id = v_user_id AND s.to_user_id = p.id
    )
    -- Exclude if either blocked the other
    AND NOT EXISTS (
      SELECT 1 FROM blocks b 
      WHERE (b.blocker_id = v_user_id AND b.blocked_id = p.id)
         OR (b.blocker_id = p.id AND b.blocked_id = v_user_id)
    )
    -- Apply age preference filters
    AND (
      v_user_pref IS NULL OR (
        DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) >= COALESCE(v_user_pref.min_age, 18)
        AND DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) <= COALESCE(v_user_pref.max_age, 100)
      )
    )
    -- Apply gender preference filters
    AND (
      v_user_pref IS NULL 
      OR v_user_pref.preferred_genders IS NULL 
      OR cardinality(v_user_pref.preferred_genders) = 0
      OR p.gender = ANY(v_user_pref.preferred_genders)
    )
    -- Optional city filter fallback
    AND (
      p_city_filter IS NULL 
      OR p_city_filter = '' 
      OR LOWER(p.city) = LOWER(p_city_filter)
    )
  ORDER BY p.updated_at DESC
  LIMIT p_limit;
END;
$$;

-- ==============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin/moderator
CREATE OR REPLACE FUNCTION is_admin_or_moderator()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$;

-- Profiles Policies
CREATE POLICY "Public profile projection readable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (account_status = 'active' AND is_discoverable = true AND profile_complete = true AND deleted_at IS NULL)
    OR id = auth.uid()
    OR is_admin_or_moderator()
  );

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile fields"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent self role-elevation or unbanning
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND account_status = (SELECT account_status FROM profiles WHERE id = auth.uid())
  );

-- Profile Preferences
CREATE POLICY "Users can view own preferences"
  ON profile_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_moderator());

CREATE POLICY "Users can insert/update own preferences"
  ON profile_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Profile Photos
CREATE POLICY "Photos viewable for active profiles"
  ON profile_photos FOR SELECT
  TO authenticated
  USING (
    moderation_status = 'approved'
    OR user_id = auth.uid()
    OR is_admin_or_moderator()
  );

CREATE POLICY "Users manage own photos"
  ON profile_photos FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Swipes
CREATE POLICY "Users view only their own outgoing swipes"
  ON swipes FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR is_admin_or_moderator());

CREATE POLICY "Users can insert swipes as actor"
  ON swipes FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

-- Matches
CREATE POLICY "Users view matches they belong to"
  ON matches FOR SELECT
  TO authenticated
  USING (
    user_a_id = auth.uid() 
    OR user_b_id = auth.uid() 
    OR is_admin_or_moderator()
  );

-- Messages
CREATE POLICY "Conversation participants can read messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
        AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
        AND m.status = 'active'
    )
    OR is_admin_or_moderator()
  );

CREATE POLICY "Conversation participants can insert messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = messages.match_id
        AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
        AND m.status = 'active'
    )
  );

-- Blocks
CREATE POLICY "Users can view and manage their own blocks"
  ON blocks FOR ALL
  TO authenticated
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());

-- Reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins and moderators can view and update reports"
  ON reports FOR ALL
  TO authenticated
  USING (is_admin_or_moderator());

-- Notifications
CREATE POLICY "Users can view and update own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- User Settings
CREATE POLICY "Users view and manage own settings"
  ON user_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Subscriptions
CREATE POLICY "Users view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_moderator());

-- Admin Audit Logs
CREATE POLICY "Only admins and moderators can view audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (is_admin_or_moderator());

-- ==============================================================================
-- 17. REALTIME REPLICATION CONFIGURATION
-- ==============================================================================
-- Enable Realtime for messages and notifications so chat updates instantaneously
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
