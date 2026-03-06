import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import type {
  TrustScore,
  ReviewSummary,
  ProfileReview,
  Vouch,
  SocialLink,
  AccuracyRating,
} from '../types';

interface UserTrustData {
  vouchCount: number;
  reviewSummary: ReviewSummary | null;
  socialLinks: SocialLink[];
}

interface TrustState {
  ownTrustScore: TrustScore | null;
  ownReviewSummary: ReviewSummary | null;
  ownVouchCount: number;
  ownSocialLinks: SocialLink[];
  userTrustCache: Record<string, UserTrustData>;
  isLoading: boolean;
  error: string | null;

  fetchOwnTrust: () => Promise<void>;
  fetchUserTrust: (userId: string) => Promise<UserTrustData>;
  submitReview: (
    matchId: string,
    reviewedId: string,
    data: { photos_accurate: AccuracyRating; bio_honest: AccuracyRating; felt_safe: AccuracyRating }
  ) => Promise<{ error: string | null }>;
  submitVouch: (matchId: string, voucheeId: string) => Promise<{ error: string | null }>;
  retractVouch: (vouchId: string) => Promise<{ error: string | null }>;
  hasReviewedMatch: (matchId: string) => Promise<boolean>;
  hasVouchedFor: (userId: string) => Promise<boolean>;
  linkPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyPhoneCode: (phone: string, code: string) => Promise<{ error: string | null }>;
  fetchSocialLinks: () => Promise<SocialLink[]>;
}

export const useTrustStore = create<TrustState>((set, get) => ({
  ownTrustScore: null,
  ownReviewSummary: null,
  ownVouchCount: 0,
  ownSocialLinks: [],
  userTrustCache: {},
  isLoading: false,
  error: null,

  fetchOwnTrust: async () => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    try {
      set({ isLoading: true, error: null });
      const userId = session.user.id;

      const [trustRes, reviewRes, vouchRes, socialRes] = await Promise.all([
        supabase.from('trust_scores').select('*').eq('user_id', userId).single(),
        supabase.rpc('get_review_summary', { target_user_id: userId }),
        supabase.rpc('get_vouch_count', { target_user_id: userId }),
        supabase.from('social_links').select('*').eq('user_id', userId),
      ]);

      set({
        ownTrustScore: trustRes.data as TrustScore | null,
        ownReviewSummary: reviewRes.data?.[0] as ReviewSummary | null,
        ownVouchCount: (vouchRes.data as number) || 0,
        ownSocialLinks: (socialRes.data as SocialLink[]) || [],
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUserTrust: async (userId: string) => {
    try {
      const [reviewRes, vouchRes, socialRes] = await Promise.all([
        supabase.rpc('get_review_summary', { target_user_id: userId }),
        supabase.rpc('get_vouch_count', { target_user_id: userId }),
        supabase.from('social_links').select('*').eq('user_id', userId),
      ]);

      const data: UserTrustData = {
        reviewSummary: reviewRes.data?.[0] as ReviewSummary | null,
        vouchCount: (vouchRes.data as number) || 0,
        socialLinks: (socialRes.data as SocialLink[]) || [],
      };

      set((state) => ({
        userTrustCache: { ...state.userTrustCache, [userId]: data },
      }));

      return data;
    } catch {
      return { vouchCount: 0, reviewSummary: null, socialLinks: [] };
    }
  },

  submitReview: async (matchId, reviewedId, data) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
      set({ isLoading: true });

      const { error } = await supabase.from('profile_reviews').insert({
        reviewer_id: session.user.id,
        reviewed_id: reviewedId,
        match_id: matchId,
        ...data,
      });

      if (error) throw error;

      // Recalculate reviewed user's trust score
      await supabase.rpc('calculate_trust_score', { target_user_id: reviewedId });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  submitVouch: async (matchId, voucheeId) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
      set({ isLoading: true });

      const { error } = await supabase.from('vouches').insert({
        voucher_id: session.user.id,
        vouchee_id: voucheeId,
        match_id: matchId,
      });

      if (error) throw error;

      await supabase.rpc('calculate_trust_score', { target_user_id: voucheeId });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  retractVouch: async (vouchId) => {
    try {
      const { error } = await supabase.from('vouches').delete().eq('id', vouchId);
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  hasReviewedMatch: async (matchId) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return false;

    const { data } = await supabase
      .from('profile_reviews')
      .select('id')
      .eq('reviewer_id', session.user.id)
      .eq('match_id', matchId)
      .single();

    return !!data;
  },

  hasVouchedFor: async (userId) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return false;

    const { data } = await supabase
      .from('vouches')
      .select('id')
      .eq('voucher_id', session.user.id)
      .eq('vouchee_id', userId)
      .single();

    return !!data;
  },

  linkPhone: async (phone) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  verifyPhoneCode: async (phone, code) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Recalculate trust score
      await supabase.rpc('calculate_trust_score', { target_user_id: session.user.id });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  fetchSocialLinks: async () => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return [];

    const { data } = await supabase
      .from('social_links')
      .select('*')
      .eq('user_id', session.user.id);

    const links = (data as SocialLink[]) || [];
    set({ ownSocialLinks: links });
    return links;
  },
}));
