-- =====================================================
-- LAST DATING APP - SUPABASE DATABASE SCHEMA
-- =====================================================
-- This schema includes:
-- - All tables with proper constraints
-- - Indexes for performance
-- - Row Level Security (RLS) policies
-- - PostgreSQL functions for matching logic
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geolocation features

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  
  -- Basic Info
  first_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'non-binary', 'other')),
  looking_for TEXT[] NOT NULL DEFAULT '{}',
  
  -- Physical
  height_cm INTEGER NOT NULL CHECK (height_cm >= 100 AND height_cm <= 250),
  ethnicity TEXT NOT NULL,
  
  -- Lifestyle
  religion TEXT NOT NULL,
  offspring TEXT NOT NULL,
  smoker TEXT NOT NULL CHECK (smoker IN ('never', 'rarely', 'sometimes', 'often', 'daily')),
  alcohol TEXT NOT NULL CHECK (alcohol IN ('never', 'rarely', 'sometimes', 'often', 'daily')),
  drugs TEXT NOT NULL CHECK (drugs IN ('never', 'rarely', 'sometimes', 'often', 'daily')),
  diet TEXT NOT NULL,
  
  -- Professional
  occupation TEXT,
  income TEXT,
  
  -- Bio
  bio TEXT,
  things_to_know TEXT,
  
  -- Location (general area, not exact)
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_city TEXT,
  location_state TEXT,
  
  -- Photos
  main_photo_url TEXT,
  main_photo_expires_at TIMESTAMPTZ,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  
  -- Stats
  response_rate DOUBLE PRECISION CHECK (response_rate >= 0 AND response_rate <= 100),
  match_count INTEGER NOT NULL DEFAULT 0,
  
  CONSTRAINT valid_age CHECK (birth_date <= CURRENT_DATE - INTERVAL '18 years')
);

-- Deal Breakers Table
CREATE TABLE deal_breakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Age range
  min_age INTEGER CHECK (min_age >= 18 AND min_age <= 100),
  max_age INTEGER CHECK (max_age >= 18 AND max_age <= 100),
  
  -- Height range (in cm)
  min_height INTEGER CHECK (min_height >= 100 AND min_height <= 250),
  max_height INTEGER CHECK (max_height >= 100 AND max_height <= 250),
  
  -- Distance (in miles)
  max_distance INTEGER CHECK (max_distance > 0),
  
  -- Acceptable values (null means any is acceptable)
  acceptable_ethnicities TEXT[],
  acceptable_religions TEXT[],
  acceptable_offspring TEXT[],
  acceptable_smoker TEXT[],
  acceptable_alcohol TEXT[],
  acceptable_drugs TEXT[],
  acceptable_diets TEXT[],
  acceptable_income TEXT[],
  
  UNIQUE(user_id)
);

-- Swipes Table
CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(swiper_id, swiped_id),
  CHECK (swiper_id != swiped_id)
);

-- Matches Table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unmatched', 'blocked')),
  
  -- Message stats
  total_messages INTEGER NOT NULL DEFAULT 0,
  user1_message_count INTEGER NOT NULL DEFAULT 0,
  user2_message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  
  -- Date suggestion tracking
  date_suggested BOOLEAN NOT NULL DEFAULT false,
  date_suggestion_sent_at TIMESTAMPTZ,
  venue_selected TEXT,
  
  CHECK (user1_id < user2_id), -- Ensure consistent ordering
  UNIQUE(user1_id, user2_id)
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Message Limits Table (for daily message caps)
CREATE TABLE message_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  messages_today INTEGER NOT NULL DEFAULT 0,
  last_message_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  UNIQUE(match_id, user_id)
);

-- Venues Table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  
  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  
  -- Partnership details
  partnership_slot INTEGER NOT NULL CHECK (partnership_slot IN (1, 2, 3)),
  payment_tier TEXT NOT NULL CHECK (payment_tier IN ('subscription', 'per_impression', 'monthly_package')),
  service_radius_miles INTEGER NOT NULL CHECK (service_radius_miles > 0),
  
  -- Content
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  menu_url TEXT,
  website_url TEXT,
  phone TEXT,
  
  -- Stats
  impression_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  date_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Date Suggestions Table
