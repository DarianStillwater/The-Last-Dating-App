# Manual QA Test Plan — The Last Dating App

## Context

The app is feature-complete and running on Expo. Before going live, every user flow needs to be manually tested on real devices. This plan covers solo testing (one device) and multi-device testing (with 2-3 friends) to validate matching, messaging, and real-time features.

**Testing approach:**
- **Phase 1 (Expo Go):** Test all features except push notifications and deep linking
- **Phase 2 (Dev Client):** Build via `eas build --profile development`, install on devices, test push notifications + deep linking

**Known limitations:**
- No venue partners → venue selection will show "No venues found" (expected)
- AWS secrets not configured → photo verification edge function will fail gracefully (expected — app allows proceeding)
- Push notifications won't work in Expo Go — tested only in Phase 2 with dev client

**Testers:** 3 people (you + 2 friends), 3 devices

---

## Pre-Test Setup

### Test Accounts
Create **3 test accounts** with different emails (you + 2 friends):
- **User A** (you): Primary tester, runs all solo tests
- **User B** (friend 1): Matching/messaging partner
- **User C** (friend 2): Third party for blocking, reporting, multi-match scenarios

All 3 accounts need **compatible profiles** for matching to work:
- Overlapping gender/looking_for (e.g., User A is male looking for women, User B is female looking for men)
- Overlapping age ranges in deal breakers
- Reasonable distance (same city, or set distance to 500 miles)

