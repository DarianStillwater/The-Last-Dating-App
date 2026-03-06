import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { uploadAsync } from 'expo-file-system/legacy';
import { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Custom storage adapter for React Native using SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Error storing item:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper to get authenticated user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

// Helper to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Storage helpers
export const uploadImage = async (
  bucket: string,
  path: string,
  file: Blob | ArrayBuffer,
  contentType: string = 'image/jpeg'
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// Upload a local file URI (camera/picker) to Supabase Storage.
// Uses expo-file-system which reliably handles file:// URIs on both iOS and Android.
export const uploadPhotoFromUri = async (
  bucket: string,
  path: string,
  uri: string,
): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');

    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    const result = await uploadAsync(uploadUrl, uri, {
      httpMethod: 'POST',
      uploadType: 0, // FileSystemUploadType.BINARY_CONTENT
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
      },
    });

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Upload failed with status ${result.status}: ${result.body}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
};

export const deleteImage = async (bucket: string, path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Real-time subscription helper
export const subscribeToChannel = (
  channelName: string,
  table: string,
  filter: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export default supabase;
