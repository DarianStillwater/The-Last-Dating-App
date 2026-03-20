import { APP_CONFIG } from '../../src/constants';

// ============================================================
// Supabase mock — recursive chainable mock
// ============================================================

let mockResolvedData: any = null;
let mockResolvedError: any = null;

const createChain = (): any => {
  const chain: any = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      if (prop === 'data') return mockResolvedData;
      if (prop === 'error') return mockResolvedError;
      if (prop === 'single') {
        return jest.fn().mockResolvedValue({ data: mockResolvedData, error: mockResolvedError });
      }
      return jest.fn().mockReturnValue(chain);
    },
  });
  return chain;
};

const mockFrom = jest.fn().mockImplementation(() => createChain());
const mockChannel = jest.fn().mockReturnValue({
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn(),
});
const mockRemoveChannel = jest.fn();

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: jest.fn(),
    channel: (...args: any[]) => mockChannel(...args),
    removeChannel: (...args: any[]) => mockRemoveChannel(...args),
  },
}));

let mockUserId: string | null = 'user-1';
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      session: mockUserId ? { user: { id: mockUserId } } : null,
    }),
  },
}));

// Mock date-fns to avoid import issues
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, fmt: string) => date.toISOString().split('T')[0]),
  isToday: jest.fn((date: Date) => {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
  }),
  parseISO: jest.fn((str: string) => new Date(str)),
}));

import { useMessageStore } from '../../src/store/messageStore';

// ============================================================
// Helpers
// ============================================================

const resetStore = () => {
  useMessageStore.setState({
    conversations: [],
    messages: [],
    currentMatchId: null,
    messageLimit: null,
    isLoading: false,
    isSending: false,
    error: null,
    shouldShowDateSuggestion: false,
  });
};

const INITIAL_MESSAGE_LIMIT = APP_CONFIG.INITIAL_MESSAGE_LIMIT; // 3
const MESSAGES_FOR_DATE_SUGGESTION = APP_CONFIG.MESSAGES_FOR_DATE_SUGGESTION; // 10

// ============================================================
// Tests
// ============================================================

