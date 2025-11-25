import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Venue, DateSuggestion, VenueCategory, Match } from '../types';
import { useAuthStore } from './authStore';

const MAX_VENUE_SUGGESTIONS = 3; // 3 venues per category per radius

interface VenueState {
  venues: Venue[];
  selectedVenue: Venue | null;
  dateSuggestion: DateSuggestion | null;
  categories: VenueCategory[];
  selectedCategory: VenueCategory | null;
  isLoading: boolean;
  error: string | null;
  midpoint: { lat: number; lng: number } | null;
  
  // Actions
  fetchVenuesForMatch: (matchId: string, category?: VenueCategory) => Promise<void>;
  selectCategory: (category: VenueCategory) => void;
  selectVenue: (venue: Venue | null) => void;
  submitDateSuggestion: (matchId: string, venueId: string) => Promise<{ error: string | null }>;
  respondToDateSuggestion: (suggestionId: string, accepted: boolean) => Promise<{ error: string | null }>;
  trackVenueClick: (venueId: string) => Promise<void>;
  fetchDateSuggestion: (matchId: string) => Promise<void>;
}

// Calculate midpoint between two coordinates
const calculateMidpoint = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  // Simple midpoint calculation (for short distances)
  return {
    lat: (lat1 + lat2) / 2,
    lng: (lng1 + lng2) / 2,
  };
};

// Calculate distance between two points in miles
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useVenueStore = create<VenueState>((set, get) => ({
  venues: [],
  selectedVenue: null,
  dateSuggestion: null,
  categories: [
    'indian', 'thai', 'french', 'korean', 'japanese', 'italian', 
    'mexican', 'american', 'chinese', 'mediterranean', 'vietnamese',
    'bar', 'coffee', 'activity', 'outdoor', 'entertainment'
  ],
  selectedCategory: null,
  isLoading: false,
  error: null,
  midpoint: null,

  fetchVenuesForMatch: async (matchId: string, category?: VenueCategory) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    try {
      set({ isLoading: true, error: null });

      // Get match details with user profiles
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(id, location_lat, location_lng),
          user2:profiles!matches_user2_id_fkey(id, location_lat, location_lng)
        `)
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;
      if (!match) throw new Error('Match not found');

      const user1 = match.user1;
      const user2 = match.user2;

      // Check if both users have location data
      if (!user1?.location_lat || !user1?.location_lng || 
          !user2?.location_lat || !user2?.location_lng) {
        throw new Error('Location data not available for both users');
      }

      // Calculate midpoint
      const midpoint = calculateMidpoint(
        user1.location_lat, user1.location_lng,
        user2.location_lat, user2.location_lng
      );

      set({ midpoint });

      // Fetch venues near the midpoint
      let query = supabase
        .from('venues')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data: allVenues, error: venueError } = await query;

      if (venueError) throw venueError;

      // Filter venues within service radius from midpoint
      const nearbyVenues = (allVenues || [])
        .filter((venue: Venue) => {
          const distance = calculateDistance(
            midpoint.lat, midpoint.lng,
            venue.lat, venue.lng
          );
          return distance <= venue.service_radius_miles;
        })
        .sort((a: Venue, b: Venue) => {
          // Sort by partnership slot (1 first, then 2, then 3)
          if (a.partnership_slot !== b.partnership_slot) {
            return a.partnership_slot - b.partnership_slot;
          }
          // Then by distance from midpoint
          const distA = calculateDistance(midpoint.lat, midpoint.lng, a.lat, a.lng);
          const distB = calculateDistance(midpoint.lat, midpoint.lng, b.lat, b.lng);
          return distA - distB;
        })
        .slice(0, MAX_VENUE_SUGGESTIONS);

      // Track impressions for shown venues
      for (const venue of nearbyVenues) {
        await supabase
          .from('venues')
          .update({ impression_count: venue.impression_count + 1 })
          .eq('id', venue.id);
      }

      set({ 
        venues: nearbyVenues,
        selectedCategory: category || null,
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  selectCategory: (category: VenueCategory) => {
    set({ selectedCategory: category, selectedVenue: null });
  },

  selectVenue: (venue: Venue | null) => {
    set({ selectedVenue: venue });
    if (venue) {
      get().trackVenueClick(venue.id);
    }
  },

  submitDateSuggestion: async (matchId: string, venueId: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      set({ isLoading: true });

      // Create date suggestion
      const { data, error } = await supabase
        .from('date_suggestions')
        .insert({
          match_id: matchId,
          suggested_by_id: session.user.id,
          venue_id: venueId,
          status: 'pending',
        })
        .select(`
          *,
          venue:venues(*)
        `)
        .single();

      if (error) throw error;

      // Mark match as having date suggested
      await supabase
        .from('matches')
        .update({ 
          date_suggested: true,
          date_suggestion_sent_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      set({ dateSuggestion: data as DateSuggestion });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  respondToDateSuggestion: async (suggestionId: string, accepted: boolean) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      set({ isLoading: true });

      const status = accepted ? 'accepted' : 'declined';

      const { data, error } = await supabase
        .from('date_suggestions')
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq('id', suggestionId)
        .select(`
          *,
          venue:venues(*)
        `)
        .single();

      if (error) throw error;

      // If accepted, update match with venue
      if (accepted && data) {
        await supabase
          .from('matches')
          .update({ venue_selected: data.venue_id })
          .eq('id', data.match_id);

        // Track date count for venue
        await supabase
          .from('venues')
          .update({ date_count: (data.venue as Venue).date_count + 1 })
          .eq('id', data.venue_id);
      }

      set({ dateSuggestion: data as DateSuggestion });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  trackVenueClick: async (venueId: string) => {
    try {
      const { data: venue } = await supabase
        .from('venues')
        .select('click_count')
        .eq('id', venueId)
        .single();

      if (venue) {
        await supabase
          .from('venues')
          .update({ click_count: venue.click_count + 1 })
          .eq('id', venueId);
      }
    } catch (error) {
      console.error('Error tracking venue click:', error);
    }
  },

  fetchDateSuggestion: async (matchId: string) => {
    try {
      set({ isLoading: true });

      const { data, error } = await supabase
        .from('date_suggestions')
        .select(`
          *,
          venue:venues(*)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      set({ dateSuggestion: data as DateSuggestion | null });
    } catch (error: any) {
      console.error('Error fetching date suggestion:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