### Environment Checklist
- [ ] `.env` has valid `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Supabase project is running with all migrations applied
- [ ] App loads on Expo Go without white screen
- [ ] Each tester has the app running on their device via Expo Go (same WiFi network, scan QR code)
- [ ] Location services enabled on all devices (needed for distance-based matching)

---

## Test 1: Authentication (Solo)

### 1.1 Welcome Screen
- [ ] App launches to Welcome screen with "Create Account" and "I already have an account" buttons
- [ ] Feature cards render (100% Free, Curated Venues, Real Connections)

### 1.2 Sign Up
- [ ] Tap "Create Account" → navigates to Sign Up screen
- [ ] Submit empty form → shows validation errors
- [ ] Enter invalid email (e.g. "abc") → shows email format error
- [ ] Enter password < 8 chars → shows "at least 8 characters" error
- [ ] Enter mismatched passwords → shows mismatch error
- [ ] Enter valid email + password + confirm → creates account, navigates to BasicInfo
- [ ] Try signing up with same email again → shows "already registered" error

### 1.3 Sign In
- [ ] Tap "I already have an account" → navigates to Sign In
- [ ] Enter wrong password → shows error
- [ ] Enter correct credentials → navigates to Main (if profile complete) or Profile Setup (if not)
- [ ] Sign out from Settings, then sign back in → session restores correctly

### 1.4 Session Persistence
- [ ] Close app completely, reopen → stays signed in (no login screen)
- [ ] Force close and reopen → same result

---

## Test 2: Profile Setup Flow (Solo)

### 2.1 Basic Info — Step 1 (Name, Birthday, Gender, Looking For)
- [ ] "Continue" button disabled until all required fields filled
- [ ] Enter first name (< 2 chars) → button stays disabled
- [ ] Enter valid name (2+ chars) → field accepted
- [ ] Open birthday picker → defaults reasonable, cannot select under 18
- [ ] Select gender from grid (Man/Woman/Non-binary/Other)
- [ ] Select "Looking for" (can multi-select: Men, Women, Everyone)
- [ ] Tap Continue → advances to Step 2
- [ ] Tap Back → returns to step 1 with data preserved

### 2.2 Basic Info — Step 2 (Height, Ethnicity, Religion)
- [ ] Height shows in both cm and feet/inches
- [ ] +/- buttons adjust height by 1cm
- [ ] Height stays within 150-220cm range
- [ ] Ethnicity single-select works
- [ ] Religion single-select works
- [ ] Continue → Step 3

### 2.3 Basic Info — Step 3 (Lifestyle)
- [ ] Children, Smoking, Drinking, Drugs, Diet all render as option grids
- [ ] Each requires one selection
- [ ] Continue → Step 4

### 2.4 Basic Info — Step 4 (Optional)
- [ ] Occupation text input (optional, can skip)
- [ ] Income bracket (optional, can skip)
- [ ] Continue → Photos screen

### 2.5 Photos Screen
- [ ] Main photo slot shows camera icon, "Required" label
- [ ] Tap main photo → requests camera permission
- [ ] If permission denied → shows alert directing to settings
- [ ] If permission granted → opens front camera
- [ ] Take selfie → photo appears in main slot
- [ ] 9 gallery slots render as grid
- [ ] Tap gallery slot → opens image picker (photo library)
- [ ] Select image → appears in slot with remove (X) button
- [ ] Tap X → removes photo
- [ ] Count label updates (e.g. "2/9 gallery photos")
- [ ] Tap "Continue" without main photo → shows alert "Photo Required"
- [ ] Tap "Continue" with main photo → navigates to PhotoVerification

### 2.6 Photo Verification Screen (AWS not configured)
- [ ] Shows "Uploading your photo..." spinner (upload to Supabase storage should succeed)
- [ ] Then "Verifying your photo..." spinner
- [ ] Edge function call fails gracefully → shows error state (expected without AWS secrets)
- [ ] Error message is user-friendly, not a raw stack trace
- [ ] "Try Again" or "Continue" button available — user can proceed to DealBreakers
- [ ] **Key check:** App does NOT crash, user is NOT stuck on this screen

### 2.7 Deal Breakers Screen
- [ ] All 9 sections render collapsed with summary text
- [ ] Tap section header → expands to show options
- [ ] Age range dual slider works (min can't exceed max)
- [ ] Height range dual slider works
- [ ] Distance chip buttons (5, 10, 25, 50, 100, 500) each selectable
- [ ] Multi-select chips work for ethnicity, religion, etc.
- [ ] Empty selection shows "Any" in collapsed summary
- [ ] Tap Continue → navigates to Bio

### 2.8 Bio Screen
- [ ] "About Me" textarea with character counter (X/500)
- [ ] Cannot exceed 500 characters
- [ ] "Things to Know" textarea with counter (X/300)
- [ ] Both fields optional
- [ ] Tips section renders
- [ ] Tap "Preview Profile" → navigates to Preview screen

### 2.9 Preview Screen
- [ ] Main photo displays full width
- [ ] Name + Age render correctly (age calculated from birthday)
- [ ] Height displays in feet/inches format
- [ ] Bio section shows (if entered)
- [ ] Details section shows all selected attributes with correct labels
- [ ] Gallery thumbnails show in horizontal scroll (if any uploaded)
- [ ] "Go Back" button works
- [ ] "Looks Good!" → shows loading, creates profile
- [ ] After success → navigates to Main tab screen (Discover)
- [ ] **If profile creation fails** → shows alert, stays on screen

---

## Test 3: Main Navigation (Solo)

### 3.1 Tab Bar
- [ ] 4 tabs visible: Discover, Matches, Messages, Profile
- [ ] Each tab has correct icon (compass, heart, chatbubbles, person)
- [ ] Active tab icon is filled, inactive is outline
- [ ] Active tab tinted primary color (#FF6B6B)
- [ ] Tapping each tab navigates to correct screen

### 3.2 Profile Tab
- [ ] Shows your profile photo, name, age, height
- [ ] Verification badge visible
- [ ] Stats row: Matches count, Response rate, Photo count
- [ ] Menu items: Edit Profile, Manage Photos, Deal Breakers, Privacy & Safety, Notifications, Help & Support
- [ ] "Edit Profile" → navigates to EditProfile screen
- [ ] "Sign Out" button at bottom → signs out, returns to Welcome

---

## Test 4: Edit Profile (Solo)

- [ ] All 15 fields pre-populated with current profile data
- [ ] Edit first name → Save → verify name updated
- [ ] Change height → Save → verify height updated
- [ ] Change bio → Save → verify bio updated (check character counter works)
- [ ] Save button disabled until valid changes made
- [ ] Back button returns without saving

---

## Test 5: Settings (Solo)

- [ ] Push Notifications toggle reflects actual permission status
- [ ] Toggling notifications off/on works (in dev client only, not Expo Go)
- [ ] "Pause Profile" toggle exists
- [ ] Email displayed (read-only)
- [ ] "Delete Account" shows confirmation alert
- [ ] Tap Cancel → stays on settings
- [ ] (**Don't actually delete** — test on a throwaway account if needed)
- [ ] "Sign Out" works → returns to Welcome screen

---

## Test 6: Discovery & Matching (Multi-Device — Needs User B)

**Setup:** User A and User B both complete profile setup with compatible deal breakers (overlapping age, distance, gender preferences).

### 6.1 Discover Screen — No Profiles
- [ ] If no compatible profiles exist → shows "No more profiles" empty state
- [ ] Pull to refresh → re-fetches profiles

### 6.2 Discover Screen — Profiles Available
- [ ] Profile cards render with photo, name, age, height
- [ ] Swipe right (or tap heart) → card animates away
- [ ] Swipe left (or tap X) → card animates away
- [ ] Next profile appears from the stack
- [ ] Match counter badge shows current count (e.g. "0/10")

### 6.3 One-Way Like (No Match Yet)
- [ ] User A swipes right on User B → no match alert (B hasn't swiped yet)
- [ ] User B checks their Discover → User A's profile should appear
- [ ] Verify User A does NOT appear in User B's discover again after swiping

### 6.4 Mutual Like → Match
- [ ] User B swipes right on User A → **Match alert appears**: "It's a Match!"
- [ ] Alert has two options: "Keep Swiping" and "Send Message"
- [ ] Tap "Send Message" → navigates to Chat screen
- [ ] Match counter updates (1/10)
- [ ] Both users see each other in the Matches tab

### 6.5 Swipe Left (Pass)
- [ ] User A swipes left on User C → no match
- [ ] User C does not appear again in User A's discover queue

### 6.6 Profile Detail from Discover
- [ ] Tap on a profile card → ProfileDetail modal slides up
- [ ] Photo carousel with page dots
- [ ] All profile info visible (name, age, height, bio, details)
- [ ] Close button (X) dismisses modal
- [ ] Can still swipe after dismissing

---

## Test 7: Match Limit (Multi-Device)

**This requires 10+ matches to fully test, so simulate with database if needed.**

- [ ] After reaching 10 active matches → Discover shows "You have 10 active matches" message
- [ ] Swipe right is blocked → no new matches created
- [ ] "View Matches" button navigates to Matches tab
- [ ] Unmatch one person → match count drops to 9
- [ ] Return to Discover → swiping works again

---

## Test 8: Messaging (Multi-Device — Needs User B)

**Prerequisite:** User A and User B are matched.

### 8.1 Opening a Chat
- [ ] Go to Matches tab → see User B in "New Matches" horizontal scroll
- [ ] Tap User B → opens Chat screen
- [ ] Chat is empty, input field ready

### 8.2 Sending Messages
- [ ] Type a message → Send button enables
- [ ] Tap Send → message appears in chat bubble (right side, primary color)
- [ ] Message appears on User B's device in real-time (left side, gray)
- [ ] Send 2 more messages (total 3) → message limit banner may appear: "Waiting for a reply. X messages left today."

### 8.3 Message Limit (3 per day before reply)
- [ ] After 3 messages without reply → input disabled with "Waiting for a reply" message
- [ ] User B sends a reply → User A's limit lifts (conversation established)
- [ ] User A can now send unlimited messages

### 8.4 Real-Time Messaging
- [ ] User A sends message → appears on User B's screen within 1-2 seconds
- [ ] User B replies → appears on User A's screen within 1-2 seconds
- [ ] Rapid back-and-forth (5+ messages each) → all messages in correct order

### 8.5 Chat Header
- [ ] Shows User B's photo, name, age
- [ ] Tap profile area → opens ProfileDetail modal for User B
- [ ] Options menu (three dots) → shows Unmatch, Block, Report

### 8.6 Conversations List
- [ ] Messages tab shows conversation with last message preview
- [ ] Timestamp shows relative time (e.g. "2 min ago")
- [ ] Matches tab moves User B from "New Matches" to "Conversations" after first message

---

## Test 9: Date Suggestion Flow (Multi-Device)

**Prerequisite:** User A and User B have exchanged 10+ messages (5+ each).

### 9.1 Date Suggestion Banner
- [ ] After 10 total messages (5 each minimum) → yellow "Time for a date!" banner appears in chat
- [ ] Banner shows restaurant icon and "Tap to pick a venue together"

### 9.2 Date Suggestion Screen
- [ ] Tap banner → DateSuggestion modal opens
- [ ] Shows venue category grid (8 categories visible)
- [ ] "See All Options" button at bottom

### 9.3 Venue Selection (No Partners)
- [ ] Tap any category → VenueSelection screen
- [ ] **Expected result:** "No venues found" empty state (since no venue partners are signed up)
- [ ] "We couldn't find any venues in this category near your midpoint."
- [ ] Back button works

### 9.4 Venue Selection (With Test Venues — Optional)
If you want to test the full flow, manually insert a test venue into the `venues` table via Supabase SQL Editor:
```sql
INSERT INTO venues (name, category, description, address, city, state, zip_code, lat, lng, service_radius_miles, is_active, partnership_slot, payment_tier)
VALUES ('Test Restaurant', 'italian', 'A test venue', '123 Main St', 'San Francisco', 'CA', '94105', 37.7749, -122.4194, 50, true, 1, 'subscription');
```
- [ ] Venue card renders with name, category badge, description, address
- [ ] Tap card → selects it (primary border appears)
- [ ] "Suggest Test Restaurant" button appears
- [ ] Tap suggest → returns to chat, date_suggested flag set on match

---

## Test 10: Unmatch, Block, Report (Multi-Device)

### 10.1 Unmatch
- [ ] In Chat with User B → tap options (three dots) → "Unmatch"
- [ ] Confirmation alert appears
- [ ] Tap "Unmatch" → navigates back, match removed from both users
- [ ] User B no longer sees User A in Matches
- [ ] Match count decremented for both users
- [ ] User A can now discover User B again (re-swipeable)

### 10.2 Block
- [ ] Match with User C, then in Chat → options → "Block"
- [ ] Confirmation alert appears with "can't see or match again" warning
- [ ] Tap "Block" → navigates back, match removed
- [ ] User C does NOT appear in User A's discover anymore
- [ ] User A does NOT appear in User C's discover anymore

### 10.3 Report
- [ ] Match with someone, in Chat → options → "Report"
- [ ] Reason picker: Fake Profile, Harassment, Inappropriate Content, Spam
- [ ] Select reason → confirmation alert
- [ ] Confirm → report created, user blocked, navigates back

---

## Test 11: Photo Expiration (Solo — Simulated)

**To test without waiting 30 days, update the expiration date via SQL:**
```sql
UPDATE profiles
SET main_photo_expires_at = NOW() - INTERVAL '1 day'
WHERE email = 'your-test-email@example.com';
```

- [ ] Profile tab shows red "Your photo has expired" banner
- [ ] Discover tab shows "Your photo has expired. Take a new selfie to continue discovering people."
- [ ] Discover is blocked — cannot swipe
- [ ] "Update Photo" button navigates to profile/camera flow

**To test reminder (5 days before expiry):**
```sql
UPDATE profiles
SET main_photo_expires_at = NOW() + INTERVAL '4 days'
WHERE email = 'your-test-email@example.com';
```

- [ ] Profile tab shows yellow "Your photo expires in X days" banner
- [ ] Discovery still works (not blocked yet)

---

## Test 12: Edge Cases & Error Handling (Solo)

### 12.1 Network Errors
- [ ] Turn on airplane mode → try to swipe → error handled gracefully (no crash)
- [ ] Turn on airplane mode → try to send message → error alert
- [ ] Restore network → app recovers without restart

### 12.2 Empty States
- [ ] New account with no matches → Matches tab shows "No matches yet"
- [ ] No conversations → Messages tab shows "No messages yet"
- [ ] No compatible profiles → Discover shows "No more profiles" with refresh

### 12.3 Error Boundary
- [ ] If any screen crashes (unlikely but possible) → "Something went wrong" screen with "Try Again" button renders instead of white screen

### 12.4 Long Text
- [ ] Enter max-length bio (500 chars) → counter shows 500/500, can't type more
- [ ] Enter max-length "things to know" (300 chars) → same behavior
- [ ] Long name (e.g. 50 chars) → renders without layout break

### 12.5 Deep Linking
- [ ] Open URL `lastdatingapp://chat/some-match-id` → should navigate to chat (in dev client only)

