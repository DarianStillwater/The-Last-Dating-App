// User & Profile Types
export type Gender = 'male' | 'female' | 'non-binary' | 'other';

export type Ethnicity = 
  | 'asian' 
  | 'black' 
  | 'hispanic' 
  | 'white' 
  | 'middle_eastern' 
  | 'native_american' 
  | 'pacific_islander' 
  | 'mixed' 
  | 'other';

export type Religion = 
  | 'agnostic' 
  | 'atheist' 
  | 'buddhist' 
  | 'catholic' 
  | 'christian' 
  | 'hindu' 
  | 'jewish' 
  | 'muslim' 
  | 'spiritual' 
  | 'other' 
  | 'prefer_not_to_say';

export type OffspringStatus = 
  | 'has_kids_wants_more' 
  | 'has_kids_doesnt_want_more' 
  | 'no_kids_wants_kids' 
  | 'no_kids_doesnt_want_kids' 
  | 'not_sure';

export type FrequencyLevel = 'never' | 'rarely' | 'sometimes' | 'often' | 'daily';

export type DietType = 
  | 'omnivore' 
  | 'vegetarian' 
  | 'vegan' 
  | 'pescatarian' 
  | 'keto' 
  | 'halal' 
  | 'kosher' 
  | 'other';

export type IncomeRange = 
  | 'under_25k' 
  | '25k_50k' 
  | '50k_75k' 
  | '75k_100k' 
  | '100k_150k' 
  | '150k_200k' 
  | 'over_200k' 
  | 'prefer_not_to_say';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  last_active: string;
  is_active: boolean;
  is_paused: boolean;
  is_deleted: boolean;
  
  // Basic Info
  first_name: string;
  birth_date: string;
  gender: Gender;
  looking_for: Gender[];
  
  // Physical
  height_cm: number;
  ethnicity: Ethnicity;
  
  // Lifestyle
  religion: Religion;
  offspring: OffspringStatus;
  smoker: FrequencyLevel;
  alcohol: FrequencyLevel;
  drugs: FrequencyLevel;
  diet: DietType;
  
  // Professional
  occupation?: string;
  income?: IncomeRange;
  
  // Bio
  bio?: string;
  things_to_know?: string;
  
  // Location (general area, not exact)
  location_lat?: number;
  location_lng?: number;
  location_city?: string;
  location_state?: string;
  
  // Photos
  main_photo_url?: string;
  main_photo_expires_at?: string;
  photo_urls: string[];
  
  // Stats
  response_rate?: number;
  match_count: number;
}

// Deal Breakers - what user requires in a match
export interface DealBreakers {
  id: string;
  user_id: string;
  
  // Age range
  min_age?: number;
  max_age?: number;
  
  // Height range (in cm)
  min_height?: number;
  max_height?: number;
  
  // Distance (in miles)
  max_distance?: number;
  
  // Acceptable values (null means any is acceptable)
  acceptable_ethnicities?: Ethnicity[];
  acceptable_religions?: Religion[];
  acceptable_offspring?: OffspringStatus[];
  acceptable_smoker?: FrequencyLevel[];
  acceptable_alcohol?: FrequencyLevel[];
  acceptable_drugs?: FrequencyLevel[];
  acceptable_diets?: DietType[];
  acceptable_income?: IncomeRange[];
}

// Photo Types
export interface UserPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  is_main: boolean;
  position: number;
  uploaded_at: string;
  expires_at?: string;
}

// Match Types
export type MatchStatus = 'active' | 'unmatched' | 'blocked';

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  status: MatchStatus;
  
  // The other user's profile (populated when fetching)
  other_user?: UserProfile;
  
  // Message stats
  total_messages: number;
  user1_message_count: number;
  user2_message_count: number;
  last_message_at?: string;
  last_message_preview?: string;
  
  // Date suggestion tracking
  date_suggested: boolean;
  date_suggestion_sent_at?: string;
  venue_selected?: string;
}

// Swipe/Like Types
export interface Swipe {
  id: string;
  swiper_id: string;
  swiped_id: string;
  liked: boolean;
  created_at: string;
}

// Message Types
export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

export interface MessageLimit {
  match_id: string;
  user_id: string;
  messages_today: number;
  last_message_date: string;
  can_send: boolean;
}

