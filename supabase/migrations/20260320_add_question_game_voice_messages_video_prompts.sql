-- Add voice_calls_enabled to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_calls_enabled BOOLEAN NOT NULL DEFAULT false;

-- Question Games
CREATE TABLE question_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'waiting', 'revealed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revealed_at TIMESTAMPTZ
);

CREATE TABLE question_game_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES question_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer TEXT NOT NULL CHECK (LENGTH(answer) > 0 AND LENGTH(answer) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Voice Messages
CREATE TABLE voice_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  audio_storage_path TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 60),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  listened_at TIMESTAMPTZ
);

-- Video Prompts
CREATE TABLE video_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_key TEXT,
  video_url TEXT NOT NULL,
  video_storage_path TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 30),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_question_games_match ON question_games(match_id, status);
CREATE INDEX idx_question_game_answers_game ON question_game_answers(game_id);
CREATE INDEX idx_voice_messages_match ON voice_messages(match_id, created_at DESC);
CREATE INDEX idx_voice_messages_sender ON voice_messages(sender_id);
CREATE INDEX idx_video_prompts_user ON video_prompts(user_id) WHERE is_active = true;

-- RLS
ALTER TABLE question_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_prompts ENABLE ROW LEVEL SECURITY;

-- Question game policies
CREATE POLICY "Match participants can view games"
  ON question_games FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM matches WHERE matches.id = question_games.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  ));

CREATE POLICY "Match participants can create games"
  ON question_games FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM matches WHERE matches.id = match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
    AND matches.status = 'active'
  ));

CREATE POLICY "Match participants can update games"
  ON question_games FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM matches WHERE matches.id = question_games.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  ));

CREATE POLICY "Match participants can view game answers"
  ON question_game_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM question_games qg JOIN matches m ON m.id = qg.match_id
    WHERE qg.id = question_game_answers.game_id
    AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
  ));

CREATE POLICY "Users can submit their own game answers"
  ON question_game_answers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Voice message policies
CREATE POLICY "Match participants can view voice messages"
  ON voice_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM matches WHERE matches.id = voice_messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  ));

CREATE POLICY "Users can send voice messages"
  ON voice_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can update voice messages"
  ON voice_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM matches WHERE matches.id = voice_messages.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  ));

-- Video prompt policies
CREATE POLICY "Anyone can view active video prompts"
  ON video_prompts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage their own video prompts"
  ON video_prompts FOR ALL
  USING (user_id = auth.uid());
