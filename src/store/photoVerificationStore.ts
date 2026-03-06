import { create } from 'zustand';
import { supabase, uploadPhotoFromUri } from '../lib/supabase';
import type {
  PhotoVerification,
  PhotoVerificationResponse,
  PhotoDeviceMetadata,
  ProfileVerificationStatus,
} from '../types';
import { useAuthStore } from './authStore';
import { useProfileStore } from './profileStore';
import { APP_CONFIG } from '../constants';

interface PhotoVerificationState {
  currentVerification: PhotoVerification | null;
  verificationHistory: PhotoVerification[];
  isUploading: boolean;
  isVerifying: boolean;
  error: string | null;

  uploadAndVerifyPhoto: (
    uri: string,
    isMain: boolean,
    metadata: PhotoDeviceMetadata,
  ) => Promise<{ result: PhotoVerificationResponse | null; error: string | null }>;
  fetchVerificationHistory: () => Promise<void>;
  checkPhotoExpiration: () => { isExpired: boolean; daysRemaining: number; showReminder: boolean };
  clearError: () => void;
}

export const usePhotoVerificationStore = create<PhotoVerificationState>((set, get) => ({
  currentVerification: null,
  verificationHistory: [],
  isUploading: false,
  isVerifying: false,
  error: null,

  uploadAndVerifyPhoto: async (uri, isMain, metadata) => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) {
      return { result: null, error: 'Not authenticated' };
    }

    try {
      // Phase 1: Upload to storage
      set({ isUploading: true, isVerifying: false, error: null, currentVerification: null });

      const storagePath = `${session.user.id}/${isMain ? 'main' : 'gallery'}_${Date.now()}.jpg`;

      const url = await uploadPhotoFromUri('profile-photos', storagePath, uri);
      if (!url) {
        set({ isUploading: false });
        return { result: null, error: 'Failed to upload photo' };
      }

      // Phase 2: Call verify-photo Edge Function
      set({ isUploading: false, isVerifying: true });

      const { data, error } = await supabase.functions.invoke('verify-photo', {
        body: {
          photo_storage_path: storagePath,
          is_main_photo: isMain,
          device_metadata: metadata,
        },
      });

      if (error) {
        set({ isVerifying: false, error: error.message });
        return { result: null, error: error.message };
      }

      const result = data as PhotoVerificationResponse;

      if (result.status === 'approved' && isMain) {
        // Refresh profile to pick up the updated main_photo_url and verification status
        await useProfileStore.getState().fetchProfile();
      }

      if (result.status === 'rejected') {
        set({ error: result.rejection_reason || 'Photo was rejected' });
      }

      return { result, error: null };
    } catch (error: any) {
      set({ error: error.message });
      return { result: null, error: error.message };
    } finally {
      set({ isUploading: false, isVerifying: false });
    }
  },

  fetchVerificationHistory: async () => {
    const session = useAuthStore.getState().session;
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('photo_verifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        set({ verificationHistory: data as PhotoVerification[] });
      }
    } catch (error: any) {
      console.error('Error fetching verification history:', error);
    }
  },

  checkPhotoExpiration: () => {
    const profile = useProfileStore.getState().profile ?? useAuthStore.getState().user;
    if (!profile?.main_photo_expires_at) {
      return { isExpired: true, daysRemaining: 0, showReminder: true };
    }

    const expiresAt = new Date(profile.main_photo_expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const reminderDays = APP_CONFIG.PHOTO_EXPIRATION_DAYS - APP_CONFIG.PHOTO_REMINDER_DAYS;

    return {
      isExpired: daysRemaining <= 0,
      daysRemaining: Math.max(0, daysRemaining),
      showReminder: daysRemaining <= reminderDays,
    };
  },

  clearError: () => set({ error: null }),
}));
