import { create } from 'zustand';
import { supabase, uploadPhotoFromUri, deleteImage } from '../lib/supabase';
import type { UserProfile, DealBreakers, VideoPrompt } from '../types';
import { useAuthStore } from './authStore';
import { addDays, format } from 'date-fns';

interface ProfileState {
  profile: UserProfile | null;
  dealBreakers: DealBreakers | null;
  videoPrompts: VideoPrompt[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  fetchDealBreakers: () => Promise<void>;
  createProfile: (data: Partial<UserProfile>) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  updateDealBreakers: (updates: Partial<DealBreakers>) => Promise<{ error: string | null }>;
  uploadMainPhoto: (uri: string) => Promise<{ url: string | null; error: string | null }>;
  uploadGalleryPhoto: (uri: string, position: number) => Promise<{ url: string | null; error: string | null }>;
  deletePhoto: (photoUrl: string, isMain?: boolean) => Promise<{ error: string | null }>;
  updateLocation: (lat: number, lng: number, city?: string, state?: string) => Promise<void>;
  pauseProfile: (paused: boolean) => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;

  // Video prompt actions
  fetchVideoPrompts: (userId?: string) => Promise<void>;
  uploadVideoPrompt: (uri: string, durationSeconds: number, promptKey?: string) => Promise<{ error: string | null }>;
  deleteVideoPrompt: (promptId: string) => Promise<{ error: string | null }>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  dealBreakers: null,
  videoPrompts: [],
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      set({ profile: data as UserProfile | null });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDealBreakers: async () => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('deal_breakers')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      set({ dealBreakers: data as DealBreakers | null });
    } catch (error: any) {
      console.error('Error fetching deal breakers:', error);
    }
  },

  createProfile: async (data: Partial<UserProfile>) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      set({ isLoading: true, error: null });

      const profileData = {
        id: session.user.id,
        email: session.user.email,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        is_active: true,
        is_paused: false,
        is_deleted: false,
        match_count: 0,
        photo_urls: data.photo_urls || [],
      };

      const { data: profile, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      // Create default deal breakers
      await supabase
        .from('deal_breakers')
        .insert({
          user_id: session.user.id,
          max_distance: 25, // Default 25 miles
        });

      set({ profile: profile as UserProfile });
      
      // Update auth store
      useAuthStore.setState({ 
        user: profile as UserProfile,
        isProfileComplete: true,
      });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { profile } = get();
    if (!profile) {
      return { error: 'No profile found' };
    }

    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      set({ profile: data as UserProfile });
      useAuthStore.setState({ user: data as UserProfile });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  updateDealBreakers: async (updates: Partial<DealBreakers>) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { error: 'Not authenticated' };
    }

    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('deal_breakers')
        .upsert(
          { user_id: session.user.id, ...updates },
          { onConflict: 'user_id' },
        )
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      set({ dealBreakers: data as DealBreakers });

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  uploadMainPhoto: async (uri: string) => {
    const { profile } = get();
    if (!profile) {
      return { url: null, error: 'No profile found' };
    }

    try {
      set({ isLoading: true });

      // Generate unique filename
      const filename = `${profile.id}/main_${Date.now()}.jpg`;

      const url = await uploadPhotoFromUri('profile-photos', filename, uri);

      if (!url) {
        return { url: null, error: 'Failed to upload photo' };
      }

      // Set expiration date (30 days from now)
      const expiresAt = format(addDays(new Date(), 30), "yyyy-MM-dd'T'HH:mm:ss'Z'");

      // Update profile with new main photo
      const { error } = await supabase
        .from('profiles')
        .update({
          main_photo_url: url,
          main_photo_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        return { url: null, error: error.message };
      }

      // Update local state
      set({
        profile: {
          ...profile,
          main_photo_url: url,
          main_photo_expires_at: expiresAt,
        },
      });

      return { url, error: null };
    } catch (error: any) {
      return { url: null, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  uploadGalleryPhoto: async (uri: string, position: number) => {
    const { profile } = get();
    if (!profile) {
      return { url: null, error: 'No profile found' };
    }

    if (position < 0 || position > 9) {
      return { url: null, error: 'Invalid photo position' };
    }

    try {
      set({ isLoading: true });

      // Generate unique filename
      const filename = `${profile.id}/gallery_${position}_${Date.now()}.jpg`;

      const url = await uploadPhotoFromUri('profile-photos', filename, uri);

      if (!url) {
        return { url: null, error: 'Failed to upload photo' };
      }

      // Update photo_urls array
      const photoUrls = [...(profile.photo_urls || [])];
      photoUrls[position] = url;

      const { error } = await supabase
        .from('profiles')
        .update({
          photo_urls: photoUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        return { url: null, error: error.message };
      }

      // Update local state
      set({
        profile: {
          ...profile,
          photo_urls: photoUrls,
        },
      });

      return { url, error: null };
    } catch (error: any) {
      return { url: null, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  deletePhoto: async (photoUrl: string, isMain: boolean = false) => {
    const { profile } = get();
    if (!profile) {
      return { error: 'No profile found' };
    }

    try {
      set({ isLoading: true });

      // Extract path from URL
      const urlParts = photoUrl.split('/');
      const path = urlParts.slice(-2).join('/');
      
      await deleteImage('profile-photos', path);

      if (isMain) {
        await supabase
          .from('profiles')
          .update({
            main_photo_url: null,
            main_photo_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        set({
          profile: {
            ...profile,
            main_photo_url: undefined,
            main_photo_expires_at: undefined,
          },
        });
      } else {
        const photoUrls = profile.photo_urls.filter((url) => url !== photoUrl);
        
        await supabase
          .from('profiles')
          .update({
            photo_urls: photoUrls,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        set({
          profile: {
            ...profile,
            photo_urls: photoUrls,
          },
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  updateLocation: async (lat: number, lng: number, city?: string, state?: string) => {
    const { profile } = get();
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          location_lat: lat,
          location_lng: lng,
          location_city: city,
          location_state: state,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (!error) {
        set({
          profile: {
            ...profile,
            location_lat: lat,
            location_lng: lng,
            location_city: city,
            location_state: state,
          },
        });
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  },

  pauseProfile: async (paused: boolean) => {
    const { profile } = get();
    if (!profile) return;

    try {
      set({ isLoading: true });

      const { error } = await supabase
        .from('profiles')
        .update({
          is_paused: paused,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (!error) {
        set({
          profile: {
            ...profile,
            is_paused: paused,
          },
        });
      }
    } catch (error) {
      console.error('Error pausing profile:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAccount: async () => {
    const { profile } = get();
    if (!profile) {
      return { error: 'No profile found' };
    }

    try {
      set({ isLoading: true });

      // Mark as deleted (data retained for potential reactivation)
      const { error } = await supabase
        .from('profiles')
        .update({
          is_deleted: true,
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        return { error: error.message };
      }

      // Sign out
      await useAuthStore.getState().signOut();

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // --------------------------------------------------------
  // Video Prompts
  // --------------------------------------------------------

  fetchVideoPrompts: async (userId?: string) => {
    const targetId = userId || get().profile?.id;
    if (!targetId) return;

    try {
      const { data, error } = await supabase
        .from('video_prompts')
        .select('*')
        .eq('user_id', targetId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ videoPrompts: (data || []) as VideoPrompt[] });
    } catch (error) {
      console.error('Error fetching video prompts:', error);
    }
  },

  uploadVideoPrompt: async (uri: string, durationSeconds: number, promptKey?: string) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return { error: 'Not authenticated' };

    try {
      set({ isLoading: true });

      const userId = session.user.id;
      const storagePath = `${userId}/${Date.now()}.mp4`;

      // Upload video
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return { error: 'Not authenticated' };

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const uploadUrl = `${supabaseUrl}/storage/v1/object/profile-videos/${storagePath}`;

      const { uploadAsync } = await import('expo-file-system/legacy');
      const result = await uploadAsync(uploadUrl, uri, {
        httpMethod: 'POST',
        uploadType: 0,
        headers: {
          Authorization: `Bearer ${authSession.access_token}`,
          'Content-Type': 'video/mp4',
          'x-upsert': 'true',
        },
      });

      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed: ${result.status}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-videos')
        .getPublicUrl(storagePath);

      // Create video prompt record
      const { error } = await supabase
        .from('video_prompts')
        .insert({
          user_id: userId,
          prompt_key: promptKey || null,
          video_url: publicUrl,
          video_storage_path: storagePath,
          duration_seconds: durationSeconds,
        });

      if (error) throw error;

      // Refresh
      await get().fetchVideoPrompts();

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteVideoPrompt: async (promptId: string) => {
    try {
      set({ isLoading: true });

      // Get the prompt to find storage path
      const { data: prompt } = await supabase
        .from('video_prompts')
        .select('video_storage_path')
        .eq('id', promptId)
        .single();

      if (prompt?.video_storage_path) {
        await supabase.storage
          .from('profile-videos')
          .remove([prompt.video_storage_path]);
      }

      const { error } = await supabase
        .from('video_prompts')
        .update({ is_active: false })
        .eq('id', promptId);

      if (error) throw error;

      await get().fetchVideoPrompts();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
}));
