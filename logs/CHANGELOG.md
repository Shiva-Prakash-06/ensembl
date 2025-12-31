# Changelog

All notable changes to the Ensembl project will be documented in this file.

## [Phase 2] - 2025-12-30

### 🎯 Phase 2: Venue Confidence & Booking Readiness

**Goal:** Improve venue-side usability and booking confidence through better information architecture and credibility signals.

#### 🚀 New Features

##### Venue Dashboard Enhancements
- **Application Management System:** Venues can now view and manage all ensemble applications within the dashboard
  - Applications grouped by status (Pending, Accepted, Rejected)
  - Application counts displayed for each gig
  - Expandable sections to view detailed applications
  - One-click Accept/Reject actions

- **Verified Gig Count Display:** Venue credibility signal prominently shown in dashboard header

- **Enhanced Gig Cards:**
  - Summary view shows total applications count
  - Badge indicators for pending/accepted applications
  - Toggle to expand/collapse application details
  - Improved date/time formatting

##### New Component: Ensemble Application Card
- **Credibility Signals:**
  - Verified gig count badge (trust signal)
  - Member count display
  - Instruments represented as tags
  - Application timestamp

- **Ensemble Profile Preview:**
  - Combined bio snippet (first 3 lines)
  - Media link preview (if available)
  - Complete member roster with instruments
  - Clear Accept/Reject action buttons

- **Comparison-Friendly Design:**
  - Stacked card layout for easy scanning
  - Consistent spacing for alignment
  - All key information visible without scrolling

##### Gigs Page (Musician-Facing) Improvements
- **Enhanced Ensemble Selector:**
  - Shows member count and verified gigs in dropdown
  - Auto-selects first ensemble on load
  - Visual preview of selected ensemble profile
  - "What venues will see" context

- **Credibility Preview Card:**
  - Member tags with instruments
  - Verified gig count badge
  - Helpful messaging about ensemble profile

- **Empty State for No Ensemble:**
  - Warning card explaining need for ensemble
  - Direct link to Ensembles page
  - Clear call-to-action

##### Ensembles Page Enhancements
- **Verified Gig Count Badge:** Added to all ensemble cards
- **Combined Bio Display:** Shown with line-clamp for readability
- **Media Link Preview:** External link with icon
- **Improved Member Display:**
  - Circular avatars with initials
  - Instrument display with emoji
  - Better visual hierarchy

#### 🎨 UI/UX Improvements

##### Microcopy Polish
- "Apply with Ensemble" → "Apply as Ensemble"
- "Accept" → "Accept & Start Chat"
- More descriptive success messages
- Helpful empty state messages throughout

##### Empty States (Consistent Pattern)
- Professional card design with emoji icons
- Clear headings and descriptions
- Direct call-to-action buttons
- Applied to: Gigs, Ensembles, Venue Dashboard

##### Visual Design
- **Credibility Badges:** Consistent indigo design across all views
- **Status Colors:**
  - Green: Accepted/success states
  - Orange: Pending/needs attention
  - Yellow: Warnings/requirements
  - Gray: Neutral/inactive
  - Red: Decline/remove actions
- **Hover Effects:** Subtle shadows on cards
- **Better Spacing:** Improved padding and margins throughout

#### 🛠 Technical Improvements

##### Code Organization
- **New Component:** `EnsembleApplicationCard.jsx` (reusable)
- **Enhanced Components:**
  - `VenueDashboard.jsx` - Full application management
  - `Gigs.jsx` - Credibility preview system
  - `Ensembles.jsx` - Verified count display

##### Design Patterns
- Consistent credibility signal component
- Standardized empty state pattern
- Uniform section headers for categorization
- Responsive grid layouts throughout

#### 📊 Impact

**For Venues:**
- ✅ Faster decision-making with all info visible
- ✅ Increased trust through verified gig counts
- ✅ Better organization of applications by status
- ✅ No need to navigate multiple screens

**For Musicians:**
- ✅ Transparency about what venues see
- ✅ Better understanding of credibility signals
- ✅ Guided workflows with helpful empty states
- ✅ Professional ensemble presentation

#### ⚠️ Important Notes

- **Zero Backend Changes:** All enhancements are frontend-only
- **No Database Modifications:** Uses existing API endpoints
- **No Breaking Changes:** All existing functionality preserved
- **Backward Compatible:** Works with current backend API

---

## [Unreleased] - 2025-12-29

### 🚀 New Features

#### Ensembles & Networking
- **Ensemble Management:** Users can now create Ensembles (bands).
- **Invite System:** - Leaders can invite musicians to join their ensemble via Chat or Jam Board.
    - Users can **Accept** or **Decline** invites directly within the chat interface.
    - Invite status ('pending', 'accepted', 'declined') is persistent and saved in the database.
- **Member Management:** - Leaders can remove members from the ensemble.
    - Members can voluntarily "Leave" an ensemble.
    - System messages are auto-sent to chat when a user joins, leaves, or is removed.

#### Jam Board
- **Raise Hand:** Musicians can toggle a "Raise Hand" status on posts to show interest.
- **Interested Musicians List:** Post authors can view a list of all musicians who raised their hands.
- **Multi-Select Instruments:** Updated post creation to allow selecting multiple instruments (tags) via a custom dropdown.

#### Chat & Notifications
- **Smart Notifications:** Red badge on the navigation bar shows unread message counts.
- **Read Receipts:** Conversations are automatically marked as read when opened.
- **System Messages:** Added support for 'invite' message types with interactive buttons.

#### UI/UX
- **Custom Alert Modal:** Replaced browser `alert()` with a custom styled `AlertModal` for success, errors, and confirmation dialogs (e.g., "Are you sure you want to remove this member?").

### 🛠 Technical Changes

#### Database Models
- **Ensemble:** New model to track bands and their leaders.
- **Message:** Added `msg_type` (text/invite), `related_id` (ensemble_id), and `invite_status` fields.
- **Associations:** Added `ensemble_members` and `ensemble_invites` tables.

#### Backend
- **New Blueprint:** `ensembles.py` handling all group logic.
- Updated `chat.py` to handle `unread-count` and `mark-read`.
- Updated `jam_board.py` to handle list inputs for instruments.

#### Frontend
- Added `EnsembleInviteModal.jsx` for selecting which band to invite a user to.
- Added `AlertModal.jsx` for generic popups.
- Refactored `Chat.jsx` to handle complex message types and optimistic UI updates.

### ⚠️ Breaking Changes
- **Database Reset Required:** Due to significant schema changes (new tables and columns), `ensemble.db` must be deleted and re-created.