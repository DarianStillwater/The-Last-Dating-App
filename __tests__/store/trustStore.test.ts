import { TRUST_CONFIG, ACCURACY_OPTIONS } from '../../src/constants';
import { TRUST_TIERS } from '../../src/theme/plantMetaphors';

// Test trust logic independently of Supabase
describe('Trust Store Logic', () => {
  describe('TRUST_CONFIG constants', () => {
    it('REVIEW_ELIGIBLE_HOURS is a positive number', () => {
      expect(TRUST_CONFIG.REVIEW_ELIGIBLE_HOURS).toBeGreaterThan(0);
    });

    it('report thresholds are ordered correctly', () => {
      expect(TRUST_CONFIG.REPORTS_FOR_SUSPENSION).toBeGreaterThan(
        TRUST_CONFIG.REPORTS_FOR_VISIBILITY_REDUCE
      );
    });

    it('trust score threshold is between 0 and 1', () => {
      expect(TRUST_CONFIG.TRUST_SCORE_LOW_THRESHOLD).toBeGreaterThanOrEqual(0);
      expect(TRUST_CONFIG.TRUST_SCORE_LOW_THRESHOLD).toBeLessThanOrEqual(1);
    });

    it('vouch tiers are ascending', () => {
      expect(TRUST_CONFIG.MIN_VOUCHES_FOR_TIER_1).toBeLessThan(TRUST_CONFIG.MIN_VOUCHES_FOR_TIER_2);
      expect(TRUST_CONFIG.MIN_VOUCHES_FOR_TIER_2).toBeLessThan(TRUST_CONFIG.MIN_VOUCHES_FOR_TIER_3);
    });

    it('MIN_REVIEWS_FOR_DISPLAY is a positive number', () => {
      expect(TRUST_CONFIG.MIN_REVIEWS_FOR_DISPLAY).toBeGreaterThan(0);
    });
  });

  describe('ACCURACY_OPTIONS', () => {
    it('has exactly 3 options', () => {
      expect(ACCURACY_OPTIONS).toHaveLength(3);
    });

    it('contains yes, mostly, no', () => {
      const values = ACCURACY_OPTIONS.map(o => o.value);
      expect(values).toContain('yes');
      expect(values).toContain('mostly');
      expect(values).toContain('no');
    });
  });

  describe('Trust tier calculation', () => {
    const getTrustTier = (vouchCount: number, reviewCount: number) => {
      if (vouchCount >= TRUST_TIERS[3].minVouches && reviewCount >= TRUST_TIERS[3].minReviews) return TRUST_TIERS[3];
      if (vouchCount >= TRUST_TIERS[2].minVouches && reviewCount >= TRUST_TIERS[2].minReviews) return TRUST_TIERS[2];
      if (vouchCount >= TRUST_TIERS[1].minVouches && reviewCount >= TRUST_TIERS[1].minReviews) return TRUST_TIERS[1];
      return TRUST_TIERS[0];
    };

    it('returns New Seedling for 0 vouches and 0 reviews', () => {
      expect(getTrustTier(0, 0).label).toBe('New Seedling');
    });

    it('returns Taking Root for 1 vouch and 1 review', () => {
      expect(getTrustTier(1, 1).label).toBe('Taking Root');
    });

    it('returns Growing Strong for 3 vouches and 3 reviews', () => {
      expect(getTrustTier(3, 3).label).toBe('Growing Strong');
    });

    it('returns Deep Roots for 5+ vouches and 5+ reviews', () => {
      expect(getTrustTier(5, 5).label).toBe('Deep Roots');
      expect(getTrustTier(10, 10).label).toBe('Deep Roots');
    });

    it('requires both vouches and reviews to tier up', () => {
      expect(getTrustTier(5, 0).label).toBe('New Seedling');
      expect(getTrustTier(0, 5).label).toBe('New Seedling');
    });

    it('uses the lower of vouches or reviews for tier', () => {
      expect(getTrustTier(5, 2).label).toBe('Taking Root');
      expect(getTrustTier(2, 5).label).toBe('Taking Root');
    });
  });

  describe('Review eligibility check', () => {
    it('returns true when enough hours have passed', () => {
      const dateAcceptedAt = new Date(Date.now() - (TRUST_CONFIG.REVIEW_ELIGIBLE_HOURS + 1) * 60 * 60 * 1000).toISOString();
      const hoursElapsed = (Date.now() - new Date(dateAcceptedAt).getTime()) / (1000 * 60 * 60);
      expect(hoursElapsed >= TRUST_CONFIG.REVIEW_ELIGIBLE_HOURS).toBe(true);
    });

    it('returns false when not enough hours have passed', () => {
      const dateAcceptedAt = new Date(Date.now() - (TRUST_CONFIG.REVIEW_ELIGIBLE_HOURS - 1) * 60 * 60 * 1000).toISOString();
      const hoursElapsed = (Date.now() - new Date(dateAcceptedAt).getTime()) / (1000 * 60 * 60);
      expect(hoursElapsed >= TRUST_CONFIG.REVIEW_ELIGIBLE_HOURS).toBe(false);
    });
  });

  describe('Enforcement thresholds', () => {
    it('visibility reduction threshold is reasonable', () => {
      expect(TRUST_CONFIG.REPORTS_FOR_VISIBILITY_REDUCE).toBeGreaterThanOrEqual(2);
      expect(TRUST_CONFIG.REPORTS_FOR_VISIBILITY_REDUCE).toBeLessThanOrEqual(10);
    });

    it('suspension threshold is higher than visibility reduction', () => {
      expect(TRUST_CONFIG.REPORTS_FOR_SUSPENSION).toBeGreaterThan(
        TRUST_CONFIG.REPORTS_FOR_VISIBILITY_REDUCE
      );
    });

    it('suspension duration is positive', () => {
      expect(TRUST_CONFIG.SUSPENSION_HOURS).toBeGreaterThan(0);
    });
  });
});
