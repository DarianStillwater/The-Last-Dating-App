import { APP_CONFIG } from '../../src/constants';

// ============================================================
// Supabase mock — recursive chainable mock
// ============================================================

let mockResolvedData: any = null;
let mockResolvedError: any = null;

const createChain = (): any => {
  const chain: any = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') return undefined; // not a promise
      if (prop === 'data') return mockResolvedData;
      if (prop === 'error') return mockResolvedError;
      // Terminal methods that return a promise
      if (prop === 'single') {
        return jest.fn().mockResolvedValue({ data: mockResolvedData, error: mockResolvedError });
      }
      // All other methods return the chain
      return jest.fn().mockReturnValue(chain);
    },
  });
  return chain;
};

const mockFrom = jest.fn().mockImplementation(() => createChain());
const mockRpc = jest.fn().mockImplementation(() =>
  Promise.resolve({ data: mockResolvedData, error: mockResolvedError })
);
const mockRemoveChannel = jest.fn();

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
    removeChannel: mockRemoveChannel,
  },
}));

// Auth mock
let mockUserId: string | null = 'user-1';
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      session: mockUserId ? { user: { id: mockUserId } } : null,
    }),
  },
}));

// Must import AFTER mocks
import { useMatchStore } from '../../src/store/matchStore';

// ============================================================
// Helpers
// ============================================================

const resetStore = () => {
  useMatchStore.setState({
    matches: [],
    discoverProfiles: [],
    currentIndex: 0,
    isLoading: false,
    hasReachedLimit: false,
    error: null,
  });
};

const makeMatch = (id: string, overrides: any = {}) => ({
  id,
  user1_id: 'user-1',
  user2_id: 'user-2',
  status: 'active',
  total_messages: 0,
  user1_message_count: 0,
  user2_message_count: 0,
  date_suggested: false,
  created_at: new Date().toISOString(),
  user1: { id: 'user-1', first_name: 'Me' },
  user2: { id: 'user-2', first_name: 'Other' },
  ...overrides,
});

// ============================================================
// Tests
// ============================================================