// Venue Types
export type VenueCategory = 
  | 'indian' 
  | 'thai' 
  | 'french' 
  | 'korean' 
  | 'japanese' 
  | 'italian' 
  | 'mexican' 
  | 'american' 
  | 'chinese'
  | 'mediterranean'
  | 'vietnamese'
  | 'bar'
  | 'coffee'
  | 'activity'
  | 'outdoor'
  | 'entertainment';

export type PaymentTier = 'subscription' | 'per_impression' | 'monthly_package';
export type PartnershipSlot = 1 | 2 | 3;

export interface Venue {
  id: string;
  name: string;
  description?: string;
  category: VenueCategory;
  
  // Location
  address: string;
  city: string;
  state: string;
  zip_code: string;
  lat: number;
  lng: number;
  
  // Partnership details
  partnership_slot: PartnershipSlot;
  payment_tier: PaymentTier;
  service_radius_miles: number;
  
  // Content
  photo_urls: string[];
  menu_url?: string;
  website_url?: string;
  phone?: string;
  
  // Stats
  impression_count: number;
  click_count: number;
  date_count: number;
  
  // Status
  is_active: boolean;
  created_at: string;
}

export interface DateSuggestion {
  id: string;
  match_id: string;
  suggested_by_id: string;
  venue_id: string;
  venue?: Venue;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at?: string;
}

// Review/Notes Types
export type ReviewField = 
  | 'height' 
  | 'age' 
  | 'ethnicity' 
  | 'photos' 
  | 'occupation' 
  | 'religion'
  | 'general';

export interface ProfileReview {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  field: ReviewField;
  is_accurate: boolean;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at?: string;
}

// Report/Block Types
export type ReportReason = 
  | 'fake_profile' 
  | 'inappropriate_content' 
  | 'harassment' 
  | 'spam' 
  | 'underage' 
  | 'other';

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  description?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProfileSetup: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  PhoneVerification: { phone: string };
  ForgotPassword: undefined;
};

export type ProfileSetupStackParamList = {
  BasicInfo: undefined;
  Photos: undefined;
  DealBreakers: undefined;
  Bio: undefined;
  Preview: undefined;
};

export type MainTabParamList = {
  Discover: undefined;
  Matches: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type DiscoverStackParamList = {
  DiscoverMain: undefined;
  ProfileDetail: { userId: string };
};

export type MatchesStackParamList = {
  MatchesList: undefined;
  Chat: { matchId: string };
  DateSuggestion: { matchId: string };
  VenueSelection: { matchId: string; category?: VenueCategory };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  EditPhotos: undefined;
  EditDealBreakers: undefined;
  Settings: undefined;
  Reviews: undefined;
};

// Form Types
export interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInForm {
  email: string;
  password: string;
}

export interface BasicInfoForm {
  first_name: string;
  birth_date: Date;
  gender: Gender;
  looking_for: Gender[];
  height_cm: number;
  ethnicity: Ethnicity;
  religion: Religion;
  offspring: OffspringStatus;
  smoker: FrequencyLevel;
  alcohol: FrequencyLevel;
  drugs: FrequencyLevel;
  diet: DietType;
  occupation?: string;
  income?: IncomeRange;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// Store Types
export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface ProfileState {
  profile: UserProfile | null;
  dealBreakers: DealBreakers | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateDealBreakers: (updates: Partial<DealBreakers>) => Promise<void>;
  uploadPhoto: (uri: string, isMain?: boolean) => Promise<string>;
  deletePhoto: (photoUrl: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface MatchState {
  matches: Match[];
  currentProfiles: UserProfile[];
  currentIndex: number;
  isLoading: boolean;
  hasReachedLimit: boolean;
  fetchMatches: () => Promise<void>;
  fetchDiscoverProfiles: () => Promise<void>;
  swipe: (userId: string, liked: boolean) => Promise<Match | null>;
  unmatch: (matchId: string) => Promise<void>;
}

export interface MessageState {
  conversations: Match[];
  currentMessages: Message[];
  currentMatchId: string | null;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (matchId: string) => Promise<void>;
  sendMessage: (matchId: string, content: string) => Promise<void>;
  checkMessageLimit: (matchId: string) => Promise<MessageLimit>;
}

export interface VenueState {
  suggestedVenues: Venue[];
  selectedVenue: Venue | null;
  isLoading: boolean;
  fetchVenues: (matchId: string, category?: VenueCategory) => Promise<void>;
  selectVenue: (venueId: string) => void;
  submitDateSuggestion: (matchId: string, venueId: string) => Promise<void>;
}
