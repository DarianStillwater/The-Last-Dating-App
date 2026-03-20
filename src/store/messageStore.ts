import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Message, Match, MessageLimit, QuestionGame, QuestionGameAnswer, VoiceMessage } from '../types';
import { useAuthStore } from './authStore';
import { APP_CONFIG, QUESTION_GAME_PROMPTS } from '../constants';
import { format, isToday, parseISO } from 'date-fns';

const INITIAL_MESSAGE_LIMIT = 3; // 3 messages per 24 hours until conversation established
const MESSAGES_FOR_DATE_SUGGESTION = 10; // 5 from each user

interface MessageState {
  conversations: Match[];
  messages: Message[];
  currentMatchId: string | null;
  messageLimit: MessageLimit | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  shouldShowDateSuggestion: boolean;

  // Question game state
  shouldShowQuestionGame: boolean;
  activeGame: QuestionGame | null;

  // Voice message state
  voiceMessages: VoiceMessage[];

  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (matchId: string) => Promise<void>;
  sendMessage: (matchId: string, content: string) => Promise<{ error: string | null }>;
  checkMessageLimit: (matchId: string) => Promise<MessageLimit>;
  markMessagesAsRead: (matchId: string) => Promise<void>;
  setCurrentMatch: (matchId: string | null) => void;
  subscribeToMessages: (matchId: string) => () => void;

  // Question game actions
  fetchActiveGame: (matchId: string) => Promise<void>;
  startQuestionGame: (matchId: string) => Promise<{ error: string | null }>;
  answerQuestionGame: (gameId: string, answer: string) => Promise<{ error: string | null }>;
  subscribeToGameAnswers: (gameId: string) => () => void;

  // Voice message actions
  fetchVoiceMessages: (matchId: string) => Promise<void>;
  sendVoiceMessage: (matchId: string, audioUri: string, durationSeconds: number) => Promise<{ error: string | null }>;
  markVoiceMessageListened: (messageId: string) => Promise<void>;
  subscribeToVoiceMessages: (matchId: string) => () => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  messages: [],
  currentMatchId: null,
  messageLimit: null,
  isLoading: false,
  isSending: false,
  error: null,
  shouldShowDateSuggestion: false,
  shouldShowQuestionGame: false,
  activeGame: null,
  voiceMessages: [],