CREATE TABLE date_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  suggested_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Profile Reviews Table
CREATE TABLE profile_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  field TEXT NOT NULL CHECK (field IN ('height', 'age', 'ethnicity', 'photos', 'occupation', 'religion', 'general')),
  is_accurate BOOLEAN NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  
  CHECK (reviewer_id != reviewed_id)
);

-- Reports Table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('fake_profile', 'inappropriate_content', 'harassment', 'spam', 'underage', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CHECK (reporter_id != reported_id)
);

-- Blocks Table
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_location ON profiles(location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
CREATE INDEX idx_profiles_gender_looking_for ON profiles(gender, looking_for);
CREATE INDEX idx_profiles_is_active ON profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_profiles_last_active ON profiles(last_active DESC);

-- Swipes indexes
CREATE INDEX idx_swipes_swiper ON swipes(swiper_id, created_at DESC);
CREATE INDEX idx_swipes_swiped ON swipes(swiped_id);
CREATE INDEX idx_swipes_liked ON swipes(swiper_id, liked) WHERE liked = true;

-- Matches indexes
CREATE INDEX idx_matches_user1 ON matches(user1_id, status);
CREATE INDEX idx_matches_user2 ON matches(user2_id, status);
CREATE INDEX idx_matches_last_message ON matches(last_message_at DESC NULLS LAST);

-- Messages indexes
CREATE INDEX idx_messages_match ON messages(match_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(match_id, read_at) WHERE read_at IS NULL;

-- Venues indexes
CREATE INDEX idx_venues_location ON venues(lat, lng);
CREATE INDEX idx_venues_category ON venues(category) WHERE is_active = true;
CREATE INDEX idx_venues_active ON venues(is_active, partnership_slot);

-- Date suggestions indexes
CREATE INDEX idx_date_suggestions_match ON date_suggestions(match_id, status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_breakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view active, non-deleted profiles"
  ON profiles FOR SELECT
  USING (is_active = true AND is_deleted = false);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Deal breakers policies
CREATE POLICY "Users can view their own deal breakers"
  ON deal_breakers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own deal breakers"
  ON deal_breakers FOR ALL
  USING (auth.uid() = user_id);

-- Swipes policies
CREATE POLICY "Users can view their own swipes"
  ON swipes FOR SELECT
  USING (auth.uid() = swiper_id);

CREATE POLICY "Users can create swipes"
  ON swipes FOR INSERT
  WITH CHECK (auth.uid() = swiper_id);

-- Matches policies
CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages policies
CREATE POLICY "Users can view messages in their matches"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      AND matches.status = 'active'
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = messages.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Message limits policies
CREATE POLICY "Users can view their own message limits"
  ON message_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own message limits"
  ON message_limits FOR ALL
  USING (auth.uid() = user_id);

-- Venues policies (public read)
CREATE POLICY "Anyone can view active venues"
  ON venues FOR SELECT
  USING (is_active = true);

-- Date suggestions policies
CREATE POLICY "Users can view date suggestions for their matches"
  ON date_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = date_suggestions.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create date suggestions for their matches"
  ON date_suggestions FOR INSERT
  WITH CHECK (
    auth.uid() = suggested_by_id AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      AND matches.status = 'active'
    )
  );

CREATE POLICY "Users can update date suggestions for their matches"
  ON date_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id = date_suggestions.match_id
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    )
  );

-- Profile reviews policies
CREATE POLICY "Users can view reviews about themselves"
  ON profile_reviews FOR SELECT
  USING (auth.uid() = reviewed_id OR auth.uid() = reviewer_id);

