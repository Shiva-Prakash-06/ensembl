# Gig Status System - Clarified

## Status Fields

Each Gig has two status-related fields:

### 1. `status` (String) - Primary Workflow Status
This tracks the gig's lifecycle through the workflow:

- **`'open'`** - Gig is posted but no ensemble has been accepted yet
  - Applications are being accepted
  - Venue is reviewing applications
  - Display: "Open" (Green badge)

- **`'accepted'`** - An ensemble has been accepted, gig is booked
  - Gig date is scheduled with an ensemble
  - Application period is closed (automatically)
  - Display: "Booked" or "Accepted (Booked)" (Blue badge)
  - **Venue can mark as completed after the gig date passes**

- **`'completed'`** - Gig happened and venue marked it as completed
  - Gig date has passed
  - Venue clicked "Mark as Completed"
  - Display: "Completed" (Purple badge)
  - This is the final status

### 2. `is_open` (Boolean) - Application Acceptance
This controls whether new applications are accepted:

- **`true`** - Accepting new applications
- **`false`** - Not accepting applications (either manually closed or auto-closed when ensemble accepted)

**Note:** This field is semi-deprecated. The `status` field is now the primary indicator.

## Status Flow Diagram

```
Venue Posts Gig
       ↓
   status: 'open'
   is_open: true
       ↓
Venue Accepts Ensemble Application
       ↓
   status: 'accepted'
   is_open: false (auto-closed)
       ↓
   [Gig Date Passes]
       ↓
Venue Marks as Completed
       ↓
   status: 'completed'
   completed_at: [timestamp]
```

## Display Labels (Clarified)

### Old Terminology (Confusing)
- ❌ "Closed" - Ambiguous (closed to applications? or completed?)
- ❌ "Accepted" - Unclear what it means to users

### New Terminology (Clear)
- ✅ "Open" - Accepting applications
- ✅ "Booked" - Ensemble confirmed, gig scheduled
- ✅ "Completed" - Gig happened and confirmed
- ✅ "Apps Closed" - For open gigs where venue manually closed applications

## Admin Dashboard Metrics

The admin dashboard now shows accurate counts:

```javascript
{
  gigs: {
    total: 3,           // All gigs
    open: 1,            // status='open' (no ensemble yet)
    accepted: 1,        // status='accepted' (booked but not completed)
    completed: 1        // status='completed' (done)
  }
}
```

### Before (Bug)
- Counted "completed" based on `GigApplication.confirmed_at`
- This was counting post-gig confirmations, not gig completion
- Missed "accepted" gigs entirely

### After (Fixed)
- Counts based on `Gig.status` field
- Shows all three states clearly
- "Accepted (Booked)" metric added to dashboard

## Button Labels

### Admin Gigs Page
- For open/accepted gigs: "Close Apps" / "Reopen Apps"
  - Makes it clear this only affects application acceptance
  - Doesn't mark the gig as complete

### Venue Dashboard
- For accepted gigs (after date): "Mark as Completed"
  - Clear action that moves status to 'completed'

## Database Schema

```sql
CREATE TABLE gigs (
  id INTEGER PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'open',  -- 'open', 'accepted', 'completed'
  is_open BOOLEAN DEFAULT true,       -- Can accept applications?
  completed_at DATETIME,              -- When marked completed (NULL until completed)
  date_time DATETIME NOT NULL,        -- When gig happens
  ...
);
```

## Testing with Seed Data

The seed script creates 3 gigs demonstrating each status:

1. **Gig 1** - "Friday Night Jazz Session"
   - Status: `completed`
   - Date: 7 days ago
   - Marked completed 6 days ago

2. **Gig 2** - "Blues Night at The Red Lion"
   - Status: `accepted`
   - Date: 2 days ago (past)
   - **Can be marked as completed by venue**

3. **Gig 3** - "Sunday Acoustic Brunch"
   - Status: `open`
   - Date: 14 days in future
   - Accepting applications

## API Responses

All gig objects now include `status` field:

```json
{
  "id": 1,
  "title": "Jazz Night",
  "status": "accepted",
  "is_open": false,
  "completed_at": null,
  "date_time": "2025-12-29T20:00:00"
}
```
