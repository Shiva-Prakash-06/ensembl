# Changelog

All notable changes to the Ensembl project will be documented in this file.

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
- **Database Reset Required:** Due to significant schema changes (new tables and columns), `ensembles.db` must be deleted and re-created.