CREATE POLICY "Users can create reviews"
  ON profile_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Reports policies
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Blocks policies
CREATE POLICY "Users can view their own blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can manage their own blocks"
  ON blocks FOR ALL
  USING (auth.uid() = blocker_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  earth_radius CONSTANT DOUBLE PRECISION := 3959; -- miles
  dlat DOUBLE PRECISION;
  dlng DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2) * sin(dlng/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if two users have mutually liked each other
CREATE OR REPLACE FUNCTION check_mutual_match(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM swipes s1
    WHERE s1.swiper_id = user1 AND s1.swiped_id = user2 AND s1.liked = true
  ) AND EXISTS (
    SELECT 1 FROM swipes s2
    WHERE s2.swiper_id = user2 AND s2.swiped_id = user1 AND s2.liked = true
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get midpoint coordinates between two locations
CREATE OR REPLACE FUNCTION get_midpoint_coordinates(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS TABLE(lat DOUBLE PRECISION, lng DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY SELECT
    (lat1 + lat2) / 2 AS lat,
    (lng1 + lng2) / 2 AS lng;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get compatible profiles for discovery
CREATE OR REPLACE FUNCTION get_compatible_profiles(
  current_user_id UUID,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  birth_date DATE,
  gender TEXT,
  height_cm INTEGER,
  ethnicity TEXT,
  religion TEXT,
  bio TEXT,
  main_photo_url TEXT,
  photo_urls TEXT[],
  distance_miles DOUBLE PRECISION
) AS $$
DECLARE
  user_profile RECORD;
  user_deal_breakers RECORD;
  user_age INTEGER;
BEGIN
  -- Get current user's profile and deal breakers
  SELECT * INTO user_profile FROM profiles WHERE profiles.id = current_user_id;
  SELECT * INTO user_deal_breakers FROM deal_breakers WHERE deal_breakers.user_id = current_user_id;
  
  -- Calculate user's age
  user_age := EXTRACT(YEAR FROM AGE(user_profile.birth_date));
  
  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.birth_date,
    p.gender,
    p.height_cm,
    p.ethnicity,
    p.religion,
    p.bio,
    p.main_photo_url,
    p.photo_urls,
    CASE
      WHEN p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
        AND user_profile.location_lat IS NOT NULL AND user_profile.location_lng IS NOT NULL
      THEN calculate_distance(
        user_profile.location_lat,
        user_profile.location_lng,
        p.location_lat,
        p.location_lng
      )
      ELSE NULL
    END AS distance_miles
  FROM profiles p
  WHERE
    -- Not the current user
    p.id != current_user_id
    -- Active and not deleted
    AND p.is_active = true
    AND p.is_deleted = false
    AND p.is_paused = false
    -- Not already swiped
    AND NOT EXISTS (
      SELECT 1 FROM swipes
      WHERE swiper_id = current_user_id AND swiped_id = p.id
    )
    -- Not blocked
    AND NOT EXISTS (
      SELECT 1 FROM blocks
      WHERE (blocker_id = current_user_id AND blocked_id = p.id)
         OR (blocker_id = p.id AND blocked_id = current_user_id)
    )
    -- Gender compatibility
    AND p.gender = ANY(user_profile.looking_for)
    AND user_profile.gender = ANY(p.looking_for)
    -- Deal breakers: Age
    AND (user_deal_breakers.min_age IS NULL OR EXTRACT(YEAR FROM AGE(p.birth_date)) >= user_deal_breakers.min_age)
    AND (user_deal_breakers.max_age IS NULL OR EXTRACT(YEAR FROM AGE(p.birth_date)) <= user_deal_breakers.max_age)
    -- Deal breakers: Height
    AND (user_deal_breakers.min_height IS NULL OR p.height_cm >= user_deal_breakers.min_height)
    AND (user_deal_breakers.max_height IS NULL OR p.height_cm <= user_deal_breakers.max_height)
    -- Deal breakers: Distance
    AND (
      user_deal_breakers.max_distance IS NULL
      OR p.location_lat IS NULL
      OR p.location_lng IS NULL
      OR user_profile.location_lat IS NULL
      OR user_profile.location_lng IS NULL
      OR calculate_distance(
        user_profile.location_lat,
        user_profile.location_lng,
        p.location_lat,
        p.location_lng
      ) <= user_deal_breakers.max_distance
    )
    -- Deal breakers: Ethnicity
    AND (user_deal_breakers.acceptable_ethnicities IS NULL OR p.ethnicity = ANY(user_deal_breakers.acceptable_ethnicities))
    -- Deal breakers: Religion
    AND (user_deal_breakers.acceptable_religions IS NULL OR p.religion = ANY(user_deal_breakers.acceptable_religions))
    -- Deal breakers: Offspring
    AND (user_deal_breakers.acceptable_offspring IS NULL OR p.offspring = ANY(user_deal_breakers.acceptable_offspring))
    -- Deal breakers: Smoker
    AND (user_deal_breakers.acceptable_smoker IS NULL OR p.smoker = ANY(user_deal_breakers.acceptable_smoker))
    -- Deal breakers: Alcohol
    AND (user_deal_breakers.acceptable_alcohol IS NULL OR p.alcohol = ANY(user_deal_breakers.acceptable_alcohol))
    -- Deal breakers: Drugs
    AND (user_deal_breakers.acceptable_drugs IS NULL OR p.drugs = ANY(user_deal_breakers.acceptable_drugs))
    -- Deal breakers: Diet
    AND (user_deal_breakers.acceptable_diets IS NULL OR p.diet = ANY(user_deal_breakers.acceptable_diets))
    -- Deal breakers: Income
    AND (user_deal_breakers.acceptable_income IS NULL OR p.income = ANY(user_deal_breakers.acceptable_income))
  ORDER BY p.last_active DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create match when mutual like occurs
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
  user1 UUID;
  user2 UUID;
BEGIN
  -- Only proceed if this is a like
  IF NEW.liked = true THEN
    -- Check if there's a mutual like
    IF EXISTS (
      SELECT 1 FROM swipes
      WHERE swiper_id = NEW.swiped_id
        AND swiped_id = NEW.swiper_id
        AND liked = true
    ) THEN
      -- Ensure consistent ordering (user1_id < user2_id)
      IF NEW.swiper_id < NEW.swiped_id THEN
        user1 := NEW.swiper_id;
        user2 := NEW.swiped_id;
      ELSE
        user1 := NEW.swiped_id;
        user2 := NEW.swiper_id;
      END IF;
      
      -- Create the match
      INSERT INTO matches (user1_id, user2_id)
      VALUES (user1, user2)
      ON CONFLICT (user1_id, user2_id) DO NOTHING;
      
      -- Update match counts
      UPDATE profiles SET match_count = match_count + 1 WHERE id = user1;
      UPDATE profiles SET match_count = match_count + 1 WHERE id = user2;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_match_on_mutual_like
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- Trigger to update match stats when message is sent
CREATE OR REPLACE FUNCTION update_match_on_message()
RETURNS TRIGGER AS $$
DECLARE
  match_record RECORD;
BEGIN
  -- Get the match record
  SELECT * INTO match_record FROM matches WHERE id = NEW.match_id;
  
  -- Update match statistics
  UPDATE matches
  SET
    total_messages = total_messages + 1,
    user1_message_count = CASE WHEN NEW.sender_id = match_record.user1_id THEN user1_message_count + 1 ELSE user1_message_count END,
    user2_message_count = CASE WHEN NEW.sender_id = match_record.user2_id THEN user2_message_count + 1 ELSE user2_message_count END,
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100)
  WHERE id = NEW.match_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_match_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_match_on_message();

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- You can add sample venues here if needed
-- INSERT INTO venues (name, category, address, city, state, zip_code, lat, lng, partnership_slot, payment_tier, service_radius_miles)
-- VALUES ('Sample Restaurant', 'italian', '123 Main St', 'San Francisco', 'CA', '94102', 37.7749, -122.4194, 1, 'subscription', 10);

-- =====================================================
-- GRANTS (if needed for service role)
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
