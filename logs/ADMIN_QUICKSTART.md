# Ensembl Admin System - Quick Start Guide

## 🚀 Setup & Access

### 1. Create Admin User
```bash
cd backend
python3 seed_admin.py
```

**Output will show:**
```
✅ Admin user created successfully!
   Email: admin@ensembl.com
   Name: Admin
   User ID: 1  ← USE THIS
   Role: admin
```

### 2. Start Backend
```bash
cd backend
python3 app.py
```
Runs on: http://localhost:5000

### 3. Start Frontend
```bash
cd frontend
npm run dev
```
Runs on: http://localhost:3001

### 4. Access Admin Panel
1. Navigate to: **http://localhost:3001/admin/login**
2. Enter User ID: **1** (from seed script)
3. Click "Access Admin Panel"

---

## 📊 Admin Features

### Dashboard
- Platform metrics (users, content, gigs)
- User breakdown (musicians vs venues)
- Gig completion rates
- Quick action buttons

### User Management
- View all users (paginated)
- Filter by role (musician/venue) or status (active/inactive)
- **Emails are masked for privacy** (e.g., `sh***@gmail.com`)
- Soft-disable/enable users (reversible)

### Venue Management
- View all venues with gig counts
- See verified gig history

### Ensemble Management
- View all ensembles
- See member counts and verified gigs

### Gig Management
- View all gigs with filters (open/closed)
- See application counts
- Close/reopen gigs (reversible)

---

## 🔒 Ethical Boundaries

**Admin CANNOT:**
- ❌ View private chat messages
- ❌ See unmasked user emails
- ❌ Hard-delete users or content
- ❌ Impersonate users
- ❌ Edit user-generated content

**Admin CAN:**
- ✅ View aggregate analytics
- ✅ Soft-disable problematic accounts (reversible)
- ✅ Close problematic gigs (reversible)
- ✅ Monitor platform health

---

## 🛠️ API Testing

### Get Analytics
```bash
curl -H "X-User-Id: 1" http://localhost:5000/api/admin/analytics
```

### List Users
```bash
curl -H "X-User-Id: 1" http://localhost:5000/api/admin/users
```

### Toggle User Active Status
```bash
curl -X POST -H "X-User-Id: 1" http://localhost:5000/api/admin/users/2/toggle-active
```

---

## 📝 Notes

- **Security:** For MVP, authentication is User ID-based. Production should use JWT/sessions.
- **Privacy:** All user emails are automatically masked in the admin interface.
- **Reversibility:** All admin actions are soft deletes/toggles - nothing is permanently deleted.
- **Internal Use:** The admin panel is for authorized personnel only.

---

## 🎯 For Production

**Before deploying to production:**
1. Implement proper JWT/session-based authentication
2. Add audit logging for all admin actions
3. Set up role-based permissions (super-admin, moderator, etc.)
4. Enable HTTPS for all admin endpoints
5. Add rate limiting on admin API
6. Set up monitoring and alerts

---

## 🆘 Troubleshooting

**Admin login fails:**
- Verify admin user was created (`python3 seed_admin.py`)
- Check User ID is correct (should be 1 for first admin)
- Ensure backend is running on port 5000

**API returns 401/403:**
- Verify `X-User-Id` header is set correctly
- Check user has `admin` role in database

**Can't see data:**
- Ensure you have created test data (users, gigs, etc.)
- Check backend console for errors

---

**Access Admin Panel:** http://localhost:3001/admin/login  
**User ID:** 1 (default admin)
