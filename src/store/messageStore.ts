import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Message, Match, MessageLimit } from '../types';
import { useAuthStore } from './authStore';
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
  
  // Actions
  fetchConversations: () => Promise<void>;
  fetchMessages: (matchId: string) => Promise<void>;
  sendMessage: (matchId: string, content: string) => Promise<{ error: string | null }>;
  checkMessageLimit: (matchId: string) => Promise<MessageLimit>;
  markMessagesAsRead: (matchId: string) => Promise<void>;
  setCurrentMatch: (matchId: string | null) => void;
  subscribeToMessages: (matchId: string) => () => void;
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
        match.user1_message_count >= 5 &&
        match.user2_message_count >= 5 &&
        !match.date_suggested;

      set({ 
        messages: (data || []) as Message[],
        shouldShowDateSuggestion: shouldShow,
      });

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
        updatedMatch.user1_message_count >= 5 &&
        updatedMatch.user2_message_count >= 5 &&
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
}));