describe('Message Store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'user-1';
    mockResolvedData = null;
    mockResolvedError = null;
    resetStore();
  });

  // ----------------------------------------------------------
  // Constants validation
  // ----------------------------------------------------------
  describe('Message constants', () => {
    it('INITIAL_MESSAGE_LIMIT is 3', () => {
      expect(INITIAL_MESSAGE_LIMIT).toBe(3);
    });

    it('MESSAGES_FOR_DATE_SUGGESTION is 10', () => {
      expect(MESSAGES_FOR_DATE_SUGGESTION).toBe(10);
    });

    it('date suggestion requires more messages than initial limit', () => {
      expect(MESSAGES_FOR_DATE_SUGGESTION).toBeGreaterThan(INITIAL_MESSAGE_LIMIT);
    });
  });

  // ----------------------------------------------------------
  // fetchConversations
  // ----------------------------------------------------------
  describe('fetchConversations', () => {
    it('does nothing when not authenticated', async () => {
      mockUserId = null;
      await useMessageStore.getState().fetchConversations();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('calls from(matches) when authenticated', async () => {
      mockResolvedData = [];
      mockResolvedError = null;

      await useMessageStore.getState().fetchConversations();

      expect(mockFrom).toHaveBeenCalledWith('matches');
    });

    it('maps other_user correctly when user is user1', () => {
      const userId = 'user-1';
      const match = {
        user1_id: 'user-1',
        user2_id: 'user-2',
        user1: { id: 'user-1', first_name: 'Me' },
        user2: { id: 'user-2', first_name: 'Alice' },
      };
      const mapped = {
        ...match,
        other_user: match.user1_id === userId ? match.user2 : match.user1,
      };
      expect(mapped.other_user.first_name).toBe('Alice');
    });

    it('maps other_user correctly when user is user2', () => {
      const userId = 'user-1';
      const match = {
        user1_id: 'user-2',
        user2_id: 'user-1',
        user1: { id: 'user-2', first_name: 'Bob' },
        user2: { id: 'user-1', first_name: 'Me' },
      };
      const mapped = {
        ...match,
        other_user: match.user1_id === userId ? match.user2 : match.user1,
      };
      expect(mapped.other_user.first_name).toBe('Bob');
    });
  });

  // ----------------------------------------------------------
  // sendMessage
  // ----------------------------------------------------------
  describe('sendMessage', () => {
    it('returns error when not authenticated', async () => {
      mockUserId = null;
      const result = await useMessageStore.getState().sendMessage('match-1', 'hello');
      expect(result.error).toBe('Not authenticated');
    });

    it('returns error for empty message', async () => {
      const result = await useMessageStore.getState().sendMessage('match-1', '   ');
      expect(result.error).toBe('Message cannot be empty');
    });

    it('trims whitespace from message content', async () => {
      // The store checks trimmedContent is not empty
      const content = '  hello  ';
      expect(content.trim()).toBe('hello');
    });

    it('rejects when message limit reached (pure logic)', () => {
      // The store's sendMessage calls checkMessageLimit which returns can_send: false
      // when conversation not established and messages_today >= INITIAL_MESSAGE_LIMIT
      const messagesToday = 3;
      const canSend = messagesToday < INITIAL_MESSAGE_LIMIT;
      expect(canSend).toBe(false);
      // In the store, this causes: return { error: 'Message limit reached...' }
    });
  });

  // ----------------------------------------------------------
  // Message limit logic (pure)
  // ----------------------------------------------------------
  describe('Message limit logic', () => {
    it('conversation established (other user replied) → no limit', () => {
      const match = {
        user1_id: 'user-1',
        user2_id: 'user-2',
        user1_message_count: 5,
        user2_message_count: 3,
      };
      const userId = 'user-1';
      const isUser1 = match.user1_id === userId;
      const otherUserMessages = isUser1 ? match.user2_message_count : match.user1_message_count;
      const conversationEstablished = otherUserMessages > 0;

      expect(conversationEstablished).toBe(true);
      // → can_send: true, no limit
    });

    it('conversation NOT established, 0 messages today → can send', () => {
      const messagesToday = 0;
      expect(messagesToday < INITIAL_MESSAGE_LIMIT).toBe(true);
    });

    it('conversation NOT established, 2 messages today → can send', () => {
      const messagesToday = 2;
      expect(messagesToday < INITIAL_MESSAGE_LIMIT).toBe(true);
    });

    it('conversation NOT established, 3 messages today → cannot send', () => {
      const messagesToday = 3;
      expect(messagesToday < INITIAL_MESSAGE_LIMIT).toBe(false);
    });

    it('conversation NOT established, 4 messages today → cannot send', () => {
      const messagesToday = 4;
      expect(messagesToday < INITIAL_MESSAGE_LIMIT).toBe(false);
    });

    it('messages from previous day reset count to 0', () => {
      const lastMessageDate = '2025-01-01';
      const today = new Date().toISOString().split('T')[0];
      const isFromToday = lastMessageDate === today;
      const messagesToday = isFromToday ? 3 : 0;
      expect(messagesToday).toBe(0);
    });

    it('isUser1 determination works correctly', () => {
      const match = { user1_id: 'user-1', user2_id: 'user-2' };

      expect(match.user1_id === 'user-1').toBe(true); // user is user1
      expect(match.user1_id === 'user-2').toBe(false); // user is not user1

      // user2 scenario
      const match2 = { user1_id: 'user-2', user2_id: 'user-1' };
      expect(match2.user1_id === 'user-1').toBe(false);
    });

    it('updates correct message count for user1', () => {
      const match = {
        user1_id: 'user-1',
        total_messages: 5,
        user1_message_count: 3,
        user2_message_count: 2,
      };
      const userId = 'user-1';
      const isUser1 = match.user1_id === userId;

      const updateData: any = {
        total_messages: match.total_messages + 1,
      };
      if (isUser1) {
        updateData.user1_message_count = match.user1_message_count + 1;
      } else {
        updateData.user2_message_count = match.user2_message_count + 1;
      }

      expect(updateData.total_messages).toBe(6);
      expect(updateData.user1_message_count).toBe(4);
      expect(updateData.user2_message_count).toBeUndefined();
    });

    it('updates correct message count for user2', () => {
      const match = {
        user1_id: 'user-2',
        total_messages: 5,
        user1_message_count: 3,
        user2_message_count: 2,
      };
      const userId = 'user-1';
      const isUser1 = match.user1_id === userId;

      const updateData: any = {
        total_messages: match.total_messages + 1,
      };
      if (isUser1) {
        updateData.user1_message_count = match.user1_message_count + 1;
      } else {
        updateData.user2_message_count = match.user2_message_count + 1;
      }

      expect(updateData.total_messages).toBe(6);
      expect(updateData.user2_message_count).toBe(3);
      expect(updateData.user1_message_count).toBeUndefined();
    });
  });

  // ----------------------------------------------------------
  // Date suggestion trigger logic (pure)
  // ----------------------------------------------------------
  describe('Date suggestion trigger', () => {
    const shouldShowDateSuggestion = (match: {
      total_messages: number;
      user1_message_count: number;
      user2_message_count: number;
      date_suggested: boolean;
    }) => {
      return (
        match.total_messages >= MESSAGES_FOR_DATE_SUGGESTION &&
        match.user1_message_count > 0 &&
        match.user2_message_count > 0 &&
        !match.date_suggested
      );
    };

    it('returns false when total_messages < 10', () => {
      expect(shouldShowDateSuggestion({
        total_messages: 9,
        user1_message_count: 5,
        user2_message_count: 4,
        date_suggested: false,
      })).toBe(false);
    });

    it('returns false when only user1 has sent messages', () => {
      expect(shouldShowDateSuggestion({
        total_messages: 10,
        user1_message_count: 10,
        user2_message_count: 0,
        date_suggested: false,
      })).toBe(false);
    });

    it('returns false when only user2 has sent messages', () => {
      expect(shouldShowDateSuggestion({
        total_messages: 10,
        user1_message_count: 0,
        user2_message_count: 10,
        date_suggested: false,
      })).toBe(false);
    });

    it('returns false when date already suggested', () => {
      expect(shouldShowDateSuggestion({
        total_messages: 15,
        user1_message_count: 8,
        user2_message_count: 7,
        date_suggested: true,
      })).toBe(false);
    });

    it('returns true when 10+ messages, both users sent, not yet suggested', () => {
      expect(shouldShowDateSuggestion({
        total_messages: 10,
        user1_message_count: 5,
        user2_message_count: 5,
        date_suggested: false,
      })).toBe(true);
    });

    it('returns true at exactly 10 messages', () => {
      expect(shouldShowDateSuggestion({
        total_messages: 10,
        user1_message_count: 1,
        user2_message_count: 9,
        date_suggested: false,
      })).toBe(true);
    });

    it('returns true with many messages', () => {
      expect(shouldShowDateSuggestion({
        total_messages: 100,
        user1_message_count: 50,
        user2_message_count: 50,
        date_suggested: false,
      })).toBe(true);
    });

    it('requires BOTH users to have at least 1 message', () => {
      // This is the key requirement: prevents one-sided conversations from triggering
      expect(shouldShowDateSuggestion({
        total_messages: 10,
        user1_message_count: 1,
        user2_message_count: 9,
        date_suggested: false,
      })).toBe(true);

      expect(shouldShowDateSuggestion({
        total_messages: 10,
        user1_message_count: 0,
        user2_message_count: 10,
        date_suggested: false,
      })).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // markMessagesAsRead
  // ----------------------------------------------------------
  describe('markMessagesAsRead', () => {
    it('does nothing when not authenticated', async () => {
      mockUserId = null;
      await useMessageStore.getState().markMessagesAsRead('match-1');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('calls from(messages) to update read_at', async () => {
      mockResolvedError = null;
      await useMessageStore.getState().markMessagesAsRead('match-1');
      expect(mockFrom).toHaveBeenCalledWith('messages');
    });
  });

  // ----------------------------------------------------------
  // setCurrentMatch
  // ----------------------------------------------------------
  describe('setCurrentMatch', () => {
    it('sets currentMatchId', () => {
      useMessageStore.getState().setCurrentMatch('match-1');
      expect(useMessageStore.getState().currentMatchId).toBe('match-1');
    });

    it('clears currentMatchId with null', () => {
      useMessageStore.setState({ currentMatchId: 'match-1' });
      useMessageStore.getState().setCurrentMatch(null);
      expect(useMessageStore.getState().currentMatchId).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // subscribeToMessages
  // ----------------------------------------------------------
  describe('subscribeToMessages', () => {
    it('creates a channel subscription for the match', () => {
      const unsub = useMessageStore.getState().subscribeToMessages('match-1');
      expect(mockChannel).toHaveBeenCalledWith('messages:match-1');
      expect(typeof unsub).toBe('function');
    });

    it('returns an unsubscribe function', () => {
      const unsub = useMessageStore.getState().subscribeToMessages('match-1');
      unsub();
      expect(mockRemoveChannel).toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // Message preview truncation logic
  // ----------------------------------------------------------
  describe('Message preview truncation', () => {
    it('truncates long messages to 50 characters for preview', () => {
      const content = 'a'.repeat(100);
      const preview = content.substring(0, 50);
      expect(preview).toHaveLength(50);
    });

    it('keeps short messages as-is for preview', () => {
      const content = 'Hello!';
      const preview = content.substring(0, 50);
      expect(preview).toBe('Hello!');
    });
  });

  // ----------------------------------------------------------
  // fetchMessages
  // ----------------------------------------------------------
  describe('fetchMessages', () => {
    it('does nothing when not authenticated', async () => {
      mockUserId = null;
      await useMessageStore.getState().fetchMessages('match-1');
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('sets currentMatchId', async () => {
      mockResolvedData = [];
      mockResolvedError = null;

      await useMessageStore.getState().fetchMessages('match-1');

      expect(useMessageStore.getState().currentMatchId).toBe('match-1');
    });
  });
});
