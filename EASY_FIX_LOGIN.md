# 🔧 Easy Fix - No F12 Needed!

## ✅ SIMPLEST SOLUTION - Just Reset Everything

### Method 1: Reset Users (Recommended)

```bash
cd AutomobileSMS/backend
npm run seed
```

This recreates all test users with correct passwords. Then try logging in again.

---

## 🧹 Clear Browser Data - Alternative Methods

### Method 1: Clear via Browser Menu

**Chrome/Edge:**
1. Click the **3 dots** (⋮) in top right
2. Go to **Settings** → **Privacy and security**
3. Click **Clear browsing data**
4. Select **Cached images and files** and **Cookies and other site data**
5. Click **Clear data**
6. Close and reopen browser

**Firefox:**
1. Click the **3 lines** (☰) in top right
2. Go to **Settings** → **Privacy & Security**
3. Under **Cookies and Site Data**, click **Clear Data**
4. Select **Cookies and Site Data** and **Cached Web Content**
5. Click **Clear**
6. Close and reopen browser

### Method 2: Use Incognito/Private Window

**Chrome/Edge:**
- Press `Ctrl + Shift + N` (Windows) or `Cmd + Shift + N` (Mac)
- Opens a fresh window with no cached data
- Try logging in there

**Firefox:**
- Press `Ctrl + Shift + P` (Windows) or `Cmd + Shift + P` (Mac)
- Opens a fresh window with no cached data
- Try logging in there

### Method 3: Clear Specific Site Data

**Chrome:**
1. Go to: `chrome://settings/siteData`
2. Search for: `localhost`
3. Click the trash icon to delete
4. Refresh the page

---

## 🔄 Complete Reset Process

### Step 1: Reset Backend Data

```bash
cd AutomobileSMS/backend
npm run seed
```

### Step 2: Clear Browser (Choose ONE method above)

### Step 3: Restart Servers

**Stop both servers** (press `Ctrl + C` in each terminal), then restart:

**Terminal 1 - Backend:**
```bash
cd AutomobileSMS/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd AutomobileSMS/frontend
npm run dev
```

### Step 4: Login

1. Go to: http://localhost:5173/login
2. Use:
   - Email: `employee@test.com`
   - Password: `password123`
3. Should work now!

---

## 🎯 If Still Not Working

### Check Backend Terminal

Look at your backend terminal where you ran `npm run dev`. You should see:
- ✅ "Server running on port 5000"
- ✅ "MongoDB Connected"
- ❌ Any error messages?

### Try Creating New User

Instead of using test user, create a new employee:

1. Go to: http://localhost:5173/register
2. Register with:
   - Email: `test@test.com`
   - Password: `password123`
   - Role: Select **employee** (if option exists) or it will default to customer
3. After registration, if role is customer, you'll need to manually change it in database or use admin to change it

### Manual Database Check (If you have MongoDB access)

Connect to MongoDB and check:

```javascript
use automobile_sms
db.users.find({ email: "employee@test.com" })
```

Should show user with:
- `isActive: true`
- `role: "employee"`

---

## 📱 Mobile Device?

If you're on a phone/tablet:
1. Use **Incognito/Private mode**
2. Or clear browser data through device settings
3. Or use a different browser temporarily

---

## ✅ Expected Result

After running `npm run seed` and clearing browser:

1. ✅ Go to login page
2. ✅ Enter: `employee@test.com` / `password123`
3. ✅ Click "Sign In"
4. ✅ Should redirect to Employee Dashboard automatically
5. ✅ Dashboard should show data (after seeding)

---

## 🆘 Last Resort

If nothing works, manually delete everything and start fresh:

```bash
# 1. Stop servers (Ctrl+C)

# 2. In MongoDB (if you have access):
use automobile_sms
db.users.deleteMany({})
db.appointments.deleteMany({})
db.timelogs.deleteMany({})

# 3. Reseed
cd AutomobileSMS/backend
npm run seed

# 4. Use Incognito/Private window
# 5. Try login
```

---

**The easiest fix: Just run `npm run seed` and use an Incognito/Private window! 🎉**


