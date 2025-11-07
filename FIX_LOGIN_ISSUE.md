# 🔧 Fix Login Issue - "Change Password" Redirect Loop

If you're experiencing a login loop where you keep getting redirected back to login, follow these steps:

## 🔍 Problem Diagnosis

The issue is likely caused by:
1. **Cached/stale user data** in browser localStorage
2. **Incorrectly hashed passwords** in the database
3. **Redirect logic** sending you to wrong pages

## ✅ Solution Steps

### Step 1: Clear Browser Cache & LocalStorage

1. **Open Browser DevTools** (Press F12)
2. **Go to Application tab** (Chrome) or **Storage tab** (Firefox)
3. **Clear LocalStorage:**
   - Find "Local Storage" → `http://localhost:5173`
   - Delete all items (especially `token` and `user`)
4. **Clear SessionStorage** (same way)
5. **Hard Refresh:** Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Step 2: Reset and Recreate Test Users

Run this to delete and recreate test users with correct passwords:

```bash
cd AutomobileSMS/backend

# Option 1: Reset users only
npm run reset-users

# Option 2: Reset and reseed everything
npm run seed
```

This will:
- ✅ Delete old test users
- ✅ Create fresh users with properly hashed passwords
- ✅ Create test appointments and time logs

### Step 3: Verify Backend is Running

Make sure backend server is running:

```bash
cd AutomobileSMS/backend
npm run dev
```

**Expected output:**
```
🚀 Server running on port 5000
📊 Environment: development
🌐 Frontend URL: http://localhost:5173
```

### Step 4: Try Login Again

1. **Go to:** http://localhost:5173/login
2. **Use these credentials:**
   - Email: `employee@test.com`
   - Password: `password123`
3. **Check browser console** (F12) for any errors
4. **Check backend terminal** for error messages

### Step 5: If Still Not Working - Manual User Creation

If the issue persists, manually create a user via API or MongoDB:

**Via MongoDB Compass or Shell:**
```javascript
// Connect to MongoDB
use automobile_sms

// Delete test user if exists
db.users.deleteOne({ email: "employee@test.com" })

// The seed script will recreate it with correct password
```

Then run:
```bash
npm run seed
```

---

## 🔄 Alternative: Direct Database Check

Check if user exists and is active:

```javascript
// In MongoDB shell
use automobile_sms
db.users.find({ email: "employee@test.com" })
```

**Verify:**
- ✅ `isActive: true`
- ✅ `role: "employee"` or `"admin"`
- ✅ `password` field exists (it's hashed, you won't see the plain text)

---

## 🐛 Debug Steps

### Check Browser Console Errors

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red error messages
4. Copy and share any errors you see

### Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try logging in
4. Look for `/api/auth/login` request
5. Check:
   - **Status Code** (should be 200, not 401 or 500)
   - **Response** tab (see what server returns)

### Check Backend Logs

Look at your backend terminal for:
- ✅ "Login error" messages
- ✅ Database connection errors
- ✅ JWT errors

---

## ✅ Expected Behavior After Fix

When login works correctly:

1. ✅ You enter email and password
2. ✅ Click "Sign In"
3. ✅ See "Login successful!" toast
4. ✅ **Automatically redirect to:** `/employee/dashboard` (for employees)
5. ✅ Dashboard loads with data

---

## 🆘 Still Having Issues?

If nothing works, try this **complete reset**:

```bash
# 1. Stop both servers (Ctrl+C)

# 2. Clear all data (be careful - this deletes everything!)
# In MongoDB:
use automobile_sms
db.users.deleteMany({})
db.appointments.deleteMany({})
db.timelogs.deleteMany({})

# 3. Reseed
cd AutomobileSMS/backend
npm run seed

# 4. Clear browser completely
# - Clear all cookies
# - Clear all localStorage
# - Hard refresh (Ctrl+Shift+R)

# 5. Start servers again
# Terminal 1:
cd backend
npm run dev

# Terminal 2:
cd frontend
npm run dev

# 6. Try login again
```

---

## 📝 Updated Login Flow

After the fix:
- **Employees/Admins** → Redirected to `/employee/dashboard`
- **Customers** → Redirected to `/dashboard`
- **No password change required** (unless you add that feature later)

---

**After following these steps, login should work correctly! 🎉**

