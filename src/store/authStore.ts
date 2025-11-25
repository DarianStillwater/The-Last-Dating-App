import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyPhone: (phone: string, token: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithApple: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateLastActive: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isProfileComplete: false,

  initialize: async () => {
    try {
      set({ isLoading: true });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const isProfileComplete = !!(
          profile?.first_name &&
          profile?.birth_date &&
          profile?.gender &&
          profile?.main_photo_url
        );

        set({
          session,
          user: profile as UserProfile | null,
          isAuthenticated: true,
          isProfileComplete,
        });
        
        // Update last active
        get().updateLastActive();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        const isProfileComplete = !!(
          profile?.first_name &&
          profile?.birth_date &&
          profile?.gender &&
          profile?.main_photo_url
        );

        set({
          session: data.session,
          user: profile as UserProfile | null,
          isAuthenticated: true,
          isProfileComplete,
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  signUpWithEmail: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        set({
          session: data.session,
          isAuthenticated: true,
          isProfileComplete: false,
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithPhone: async (phone: string) => {
    try {
      set({ isLoading: true });
      
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyPhone: async (phone: string, token: string) => {
    try {
      set({ isLoading: true });
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        const isProfileComplete = !!(
          profile?.first_name &&
          profile?.birth_date &&
          profile?.gender &&
          profile?.main_photo_url
        );

        set({
          session: data.session,
          user: profile as UserProfile | null,
          isAuthenticated: true,
          isProfileComplete,
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithApple: async () => {
    try {
      set({ isLoading: true });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      
      await supabase.auth.signOut();
      
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isProfileComplete: false,
      });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      
      if (session) {
        set({ session });
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  },

  updateLastActive: async () => {
    const { user } = get();
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          last_active: new Date().toISOString(),
          is_active: true,
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating last active:', error);
    }
  },
}));
