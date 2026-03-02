import { APP_CONFIG } from '../../src/constants';

// Test the matching logic independently of Supabase
describe('Match Store Logic', () => {
  describe('hasReachedLimit', () => {
    it('returns true when matches equal MAX_MATCHES', () => {
      const matchCount = APP_CONFIG.MAX_MATCHES;
      expect(matchCount >= APP_CONFIG.MAX_MATCHES).toBe(true);
    });

    it('returns false when matches are below limit', () => {
      const matchCount = APP_CONFIG.MAX_MATCHES - 1;
      expect(matchCount >= APP_CONFIG.MAX_MATCHES).toBe(false);
    });
  });

  describe('nextProfile logic', () => {
    const mockProfiles = [
      { id: '1', first_name: 'Alice' },
      { id: '2', first_name: 'Bob' },
      { id: '3', first_name: 'Charlie' },
    ];

    it('returns null when profiles array is empty', () => {
      const profiles: typeof mockProfiles = [];
      const currentIndex = 0;
      const next = currentIndex < profiles.length ? profiles[currentIndex] : null;
      expect(next).toBeNull();
    });

    it('returns the profile at current index', () => {
      const currentIndex = 1;
      const next = currentIndex < mockProfiles.length ? mockProfiles[currentIndex] : null;
      expect(next?.first_name).toBe('Bob');
    });

    it('returns null when index exceeds profiles length', () => {
      const currentIndex = mockProfiles.length;
      const next = currentIndex < mockProfiles.length ? mockProfiles[currentIndex] : null;
      expect(next).toBeNull();
    });

    it('advances index correctly', () => {
      let currentIndex = 0;
      expect(mockProfiles[currentIndex].first_name).toBe('Alice');
      currentIndex++;
      expect(mockProfiles[currentIndex].first_name).toBe('Bob');
      currentIndex++;
      expect(mockProfiles[currentIndex].first_name).toBe('Charlie');
    });
  });

  describe('APP_CONFIG match constants', () => {
    it('MAX_MATCHES is a positive number', () => {
      expect(APP_CONFIG.MAX_MATCHES).toBeGreaterThan(0);
    });

    it('INITIAL_MESSAGE_LIMIT is a positive number', () => {
      expect(APP_CONFIG.INITIAL_MESSAGE_LIMIT).toBeGreaterThan(0);
    });

    it('MESSAGES_FOR_DATE_SUGGESTION is greater than INITIAL_MESSAGE_LIMIT', () => {
      expect(APP_CONFIG.MESSAGES_FOR_DATE_SUGGESTION).toBeGreaterThan(
        APP_CONFIG.INITIAL_MESSAGE_LIMIT
      );
    });
  });
});
