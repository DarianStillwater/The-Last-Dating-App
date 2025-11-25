export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
          last_active: string;
          is_active: boolean;
          is_paused: boolean;
          is_deleted: boolean;
          first_name: string;
          birth_date: string;
          gender: string;
          looking_for: string[];
          height_cm: number;
          ethnicity: string;
          religion: string;
          offspring: string;
          smoker: string;
          alcohol: string;
          drugs: string;
          diet: string;
          occupation: string | null;
          income: string | null;
          bio: string | null;
          things_to_know: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_city: string | null;
          location_state: string | null;
          main_photo_url: string | null;
          main_photo_expires_at: string | null;
          photo_urls: string[];
          response_rate: number | null;
          match_count: number;
        };
        Insert: {
          id?: string;
          email: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          last_active?: string;
          is_active?: boolean;
          is_paused?: boolean;
          is_deleted?: boolean;
          first_name: string;
          birth_date: string;
          gender: string;
          looking_for: string[];
          height_cm: number;
          ethnicity: string;
          religion: string;
          offspring: string;
          smoker: string;
          alcohol: string;
          drugs: string;
          diet: string;
          occupation?: string | null;
          income?: string | null;
          bio?: string | null;
          things_to_know?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_city?: string | null;
          location_state?: string | null;
          main_photo_url?: string | null;
          main_photo_expires_at?: string | null;
          photo_urls?: string[];
          response_rate?: number | null;
          match_count?: number;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
          last_active?: string;
          is_active?: boolean;
          is_paused?: boolean;
          is_deleted?: boolean;
          first_name?: string;
          birth_date?: string;
          gender?: string;
          looking_for?: string[];
          height_cm?: number;
          ethnicity?: string;
          religion?: string;
          offspring?: string;
          smoker?: string;
          alcohol?: string;
          drugs?: string;
          diet?: string;
          occupation?: string | null;
          income?: string | null;
          bio?: string | null;
          things_to_know?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_city?: string | null;
          location_state?: string | null;
          main_photo_url?: string | null;
          main_photo_expires_at?: string | null;
          photo_urls?: string[];
          response_rate?: number | null;
          match_count?: number;
        };
      };
      deal_breakers: {
        Row: {
          id: string;
          user_id: string;
          min_age: number | null;
          max_age: number | null;
          min_height: number | null;
          max_height: number | null;
          max_distance: number | null;
          acceptable_ethnicities: string[] | null;
          acceptable_religions: string[] | null;
          acceptable_offspring: string[] | null;
          acceptable_smoker: string[] | null;
          acceptable_alcohol: string[] | null;
          acceptable_drugs: string[] | null;
          acceptable_diets: string[] | null;
          acceptable_income: string[] | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          min_age?: number | null;
          max_age?: number | null;
          min_height?: number | null;
          max_height?: number | null;
          max_distance?: number | null;
          acceptable_ethnicities?: string[] | null;
          acceptable_religions?: string[] | null;
          acceptable_offspring?: string[] | null;
          acceptable_smoker?: string[] | null;
          acceptable_alcohol?: string[] | null;
          acceptable_drugs?: string[] | null;
          acceptable_diets?: string[] | null;
          acceptable_income?: string[] | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          min_age?: number | null;
          max_age?: number | null;
          min_height?: number | null;
          max_height?: number | null;
          max_distance?: number | null;
          acceptable_ethnicities?: string[] | null;
          acceptable_religions?: string[] | null;
          acceptable_offspring?: string[] | null;
          acceptable_smoker?: string[] | null;
          acceptable_alcohol?: string[] | null;
          acceptable_drugs?: string[] | null;
          acceptable_diets?: string[] | null;
          acceptable_income?: string[] | null;
        };
      };
      swipes: {
        Row: {
          id: string;
          swiper_id: string;
          swiped_id: string;
          liked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          swiper_id: string;
          swiped_id: string;
          liked: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          swiper_id?: string;
          swiped_id?: string;
          liked?: boolean;
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
          status: string;
          total_messages: number;
          user1_message_count: number;
          user2_message_count: number;
          last_message_at: string | null;
          last_message_preview: string | null;
          date_suggested: boolean;
          date_suggestion_sent_at: string | null;
          venue_selected: string | null;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          created_at?: string;
          status?: string;
          total_messages?: number;
          user1_message_count?: number;
          user2_message_count?: number;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          date_suggested?: boolean;
          date_suggestion_sent_at?: string | null;
          venue_selected?: string | null;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          created_at?: string;
          status?: string;
          total_messages?: number;
          user1_message_count?: number;
          user2_message_count?: number;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          date_suggested?: boolean;
          date_suggestion_sent_at?: string | null;
          venue_selected?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          read_at?: string | null;
        };
      };
      message_limits: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          messages_today: number;
          last_message_date: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          user_id: string;
          messages_today?: number;
          last_message_date?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          user_id?: string;
          messages_today?: number;
          last_message_date?: string;
        };
      };
      venues: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          lat: number;
          lng: number;
          partnership_slot: number;
          payment_tier: string;
          service_radius_miles: number;
          photo_urls: string[];
          menu_url: string | null;
          website_url: string | null;
          phone: string | null;
          impression_count: number;
          click_count: number;
          date_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: string;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          lat: number;
          lng: number;
          partnership_slot: number;
          payment_tier: string;
          service_radius_miles: number;
          photo_urls?: string[];
          menu_url?: string | null;
          website_url?: string | null;
          phone?: string | null;
          impression_count?: number;
          click_count?: number;
          date_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          lat?: number;
          lng?: number;
          partnership_slot?: number;
          payment_tier?: string;
          service_radius_miles?: number;
          photo_urls?: string[];
          menu_url?: string | null;
          website_url?: string | null;
          phone?: string | null;
          impression_count?: number;
          click_count?: number;
          date_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      date_suggestions: {
        Row: {
          id: string;
          match_id: string;
          suggested_by_id: string;
          venue_id: string;
          status: string;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          match_id: string;
          suggested_by_id: string;
          venue_id: string;
          status?: string;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          match_id?: string;
          suggested_by_id?: string;
          venue_id?: string;
          status?: string;
          created_at?: string;
          responded_at?: string | null;
        };
      };
      profile_reviews: {
        Row: {
          id: string;
          reviewer_id: string;
          reviewed_id: string;
          field: string;
          is_accurate: boolean;
          note: string | null;
          status: string;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          reviewed_id: string;
          field: string;
          is_accurate: boolean;
          note?: string | null;
          status?: string;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          reviewer_id?: string;
          reviewed_id?: string;
          field?: string;
          is_accurate?: boolean;
          note?: string | null;
          status?: string;
          created_at?: string;
          reviewed_at?: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_id: string;
          reason: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_id?: string;
          reason?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_compatible_profiles: {
        Args: {
          current_user_id: string;
          limit_count: number;
        };
        Returns: {
          id: string;
          first_name: string;
          birth_date: string;
          gender: string;
          height_cm: number;
          ethnicity: string;
          religion: string;
          bio: string;
          main_photo_url: string;
          photo_urls: string[];
          distance_miles: number;
        }[];
      };
      check_mutual_match: {
        Args: {
          user1: string;
          user2: string;
        };
        Returns: boolean;
      };
      get_midpoint_coordinates: {
        Args: {
          lat1: number;
          lng1: number;
          lat2: number;
          lng2: number;
        };
        Returns: {
          lat: number;
          lng: number;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
