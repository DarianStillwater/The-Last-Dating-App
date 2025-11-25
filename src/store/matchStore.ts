import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Match, UserProfile, Swipe } from '../types';
import { useAuthStore } from './authStore';

const MAX_MATCHES = 10;

interface MatchState {
  matches: Match[];
  discoverProfiles: UserProfile[];
  currentIndex: number;
  isLoading: boolean;
  hasReachedLimit: boolean;
  error: string | null;
  
  // Actions
  fetchMatches: () => Promise<void>;
  fetchDiscoverProfiles: () => Promise<void>;
  swipeRight: (userId: string) => Promise<{ match: Match | null; error: string | null }>;
  swipeLeft: (userId: string) => Promise<{ error: string | null }>;
  unmatch: (matchId: string) => Promise<{ error: string | null }>;
  blockUser: (userId: string) => Promise<{ error: string | null }>;
  reportUser: (userId: string, reason: string, description?: string) => Promise<{ error: string | null }>;
  nextProfile: () => void;
  refreshDiscovery: () => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  discoverProfiles: [],
  currentIndex: 0,
  isLoading: false,
  hasReachedLimit: false,
  error: null,

  fetchMatches: async () => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    try {
      set({ isLoading: true, error: null });

      const userId = session.user.id;

      // Fetch matches where user is either user1 or user2
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(*),
          user2:profiles!matches_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Map to include other_user field
      const matches = (data || []).map((match: any) => ({
        ...match,
        other_user: match.user1_id === userId ? match.user2 : match.user1,
      }));

      const hasReachedLimit = matches.length >= MAX_MATCHES;

      set({ matches, hasReachedLimit });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDiscoverProfiles: async () => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    const { hasReachedLimit } = get();
    if (hasReachedLimit) {
      set({ discoverProfiles: [], error: 'Match limit reached' });
      return;
    }

    try {
      set({ isLoading: true, error: null });

      const userId = session.user.id;

      // Call the database function for compatible profiles
      const { data, error } = await supabase
        .rpc('get_compatible_profiles', {
          current_user_id: userId,
          limit_count: 20,
        });

      if (error) throw error;

      set({ 
        discoverProfiles: (data || []) as UserProfile[],
        currentIndex: 0,
      });
    } catch (error: any) {
      console.error('Error fetching discover profiles:', error);
      
      // Fallback: fetch profiles with basic filtering
      try {
        const userId = session.user.id;

        // Get user's deal breakers
        const { data: dealBreakers } = await supabase
          .from('deal_breakers')
          .select('*')
          .eq('user_id', userId)
          .single();

        // Get already swiped profiles
        const { data: swipes } = await supabase
          .from('swipes')
          .select('swiped_id')
          .eq('swiper_id', userId);

        const swipedIds = (swipes || []).map((s: any) => s.swiped_id);

        // Get blocked users
        const { data: blocks } = await supabase
          .from('blocks')
          .select('blocked_id, blocker_id')
          .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

        const blockedIds = (blocks || []).flatMap((b: any) => 
          b.blocker_id === userId ? [b.blocked_id] : [b.blocker_id]
        );

        // Fetch profiles
        let query = supabase
          .from('profiles')
          .select('*')
          .neq('id', userId)
          .eq('is_active', true)
          .eq('is_paused', false)
          .eq('is_deleted', false)
          .not('main_photo_url', 'is', null)
          .limit(20);

        // Exclude already swiped and blocked
        if (swipedIds.length > 0) {
          query = query.not('id', 'in', `(${swipedIds.join(',')})`);
        }
        if (blockedIds.length > 0) {
          query = query.not('id', 'in', `(${blockedIds.join(',')})`);
        }

        // Apply age filters
        if (dealBreakers?.min_age) {
          const maxDate = new Date();
          maxDate.setFullYear(maxDate.getFullYear() - dealBreakers.min_age);
          query = query.lte('birth_date', maxDate.toISOString().split('T')[0]);
        }
        if (dealBreakers?.max_age) {
          const minDate = new Date();
          minDate.setFullYear(minDate.getFullYear() - dealBreakers.max_age);
          query = query.gte('birth_date', minDate.toISOString().split('T')[0]);
        }

        const { data: profiles, error: profileError } = await query;

        if (profileError) throw profileError;

        set({ 
          discoverProfiles: (profiles || []) as UserProfile[],
          currentIndex: 0,
        });
      } catch (fallbackError: any) {
        set({ error: fallbackError.message });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  swipeRight: async (userId: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { match: null, error: 'Not authenticated' };
    }

    const { hasReachedLimit, matches } = get();
    if (hasReachedLimit || matches.length >= MAX_MATCHES) {
      return { match: null, error: 'Match limit reached. Unmatch someone to continue.' };
    }

    try {
      set({ isLoading: true });

      const swiperId = session.user.id;

      // Record the swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          swiper_id: swiperId,
          swiped_id: userId,
          liked: true,
        });

      if (swipeError) throw swipeError;

      // Check if other user has already liked us
      const { data: mutualSwipe } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', userId)
        .eq('swiped_id', swiperId)
        .eq('liked', true)
        .single();

      // If mutual like, create a match
      if (mutualSwipe) {
        const { data: newMatch, error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: swiperId < userId ? swiperId : userId,
            user2_id: swiperId < userId ? userId : swiperId,
            status: 'active',
            total_messages: 0,
            user1_message_count: 0,
            user2_message_count: 0,
            date_suggested: false,
          })
          .select(`
            *,
            user1:profiles!matches_user1_id_fkey(*),
            user2:profiles!matches_user2_id_fkey(*)
          `)
          .single();

        if (matchError) throw matchError;

        // Update match count for both users
        await supabase.rpc('increment_match_count', { user_id: swiperId });
        await supabase.rpc('increment_match_count', { user_id: userId });

        const match: Match = {
          ...newMatch,
          other_user: newMatch.user1_id === swiperId ? newMatch.user2 : newMatch.user1,
        };

        // Update local state
        const updatedMatches = [match, ...matches];
        set({ 
          matches: updatedMatches,
          hasReachedLimit: updatedMatches.length >= MAX_MATCHES,
        });

        get().nextProfile();

        return { match, error: null };
      }

      get().nextProfile();

      return { match: null, error: null };
    } catch (error: any) {
      return { match: null, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  swipeLeft: async (userId: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      // Record the pass
      await supabase
        .from('swipes')
        .insert({
          swiper_id: session.user.id,
          swiped_id: userId,
          liked: false,
        });

      get().nextProfile();

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  unmatch: async (matchId: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      set({ isLoading: true });

      const { error } = await supabase
        .from('matches')
        .update({ status: 'unmatched' })
        .eq('id', matchId);

      if (error) throw error;

      // Decrement match counts
      const match = get().matches.find((m) => m.id === matchId);
      if (match) {
        await supabase.rpc('decrement_match_count', { user_id: match.user1_id });
        await supabase.rpc('decrement_match_count', { user_id: match.user2_id });
      }

      // Update local state
      const updatedMatches = get().matches.filter((m) => m.id !== matchId);
      set({ 
        matches: updatedMatches,
        hasReachedLimit: updatedMatches.length >= MAX_MATCHES,
      });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  blockUser: async (userId: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      set({ isLoading: true });

      // Add to blocks table
      await supabase
        .from('blocks')
        .insert({
          blocker_id: session.user.id,
          blocked_id: userId,
        });

      // Find and update any existing match
      const match = get().matches.find(
        (m) => m.user1_id === userId || m.user2_id === userId
      );

      if (match) {
        await supabase
          .from('matches')
          .update({ status: 'blocked' })
          .eq('id', match.id);

        // Update local state
        const updatedMatches = get().matches.filter((m) => m.id !== match.id);
        set({ 
          matches: updatedMatches,
          hasReachedLimit: updatedMatches.length >= MAX_MATCHES,
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  reportUser: async (userId: string, reason: string, description?: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: session.user.id,
          reported_id: userId,
          reason,
          description,
          status: 'pending',
        });

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  nextProfile: () => {
    const { currentIndex, discoverProfiles } = get();
    if (currentIndex < discoverProfiles.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      // Need to fetch more profiles
      get().fetchDiscoverProfiles();
    }
  },

  refreshDiscovery: async () => {
    await get().fetchMatches();
    await get().fetchDiscoverProfiles();
  },
}));