  fetchConversations: async () => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    try {
      set({ isLoading: true, error: null });

      const userId = session.user.id;

      // Fetch matches with messages
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(
            id, first_name, main_photo_url, last_active
          ),
          user2:profiles!matches_user2_id_fkey(
            id, first_name, main_photo_url, last_active
          )
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .gt('total_messages', 0)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Map to include other_user field
      const conversations = (data || []).map((match: any) => ({
        ...match,
        other_user: match.user1_id === userId ? match.user2 : match.user1,
      }));

      set({ conversations });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (matchId: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    try {
      set({ isLoading: true, error: null, currentMatchId: matchId });

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Check message limit
      await get().checkMessageLimit(matchId);

      // Check if date suggestion should be shown
      const match = (await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()).data;

      const shouldShow = match &&
        match.total_messages >= MESSAGES_FOR_DATE_SUGGESTION &&
        match.user1_message_count > 0 &&
        match.user2_message_count > 0 &&
        !match.date_suggested;

      set({
        messages: (data || []) as Message[],
        shouldShowDateSuggestion: shouldShow,
      });

      // Fetch question game state and voice messages
      await get().fetchActiveGame(matchId);
      await get().fetchVoiceMessages(matchId);

      // Mark messages as read
      await get().markMessagesAsRead(matchId);
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (matchId: string, content: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      set({ isSending: true });

      const userId = session.user.id;
      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return { error: 'Message cannot be empty' };
      }

      // Check message limit
      const limit = await get().checkMessageLimit(matchId);
      if (!limit.can_send) {
        return { error: 'Message limit reached. Wait for a reply or for the limit to reset.' };
      }

      // Get the match details
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (!match) {
        return { error: 'Match not found' };
      }

      // Create message
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: userId,
          content: trimmedContent,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Update match stats
      const isUser1 = match.user1_id === userId;
      const updateData: any = {
        total_messages: match.total_messages + 1,
        last_message_at: new Date().toISOString(),
        last_message_preview: trimmedContent.substring(0, 50),
      };

      if (isUser1) {
        updateData.user1_message_count = match.user1_message_count + 1;
      } else {
        updateData.user2_message_count = match.user2_message_count + 1;
      }

      await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId);

      // Update message limit
      await supabase
        .from('message_limits')
        .upsert({
          match_id: matchId,
          user_id: userId,
          messages_today: limit.messages_today + 1,
          last_message_date: format(new Date(), 'yyyy-MM-dd'),
        });

      // Update local state
      set((state) => ({
        messages: [...state.messages, newMessage as Message],
      }));

      // Refresh limit
      await get().checkMessageLimit(matchId);

      // Check if date suggestion should now appear
      const updatedMatch = (await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()).data;

      const shouldShow = updatedMatch &&
        updatedMatch.total_messages >= MESSAGES_FOR_DATE_SUGGESTION &&
        updatedMatch.user1_message_count > 0 &&
        updatedMatch.user2_message_count > 0 &&
        !updatedMatch.date_suggested;

      set({ shouldShowDateSuggestion: shouldShow });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isSending: false });
    }
  },

  checkMessageLimit: async (matchId: string): Promise<MessageLimit> => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return {
        match_id: matchId,
        user_id: '',
        messages_today: 0,
        last_message_date: '',
        can_send: false,
      };
    }

    const userId = session.user.id;

    try {
      // Get match details
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (!match) {
        return {
          match_id: matchId,
          user_id: userId,
          messages_today: 0,
          last_message_date: '',
          can_send: false,
        };
      }

      // Check if conversation is established (other person has replied)
      const isUser1 = match.user1_id === userId;
      const otherUserMessages = isUser1 ? match.user2_message_count : match.user1_message_count;
      const conversationEstablished = otherUserMessages > 0;

      // If conversation established, no limit
      if (conversationEstablished) {
        const limit: MessageLimit = {
          match_id: matchId,
          user_id: userId,
          messages_today: 0,
          last_message_date: format(new Date(), 'yyyy-MM-dd'),
          can_send: true,
        };
        set({ messageLimit: limit });
        return limit;
      }

      // Check today's message count
      const { data: existingLimit } = await supabase
        .from('message_limits')
        .select('*')
        .eq('match_id', matchId)
        .eq('user_id', userId)
        .single();

      let messagesToday = 0;

      if (existingLimit) {
        const lastDate = parseISO(existingLimit.last_message_date);
        if (isToday(lastDate)) {
          messagesToday = existingLimit.messages_today;
        }
      }

      const canSend = messagesToday < INITIAL_MESSAGE_LIMIT;

      const limit: MessageLimit = {
        match_id: matchId,
        user_id: userId,
        messages_today: messagesToday,
        last_message_date: format(new Date(), 'yyyy-MM-dd'),
        can_send: canSend,
      };

      set({ messageLimit: limit });
      return limit;
    } catch (error) {
      console.error('Error checking message limit:', error);
      return {
        match_id: matchId,
        user_id: userId,
        messages_today: 0,
        last_message_date: '',
        can_send: true,
      };
    }
  },

  markMessagesAsRead: async (matchId: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .neq('sender_id', session.user.id)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  },

  setCurrentMatch: (matchId: string | null) => {
    set({ currentMatchId: matchId });
  },

  subscribeToMessages: (matchId: string) => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          const session = useAuthStore.getState().session;

          // Only add if not sent by current user (already added locally)
          if (session?.user?.id !== newMessage.sender_id) {
            set((state) => ({
              messages: [...state.messages, newMessage],
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // --------------------------------------------------------
  // Question Game
  // --------------------------------------------------------

  fetchActiveGame: async (matchId: string) => {
    try {
      // Fetch active/pending/waiting game for this match
      const { data: game, error } = await supabase
        .from('question_games')
        .select(`
          *,
          answers:question_game_answers(*)
        `)
        .eq('match_id', matchId)
        .in('status', ['pending', 'waiting', 'revealed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      set({ activeGame: game as QuestionGame | null });

      // Check if we should suggest a new game (no active game + quiet period)
      if (!game) {
        const { data: match } = await supabase
          .from('matches')
          .select('last_message_at, user1_message_count, user2_message_count')
          .eq('id', matchId)
          .single();

        if (match && match.last_message_at && match.user1_message_count > 0 && match.user2_message_count > 0) {
          const lastMessageTime = new Date(match.last_message_at).getTime();
          const quietThreshold = APP_CONFIG.QUIET_PERIOD_HOURS * 60 * 60 * 1000;
          const isQuiet = Date.now() - lastMessageTime >= quietThreshold;
          set({ shouldShowQuestionGame: isQuiet });
        }
      } else {
        set({ shouldShowQuestionGame: false });
      }
    } catch (error) {
      console.error('Error fetching active game:', error);
    }
  },

  startQuestionGame: async (matchId: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
      // Pick a random question
      const question = QUESTION_GAME_PROMPTS[Math.floor(Math.random() * QUESTION_GAME_PROMPTS.length)];

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + APP_CONFIG.GAME_EXPIRY_HOURS);

      const { data, error } = await supabase
        .from('question_games')
        .insert({
          match_id: matchId,
          question,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select(`
          *,
          answers:question_game_answers(*)
        `)
        .single();

      if (error) throw error;

      set({ activeGame: data as QuestionGame, shouldShowQuestionGame: false });
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  answerQuestionGame: async (gameId: string, answer: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
      const trimmed = answer.trim();
      if (!trimmed) return { error: 'Answer cannot be empty' };

      // Submit answer
      const { error: answerError } = await supabase
        .from('question_game_answers')
        .insert({
          game_id: gameId,
          user_id: session.user.id,
          answer: trimmed,
        });

      if (answerError) throw answerError;

      // Check how many answers exist now
      const { data: answers } = await supabase
        .from('question_game_answers')
        .select('*')
        .eq('game_id', gameId);

      const answerCount = (answers || []).length;

      // If both answered, reveal
      if (answerCount >= 2) {
        await supabase
          .from('question_games')
          .update({
            status: 'revealed',
            revealed_at: new Date().toISOString(),
          })
          .eq('id', gameId);
      } else {
        // First answer, set to waiting
        await supabase
          .from('question_games')
          .update({ status: 'waiting' })
          .eq('id', gameId);
      }

      // Refresh the game
      const { data: updatedGame } = await supabase
        .from('question_games')
        .select(`
          *,
          answers:question_game_answers(*)
        `)
        .eq('id', gameId)
        .single();

      set({ activeGame: updatedGame as QuestionGame });
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  subscribeToGameAnswers: (gameId: string) => {
    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'question_game_answers',
          filter: `game_id=eq.${gameId}`,
        },
        async () => {
          // Refresh the game when an answer is added
          const { data: game } = await supabase
            .from('question_games')
            .select(`
              *,
              answers:question_game_answers(*)
            `)
            .eq('id', gameId)
            .single();

          if (game) {
            set({ activeGame: game as QuestionGame });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // --------------------------------------------------------
  // Voice Messages
  // --------------------------------------------------------

  fetchVoiceMessages: async (matchId: string) => {
    try {
      const { data, error } = await supabase
        .from('voice_messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ voiceMessages: (data || []) as VoiceMessage[] });
    } catch (error) {
      console.error('Error fetching voice messages:', error);
    }
  },

  sendVoiceMessage: async (matchId: string, audioUri: string, durationSeconds: number) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
      set({ isSending: true });

      const userId = session.user.id;
      const storagePath = `${userId}/${matchId}/${Date.now()}.m4a`;

      // Upload audio file
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return { error: 'Not authenticated' };

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const uploadUrl = `${supabaseUrl}/storage/v1/object/voice-messages/${storagePath}`;

      const { uploadAsync } = await import('expo-file-system/legacy');
      const result = await uploadAsync(uploadUrl, audioUri, {
        httpMethod: 'POST',
        uploadType: 0,
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'audio/m4a',
          'x-upsert': 'true',
        },
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed: ${result.status}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(storagePath);

      // Create voice message record
      const { data: voiceMsg, error } = await supabase
        .from('voice_messages')
        .insert({
          match_id: matchId,
          sender_id: userId,
          audio_url: publicUrl,
          audio_storage_path: storagePath,
          duration_seconds: durationSeconds,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        voiceMessages: [...state.voiceMessages, voiceMsg as VoiceMessage],
      }));

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isSending: false });
    }
  },

  markVoiceMessageListened: async (messageId: string) => {
    try {
      await supabase
        .from('voice_messages')
        .update({ listened_at: new Date().toISOString() })
        .eq('id', messageId)
        .is('listened_at', null);
    } catch (error) {
      console.error('Error marking voice message listened:', error);
    }
  },

  subscribeToVoiceMessages: (matchId: string) => {
    const channel = supabase
      .channel(`voice:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as VoiceMessage;
          const session = useAuthStore.getState().session;

          if (session?.user?.id !== newMsg.sender_id) {
            set((state) => ({
              voiceMessages: [...state.voiceMessages, newMsg],
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
