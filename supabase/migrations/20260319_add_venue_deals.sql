-- Venue Deals Table
CREATE TABLE venue_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  terms TEXT,
  expiry_hours INTEGER NOT NULL DEFAULT 48 CHECK (expiry_hours > 0),
  max_redemptions INTEGER,
  redemption_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deal Redemptions Table
CREATE TABLE deal_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES venue_deals(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redemption_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  venue_confirmed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_venue_deals_venue_id ON venue_deals(venue_id);
CREATE INDEX idx_venue_deals_active ON venue_deals(is_active) WHERE is_active = true;
CREATE INDEX idx_deal_redemptions_deal_id ON deal_redemptions(deal_id);
CREATE INDEX idx_deal_redemptions_user_id ON deal_redemptions(user_id);
CREATE INDEX idx_deal_redemptions_code ON deal_redemptions(redemption_code);
CREATE INDEX idx_deal_redemptions_status ON deal_redemptions(status) WHERE status = 'active';

-- RLS
ALTER TABLE venue_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active deals"
  ON venue_deals FOR SELECT
  USING (is_active = true);

CREATE POLICY "Venue owners can manage their deals"
  ON venue_deals FOR ALL
  USING (
    venue_id IN (
      SELECT v.id FROM venues v WHERE v.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own redemptions"
  ON deal_redemptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create redemptions"
  ON deal_redemptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Venue owners can view redemptions for their venues"
  ON deal_redemptions FOR SELECT
  USING (
    deal_id IN (
      SELECT vd.id FROM venue_deals vd
      JOIN venues v ON v.id = vd.venue_id
      WHERE v.owner_id = auth.uid()
    )
  );

CREATE POLICY "Venue owners can confirm redemptions"
  ON deal_redemptions FOR UPDATE
  USING (
    deal_id IN (
      SELECT vd.id FROM venue_deals vd
      JOIN venues v ON v.id = vd.venue_id
      WHERE v.owner_id = auth.uid()
    )
  );
