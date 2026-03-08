import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type {
  CommunityDealBreakerCycle,
  CommunityDealBreakerSubmission,
  CommunityDealBreakerQuestion,
  CommunityDealBreakerAnswer,
  CommunityDealBreakerPreference,
  CommunityAnswerWithPreference,
} from '../types';
import { useAuthStore } from './authStore';

interface CommunityDealBreakerState {
  currentCycle: CommunityDealBreakerCycle | null;
  submissions: CommunityDealBreakerSubmission[];
  approvedQuestions: CommunityDealBreakerQuestion[];
  myAnswers: CommunityDealBreakerAnswer[];
  myPreferences: CommunityDealBreakerPreference[];
  unansweredQuestions: CommunityDealBreakerQuestion[];
  hasSubmittedThisCycle: boolean;
  isLoading: boolean;
  error: string | null;

  fetchCurrentCycle: () => Promise<void>;
  fetchSubmissions: (cycleId: string) => Promise<void>;
  submitQuestion: (questionText: string) => Promise<{ error: string | null }>;
  voteForSubmission: (submissionId: string) => Promise<{ error: string | null }>;
  removeVote: (submissionId: string) => Promise<{ error: string | null }>;
  fetchApprovedQuestions: () => Promise<void>;
  fetchMyAnswers: () => Promise<void>;
  fetchMyPreferences: () => Promise<void>;
  answerQuestion: (questionId: string, answerValue: string) => Promise<{ error: string | null }>;
  updatePreference: (questionId: string, acceptableAnswers: string[] | null) => Promise<{ error: string | null }>;
  saveAnswersAndPreferences: (items: CommunityAnswerWithPreference[]) => Promise<{ error: string | null }>;
  fetchUnansweredQuestions: () => Promise<void>;
  checkSimilarSubmissions: (questionText: string) => Promise<{ similar: CommunityDealBreakerSubmission[]; error: string | null }>;
  approveQuestion: (submissionId: string, cycleId: string, questionText: string, answerType: string, answerOptions: { value: string; label: string }[]) => Promise<{ error: string | null }>;
  rejectCycleWinner: (cycleId: string) => Promise<{ error: string | null }>;
  subscribeToVotes: (cycleId: string) => () => void;
}