---

## Test 13: Push Notifications (Dev Client Build Only)

**Requires:** `eas build --profile development` and installing the dev client on device.

### 13.1 Permission
- [ ] On first login → notification permission prompt appears
- [ ] Accept → token saved to push_tokens table
- [ ] Deny → app continues without notifications

### 13.2 Match Notification
- [ ] User B likes User A (creating a match) → User A receives push: "You have a new match!"
- [ ] Tap notification → app opens to Matches screen

### 13.3 Message Notification
- [ ] User B sends message → User A receives push with message preview
- [ ] Tap notification → app opens to Chat with User B

### 13.4 Settings Toggle
- [ ] Settings → toggle notifications off → tokens deactivated in DB
- [ ] Toggle back on → tokens reactivated
- [ ] Verify: send message after toggling off → no push received

---

## Bug Report Template

For each bug found, record:

```
**Bug #:** [number]
**Screen:** [which screen]
**Steps to Reproduce:**
1. ...
2. ...
3. ...
**Expected:** [what should happen]
**Actual:** [what actually happened]
**Severity:** Critical / High / Medium / Low
**Screenshot:** [attach if possible]
**Device:** [iPhone X / Pixel 7 / etc.]
**OS:** [iOS 17.2 / Android 14 / etc.]
```

---

