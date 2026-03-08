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

  // Photo Verification
  photo_verification_status: ProfileVerificationStatus;
  photo_verified_at?: string;
  last_verification_id?: string;

  // Stats
  response_rate?: number;
  match_count: number;

  // Trust & Safety
  phone_verified: boolean;
  phone_verified_at?: string;
  visibility_modifier: number;
  is_suspended: boolean;
  suspended_until?: string;
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

// Photo Verification Types
export type PhotoVerificationStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'needs_review';
export type ProfileVerificationStatus = 'unverified' | 'pending' | 'verified' | 'expired' | 'rejected';

export interface ModerationLabel {
  Name: string;
  Confidence: number;
  ParentName?: string;
}

export interface FaceBounds {
  origin: { x: number; y: number };
  size: { width: number; height: number };
}

export interface PhotoDeviceMetadata {
  camera_facing: 'front' | 'back';
  captured_at: string;
  capture_method: 'camera';
  on_device_face_detected: boolean;
  on_device_face_count: number;
  on_device_face_bounds?: FaceBounds;
}

export interface PhotoVerification {
  id: string;
  user_id: string;
  photo_url: string;
  photo_storage_path: string;
  is_main_photo: boolean;
  status: PhotoVerificationStatus;
  rejection_reason?: string;

  // Face detection
  face_detected?: boolean;
  face_count?: number;
  face_confidence?: number;

  // Content moderation
  moderation_passed?: boolean;
  moderation_labels?: ModerationLabel[];
  moderation_max_confidence?: number;

  // Face comparison
  face_match_attempted: boolean;
  face_match_passed?: boolean;
  face_match_similarity?: number;
  compared_against_url?: string;

  // Metadata
  device_metadata?: PhotoDeviceMetadata;
  processing_time_ms?: number;
  created_at: string;
  processed_at?: string;
}

export interface PhotoVerificationRequest {
  photo_storage_path: string;
  is_main_photo: boolean;
  device_metadata: PhotoDeviceMetadata;
}

export interface PhotoVerificationResponse {
  verification_id: string;
  status: PhotoVerificationStatus;
  rejection_reason?: string;
  face_detected: boolean;
  moderation_passed: boolean;
  face_match_passed?: boolean;
  face_match_similarity?: number;
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
  date_accepted_at?: string;
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
  | 'brewery'
  | 'activity'
  | 'entertainment'
  | 'spa';

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

// Trust & Safety Types
export type AccuracyRating = 'yes' | 'mostly' | 'no';
export type SocialProvider = 'instagram' | 'linkedin';
export type EnforcementActionType = 'visibility_reduced' | 'visibility_restored' | 'suspended' | 'unsuspended' | 'warned' | 'banned';

export interface ProfileReview {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  match_id: string;
  photos_accurate: AccuracyRating;
  bio_honest: AccuracyRating;
  felt_safe: AccuracyRating;
  created_at: string;
}

export interface ReviewSummary {
  total_reviews: number;
  photos_score: number;
  bio_score: number;
  safety_score: number;
  overall_accuracy: number;
}

export interface Vouch {
  id: string;
  voucher_id: string;
  vouchee_id: string;
  match_id: string;
  created_at: string;
}

export interface SocialLink {
  id: string;
  user_id: string;
  provider: SocialProvider;
  provider_user_id?: string;
  provider_username?: string;
  verified: boolean;
  linked_at: string;
}

export interface TrustScore {
  user_id: string;
  photo_verification_score: number;
  phone_verified_score: number;
  social_linked_score: number;
  vouch_score: number;
  review_score: number;
  behavior_score: number;
  report_score: number;
  composite_score: number;
  ghost_rate: number;
  response_rate: number;
  last_calculated_at: string;
}

export interface EnforcementAction {
  id: string;
  user_id: string;
  action_type: EnforcementActionType;
  reason: string;
  triggered_by: 'automated' | 'admin';
  metadata?: Record<string, any>;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface TrustTier {
  label: string;
  icon: string;
  minVouches: number;
  minReviews: number;
}

// Hint Types
export type HintKey = 'discover_swipe' | 'garden_overview' | 'chat_limits' | 'profile_photo_refresh' | 'photos_verification' | 'post_date_review' | 'settings_privacy';

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
  ProfileDetail: { userId: string; profile?: UserProfile };
  ProfileDetails: { userId: string };
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
  EditPhotos: { editMode: boolean };
  EditDealBreakers: { editMode: boolean };
  Settings: undefined;
  Reviews: undefined;
  PhotoVerification: { photoUri: string; isMain: boolean; deviceMetadata: PhotoDeviceMetadata };
  PostDateReview: { matchId: string; reviewedUserId: string };
  PhoneVerification: undefined;
  CommunityDealBreakers: undefined;
  CommunityDealBreakerSubmit: { cycleId: string };
  AnswerCommunityDealBreaker: { questionId: string };
  CommunityDealBreakerAdmin: { cycleId: string; submissionId: string };
};

// Community Dealbreaker Types
export type CycleStatus = 'active' | 'voting_closed' | 'pending_approval' | 'approved' | 'rejected';
export type AnswerType = 'yes_no' | 'multi_choice';

export interface CommunityDealBreakerCycle {
  id: string;
  cycle_number: number;
  started_at: string;
  ends_at: string;
  status: CycleStatus;
  winning_submission_id?: string;
  approved_question_id?: string;
}

export interface CommunityDealBreakerSubmission {
  id: string;
  cycle_id: string;
  submitted_by: string;
  question_text: string;
  vote_count: number;
  status: 'active' | 'merged';
  merged_into_id?: string;
  created_at: string;
  has_voted?: boolean;
}

export interface CommunityDealBreakerQuestion {
  id: string;
  cycle_id: string;
  question_text: string;
  answer_type: AnswerType;
  answer_options: { value: string; label: string }[];
  is_active: boolean;
  approved_at?: string;
}

export interface CommunityDealBreakerAnswer {
  id: string;
  question_id: string;
  user_id: string;
  answer_value: string;
}

export interface CommunityDealBreakerPreference {
  id: string;
  question_id: string;
  user_id: string;
  acceptable_answers: string[] | null;
}

export interface CommunityAnswerWithPreference {
  questionId: string;
  answerValue: string;
  acceptableAnswers: string[] | null;
}

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

// Push Token Types
export interface PushToken {
  id: string;
  user_id: string;
  expo_push_token: string;
  device_id?: string;
  platform?: 'ios' | 'android';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