export const useCommunityDealBreakerStore = create<CommunityDealBreakerState>((set, get) => ({
  currentCycle: null,
  submissions: [],
  approvedQuestions: [],
  myAnswers: [],
  myPreferences: [],
  unansweredQuestions: [],
  hasSubmittedThisCycle: false,
  isLoading: false,
  error: null,

  fetchCurrentCycle: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('community_dealbreaker_cycles')
        .select('*')
        .eq('status', 'active')
        .order('cycle_number', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const userId = useAuthStore.getState().session?.user?.id;
      let hasSubmitted = false;

      if (data && userId) {
        const { data: submission } = await supabase
          .from('community_dealbreaker_submissions')
          .select('id')
          .eq('cycle_id', data.id)
          .eq('submitted_by', userId)
          .single();

        hasSubmitted = !!submission;
      }

      set({
        currentCycle: data as CommunityDealBreakerCycle | null,
        hasSubmittedThisCycle: hasSubmitted,
      });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSubmissions: async (cycleId: string) => {
    try {
      set({ isLoading: true, error: null });
      const userId = useAuthStore.getState().session?.user?.id;

      const { data, error } = await supabase
        .from('community_dealbreaker_submissions')
        .select('*')
        .eq('cycle_id', cycleId)
        .eq('status', 'active')
        .order('vote_count', { ascending: false });

      if (error) throw error;

      // Check which submissions the user has voted for
      let votedIds: Set<string> = new Set();
      if (userId && data && data.length > 0) {
        const { data: votes } = await supabase
          .from('community_dealbreaker_votes')
          .select('submission_id')
          .eq('user_id', userId)
          .in('submission_id', data.map((s: any) => s.id));

        if (votes) {
          votedIds = new Set(votes.map((v: any) => v.submission_id));
        }
      }

      const submissions = (data || []).map((s: any) => ({
        ...s,
        has_voted: votedIds.has(s.id),
      }));

      set({ submissions });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  submitQuestion: async (questionText: string) => {
    try {
      set({ isLoading: true, error: null });
      const userId = useAuthStore.getState().session?.user?.id;
      const cycleId = get().currentCycle?.id;

      if (!userId || !cycleId) return { error: 'Not authenticated or no active cycle' };

      const { error } = await supabase
        .from('community_dealbreaker_submissions')
        .insert({
          cycle_id: cycleId,
          submitted_by: userId,
          question_text: questionText.trim(),
          question_text_normalized: questionText.trim().toLowerCase(),
        });

      if (error) throw error;

      set({ hasSubmittedThisCycle: true });
      await get().fetchSubmissions(cycleId);
      return { error: null };
    } catch (error: any) {
      set({ error: error.message });
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  voteForSubmission: async (submissionId: string) => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('community_dealbreaker_votes')
        .insert({ submission_id: submissionId, user_id: userId });

      if (error) throw error;

      // Optimistic update
      set((state) => ({
        submissions: state.submissions.map((s) =>
          s.id === submissionId
            ? { ...s, vote_count: s.vote_count + 1, has_voted: true }
            : s
        ),
      }));

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  removeVote: async (submissionId: string) => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('community_dealbreaker_votes')
        .delete()
        .eq('submission_id', submissionId)
        .eq('user_id', userId);

      if (error) throw error;

      set((state) => ({
        submissions: state.submissions.map((s) =>
          s.id === submissionId
            ? { ...s, vote_count: Math.max(0, s.vote_count - 1), has_voted: false }
            : s
        ),
      }));

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  fetchApprovedQuestions: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('community_dealbreaker_questions')
        .select('*')
        .eq('is_active', true)
        .order('approved_at', { ascending: true });

      if (error) throw error;

      set({ approvedQuestions: (data || []) as CommunityDealBreakerQuestion[] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyAnswers: async () => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('community_dealbreaker_answers')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      set({ myAnswers: (data || []) as CommunityDealBreakerAnswer[] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchMyPreferences: async () => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('community_dealbreaker_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      set({ myPreferences: (data || []) as CommunityDealBreakerPreference[] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  answerQuestion: async (questionId: string, answerValue: string) => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('community_dealbreaker_answers')
        .upsert(
          { question_id: questionId, user_id: userId, answer_value: answerValue },
          { onConflict: 'question_id,user_id' }
        );

      if (error) throw error;

      await get().fetchMyAnswers();
      await get().fetchUnansweredQuestions();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  updatePreference: async (questionId: string, acceptableAnswers: string[] | null) => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return { error: 'Not authenticated' };

      const { error } = await supabase
        .from('community_dealbreaker_preferences')
        .upsert(
          {
            question_id: questionId,
            user_id: userId,
            acceptable_answers: acceptableAnswers,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'question_id,user_id' }
        );

      if (error) throw error;

      await get().fetchMyPreferences();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  saveAnswersAndPreferences: async (items: CommunityAnswerWithPreference[]) => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return { error: 'Not authenticated' };

      for (const item of items) {
        const { error: ansError } = await supabase
          .from('community_dealbreaker_answers')
          .upsert(
            { question_id: item.questionId, user_id: userId, answer_value: item.answerValue },
            { onConflict: 'question_id,user_id' }
          );
        if (ansError) throw ansError;

        const { error: prefError } = await supabase
          .from('community_dealbreaker_preferences')
          .upsert(
            {
              question_id: item.questionId,
              user_id: userId,
              acceptable_answers: item.acceptableAnswers,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'question_id,user_id' }
          );
        if (prefError) throw prefError;
      }

      await get().fetchMyAnswers();
      await get().fetchMyPreferences();
      await get().fetchUnansweredQuestions();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  },

  fetchUnansweredQuestions: async () => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return;

      const { approvedQuestions, myAnswers } = get();

      // If approved questions haven't been fetched yet, fetch them
      let questions = approvedQuestions;
      if (questions.length === 0) {
        await get().fetchApprovedQuestions();
        questions = get().approvedQuestions;
      }

      let answers = myAnswers;
      if (answers.length === 0) {
        await get().fetchMyAnswers();
        answers = get().myAnswers;
      }

      const answeredIds = new Set(answers.map((a) => a.question_id));
      const unanswered = questions.filter((q) => !answeredIds.has(q.id));

      set({ unansweredQuestions: unanswered });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  checkSimilarSubmissions: async (questionText: string) => {
    try {
      const cycleId = get().currentCycle?.id;
      if (!cycleId) return { similar: [], error: 'No active cycle' };

      const { data, error } = await supabase.rpc('find_similar_submissions', {
        p_cycle_id: cycleId,
        p_text: questionText,
        p_threshold: 0.4,
      });

      if (error) throw error;

      return { similar: (data || []) as CommunityDealBreakerSubmission[], error: null };
    } catch (error: any) {
      return { similar: [], error: error.message };
    }
  },

  approveQuestion: async (submissionId, cycleId, questionText, answerType, answerOptions) => {
    try {
      set({ isLoading: true, error: null });
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) return { error: 'Not authenticated' };

      // Insert the approved question
      const { data: question, error: qError } = await supabase
        .from('community_dealbreaker_questions')
        .insert({
          cycle_id: cycleId,
          original_submission_id: submissionId,
          question_text: questionText,
          answer_type: answerType,
          answer_options: answerOptions,
          is_active: true,
          approved_at: new Date().toISOString(),
          approved_by: userId,
        })
        .select()
        .single();

      if (qError) throw qError;

      // Update cycle status
      const { error: cError } = await supabase
        .from('community_dealbreaker_cycles')
        .update({
          status: 'approved',
          approved_question_id: question.id,
        })
        .eq('id', cycleId);

      if (cError) throw cError;

      // Trigger notification edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.functions.invoke('notify-new-community-dealbreaker', {
          body: { question_id: question.id },
        });
      }

      await get().fetchApprovedQuestions();
      return { error: null };
    } catch (error: any) {
      set({ error: error.message });
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  rejectCycleWinner: async (cycleId: string) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('community_dealbreaker_cycles')
        .update({ status: 'rejected' })
        .eq('id', cycleId);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      set({ error: error.message });
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToVotes: (cycleId: string) => {
    const channel = supabase
      .channel(`community-votes-${cycleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_dealbreaker_votes',
        },
        () => {
          // Refetch submissions when votes change
          get().fetchSubmissions(cycleId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