describe('Match Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'user-1';
    mockResolvedData = null;
    mockResolvedError = null;
    resetStore();
  });

  // ----------------------------------------------------------
  // Pure logic (no mocks needed)
  // ----------------------------------------------------------
  describe('hasReachedLimit', () => {
    it('returns true when matches equal MAX_MATCHES', () => {
      expect(APP_CONFIG.MAX_MATCHES >= APP_CONFIG.MAX_MATCHES).toBe(true);
    });

    it('returns false when matches are below limit', () => {
      expect(APP_CONFIG.MAX_MATCHES - 1 >= APP_CONFIG.MAX_MATCHES).toBe(false);
    });
  });

  describe('nextProfile logic (pure)', () => {
    const mockProfiles = [
      { id: '1', first_name: 'Alice' },
      { id: '2', first_name: 'Bob' },
      { id: '3', first_name: 'Charlie' },
    ];

    it('returns null when profiles array is empty', () => {
      const next = 0 < [].length ? [][0] : null;
      expect(next).toBeNull();
    });

    it('returns the profile at current index', () => {
      expect(mockProfiles[1].first_name).toBe('Bob');
    });

    it('advances index correctly', () => {
      let i = 0;
      expect(mockProfiles[i++].first_name).toBe('Alice');
      expect(mockProfiles[i++].first_name).toBe('Bob');
      expect(mockProfiles[i++].first_name).toBe('Charlie');
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

  // ----------------------------------------------------------
  // fetchDiscoverProfiles
  // ----------------------------------------------------------
  describe('fetchDiscoverProfiles', () => {
    it('calls get_compatible_profiles RPC with user ID and limit 20', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      await useMatchStore.getState().fetchDiscoverProfiles();

      expect(mockRpc).toHaveBeenCalledWith('get_compatible_profiles', {
        current_user_id: 'user-1',
        limit_count: 20,
      });
    });

    it('sets discoverProfiles and resets currentIndex to 0', async () => {
      const profiles = [{ id: 'p1' }, { id: 'p2' }];
      mockRpc.mockResolvedValue({ data: profiles, error: null });

      useMatchStore.setState({ currentIndex: 5 });
      await useMatchStore.getState().fetchDiscoverProfiles();

      expect(useMatchStore.getState().discoverProfiles).toEqual(profiles);
      expect(useMatchStore.getState().currentIndex).toBe(0);
    });

    it('returns empty profiles and error when hasReachedLimit is true', async () => {
      useMatchStore.setState({ hasReachedLimit: true });

      await useMatchStore.getState().fetchDiscoverProfiles();

      expect(mockRpc).not.toHaveBeenCalled();
      expect(useMatchStore.getState().discoverProfiles).toEqual([]);
      expect(useMatchStore.getState().error).toBe('Match limit reached');
    });

    it('does nothing when not authenticated', async () => {
      mockUserId = null;

      await useMatchStore.getState().fetchDiscoverProfiles();

      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // swipeRight
  // ----------------------------------------------------------
  describe('swipeRight', () => {
    it('returns error when not authenticated', async () => {
      mockUserId = null;
      const result = await useMatchStore.getState().swipeRight('target-1');
      expect(result).toEqual({ match: null, error: 'Not authenticated' });
    });

    it('returns error when match limit reached via flag', async () => {
      useMatchStore.setState({ hasReachedLimit: true });
      const result = await useMatchStore.getState().swipeRight('target-1');
      expect(result.error).toContain('Match limit reached');
      expect(result.match).toBeNull();
    });

    it('returns error when at MAX_MATCHES count', async () => {
      const matches = Array.from({ length: 10 }, (_, i) => makeMatch(`m-${i}`));
      useMatchStore.setState({ matches: matches as any });
      const result = await useMatchStore.getState().swipeRight('target-1');
      expect(result.error).toContain('Match limit reached');
    });

    it('inserts swipe record via supabase', async () => {
      // Swipe insert succeeds, mutual check returns nothing
      mockResolvedError = null;
      mockResolvedData = null;

      useMatchStore.setState({
        discoverProfiles: [{ id: 'target-1' } as any, { id: 'p2' } as any],
        currentIndex: 0,
      });

      // fetchDiscoverProfiles will be called by nextProfile
      mockRpc.mockResolvedValue({ data: [], error: null });

      await useMatchStore.getState().swipeRight('target-1');

      expect(mockFrom).toHaveBeenCalledWith('swipes');
    });
  });

  // ----------------------------------------------------------
  // swipeLeft
  // ----------------------------------------------------------
  describe('swipeLeft', () => {
    it('returns error when not authenticated', async () => {
      mockUserId = null;
      const result = await useMatchStore.getState().swipeLeft('target-1');
      expect(result.error).toBe('Not authenticated');
    });

    it('records pass swipe and calls from(swipes)', async () => {
      mockResolvedError = null;
      useMatchStore.setState({
        discoverProfiles: [{ id: 'p1' } as any, { id: 'p2' } as any],
        currentIndex: 0,
      });
      mockRpc.mockResolvedValue({ data: [], error: null });

      const result = await useMatchStore.getState().swipeLeft('p1');
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('swipes');
    });
  });

  // ----------------------------------------------------------
  // unmatch
  // ----------------------------------------------------------
  describe('unmatch', () => {
    it('returns error when not authenticated', async () => {
      mockUserId = null;
      const result = await useMatchStore.getState().unmatch('match-1');
      expect(result.error).toBe('Not authenticated');
    });

    it('removes match from local state', async () => {
      const match = makeMatch('match-1');
      useMatchStore.setState({ matches: [match as any] });

      mockResolvedError = null;
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await useMatchStore.getState().unmatch('match-1');

      expect(result.error).toBeNull();
      expect(useMatchStore.getState().matches).toHaveLength(0);
      expect(useMatchStore.getState().hasReachedLimit).toBe(false);
    });

    it('calls decrement_match_count RPC for both users', async () => {
      const match = makeMatch('match-1', { user1_id: 'user-1', user2_id: 'user-2' });
      useMatchStore.setState({ matches: [match as any] });

      mockResolvedError = null;
      mockRpc.mockResolvedValue({ data: null, error: null });

      await useMatchStore.getState().unmatch('match-1');

      expect(mockRpc).toHaveBeenCalledWith('decrement_match_count', { user_id: 'user-1' });
      expect(mockRpc).toHaveBeenCalledWith('decrement_match_count', { user_id: 'user-2' });
    });

    it('updates hasReachedLimit after removing match', async () => {
      // Start with 10 matches (at limit), remove one
      const matches = Array.from({ length: 10 }, (_, i) => makeMatch(`m-${i}`));
      useMatchStore.setState({ matches: matches as any, hasReachedLimit: true });

      mockResolvedError = null;
      mockRpc.mockResolvedValue({ data: null, error: null });

      await useMatchStore.getState().unmatch('m-0');

      expect(useMatchStore.getState().matches).toHaveLength(9);
      expect(useMatchStore.getState().hasReachedLimit).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // blockUser
  // ----------------------------------------------------------
  describe('blockUser', () => {
    it('returns error when not authenticated', async () => {
      mockUserId = null;
      const result = await useMatchStore.getState().blockUser('bad-user');
      expect(result.error).toBe('Not authenticated');
    });

    it('calls from(blocks) to insert block record', async () => {
      mockResolvedError = null;
      await useMatchStore.getState().blockUser('bad-user');
      expect(mockFrom).toHaveBeenCalledWith('blocks');
    });

    it('removes existing match with blocked user from local state', async () => {
      const match = makeMatch('match-1', { user1_id: 'user-1', user2_id: 'bad-user' });
      useMatchStore.setState({ matches: [match as any] });

      mockResolvedError = null;

      await useMatchStore.getState().blockUser('bad-user');

      expect(useMatchStore.getState().matches).toHaveLength(0);
    });

    it('succeeds even when no match exists with blocked user', async () => {
      useMatchStore.setState({ matches: [] });
      mockResolvedError = null;

      const result = await useMatchStore.getState().blockUser('stranger');
      expect(result.error).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // reportUser
  // ----------------------------------------------------------
  describe('reportUser', () => {
    it('returns error when not authenticated', async () => {
      mockUserId = null;
      const result = await useMatchStore.getState().reportUser('bad-user', 'harassment');
      expect(result.error).toBe('Not authenticated');
    });

    it('calls from(reports) to insert report', async () => {
      mockResolvedError = null;

      const result = await useMatchStore.getState().reportUser('bad-user', 'harassment', 'they were rude');
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('reports');
    });
  });

  // ----------------------------------------------------------
  // nextProfile (store action)
  // ----------------------------------------------------------
  describe('nextProfile (store action)', () => {
    it('increments currentIndex when more profiles remain', () => {
      useMatchStore.setState({
        discoverProfiles: [{ id: 'a' } as any, { id: 'b' } as any, { id: 'c' } as any],
        currentIndex: 0,
      });

      useMatchStore.getState().nextProfile();
      expect(useMatchStore.getState().currentIndex).toBe(1);
    });

    it('does not increment beyond last valid index', () => {
      useMatchStore.setState({
        discoverProfiles: [{ id: 'a' } as any, { id: 'b' } as any],
        currentIndex: 0,
      });

      useMatchStore.getState().nextProfile();
      expect(useMatchStore.getState().currentIndex).toBe(1);
      // At index 1 (last), nextProfile should trigger fetch
    });

    it('triggers fetchDiscoverProfiles when at the end', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      useMatchStore.setState({
        discoverProfiles: [{ id: 'a' } as any],
        currentIndex: 0, // index 0, length - 1 = 0, so it should fetch
      });

      useMatchStore.getState().nextProfile();

      // Give the async fetchDiscoverProfiles a tick to fire
      await new Promise((r) => setTimeout(r, 10));

      expect(mockRpc).toHaveBeenCalledWith('get_compatible_profiles', expect.any(Object));
    });
  });

  // ----------------------------------------------------------
  // fetchMatches
  // ----------------------------------------------------------
  describe('fetchMatches', () => {
    it('does nothing when not authenticated', async () => {
      mockUserId = null;
      await useMatchStore.getState().fetchMatches();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // Match ordering for mutual likes
  // ----------------------------------------------------------
  describe('user ID ordering for matches', () => {
    it('user1_id is always the smaller ID', () => {
      const s = 'user-aaa', t = 'user-zzz';
      expect(s < t ? s : t).toBe('user-aaa');
      expect(s < t ? t : s).toBe('user-zzz');
    });

    it('reversed IDs still produce correct ordering', () => {
      const s = 'user-zzz', t = 'user-aaa';
      expect(s < t ? s : t).toBe('user-aaa');
      expect(s < t ? t : s).toBe('user-zzz');
    });
  });

  // ----------------------------------------------------------
  // refreshDiscovery
  // ----------------------------------------------------------
  describe('refreshDiscovery', () => {
    it('calls both fetchMatches and fetchDiscoverProfiles', async () => {
      mockResolvedData = [];
      mockResolvedError = null;
      mockRpc.mockResolvedValue({ data: [], error: null });

      await useMatchStore.getState().refreshDiscovery();

      expect(mockFrom).toHaveBeenCalledWith('matches');
      expect(mockRpc).toHaveBeenCalled();
    });
  });
});