## Test Execution Order

### Day 1 — Expo Go Testing

**Phase 1 — Solo, on your device (~1 hour):**
- Tests 1, 2, 3, 4, 5 (auth, profile setup, navigation, edit profile, settings)
- Test 12 (edge cases, error handling)
- Make sure your profile is fully set up and working before inviting friends

**Phase 2 — All 3 testers on Expo Go (~1.5 hours):**
- Friends install Expo Go, scan QR code, create accounts + profiles
- Test 6 (discovery and matching — User A ↔ User B, User A ↔ User C)
- Test 8 (messaging — real-time chat between matched users)
- Test 9 (date suggestion flow — exchange 10+ messages, see banner, try venues)
- Test 10 (unmatch User B, block User C, report — test safety features)

**Phase 3 — Simulated edge cases (~30 min):**
- Test 7 (match limit — may need SQL to create dummy matches to reach 10)
- Test 11 (photo expiration — requires SQL update to simulate expired photo)

### Day 2 — Dev Client Build (Optional, for Push Notifications)

- Run `eas build --profile development --platform ios` (and/or android)
- Install dev client on all 3 devices
- Test 13 (push notifications — match notifications, message notifications, settings toggle)
- Test 12.5 (deep linking — open `lastdatingapp://chat/{matchId}` URL)

---

## Pass Criteria for Production Launch

**Must pass (blockers):**
- [ ] Sign up + Sign in work end-to-end
- [ ] Full profile setup flow completes without crash
- [ ] Two users can match via mutual likes
- [ ] Real-time messaging works between matched users
- [ ] Unmatch removes the match for both users
- [ ] Block prevents future discovery
- [ ] Empty states render correctly (no crashes)
- [ ] Network errors don't crash the app
- [ ] Sign out and sign back in preserves data

**Should pass (important but not blocking):**
- [ ] Message limit (3/day) enforced before first reply
- [ ] Date suggestion banner appears after 10 messages
- [ ] Photo expiration banner shows correctly
- [ ] Edit profile saves and persists changes
- [ ] Deal breaker filters affect discovery results

**Nice to have (defer if needed):**
- [ ] Push notifications deliver and navigate correctly
- [ ] Venue selection works with test data
- [ ] Deep linking opens correct screens
- [ ] Match limit (10) blocks discovery correctly
