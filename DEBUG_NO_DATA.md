# 🐛 Debug: Dashboard Not Loading Data

If you're on the employee dashboard but see empty stats and no services, follow these steps:

## 🔍 Step 1: Check Browser Console for Errors

**Even without F12, try these methods:**

### Method A: Right-click Method
1. **Right-click** anywhere on the page
2. Select **"Inspect"** or **"Inspect Element"**
3. Click **"Console"** tab
4. Look for **RED error messages**

### Method B: Browser Menu
- **Chrome:** Menu (3 dots) → More Tools → Developer Tools → Console
- **Firefox:** Menu (3 lines) → More Tools → Web Developer Tools → Console

**What to look for:**
- ❌ Red errors mentioning "API", "fetch", "network", "401", "404", "500"
- ✅ Copy any error messages you see

---

## 🌐 Step 2: Check Network Tab (API Calls)

1. Open DevTools (using methods above)
2. Go to **"Network"** tab
3. **Refresh the page** (F5)
4. Look for these requests:
   - `/api/employees/dashboard-stats`
   - `/api/employees/assigned-services`

**Check each request:**
- **Status Code:**
  - ✅ `200` = Success
  - ❌ `404` = Route not found (backend issue)
  - ❌ `401` = Not authenticated
  - ❌ `500` = Server error
- **Click on the request → "Response" tab** → See error message

---

## 🖥️ Step 3: Check Backend Terminal

Look at your backend terminal (where you ran `npm run dev`):

**Should see:**
```
🚀 Server running on port 5000
📊 Environment: development
🌐 Frontend URL: http://localhost:5173
🗄️  MongoDB Connected: ...
```

**Look for errors:**
- ❌ "Error loading dashboard data"
- ❌ "MongoDB connection failed"
- ❌ "Route not found"
- ❌ Any red error messages

---

## ✅ Step 4: Verify Test Data Exists

Run this to check if seed script worked:

```bash
# Option 1: Check if users exist
cd AutomobileSMS/backend
node -e "
import('./models/User.js').then(async (UserModule) => {
  const User = UserModule.default;
  const connectDB = (await import('./config/database.js')).default;
  await connectDB();
  const employee = await User.findOne({ email: 'employee@test.com' });
  console.log('Employee:', employee ? 'EXISTS ✅' : 'NOT FOUND ❌');
  if (employee) console.log('Employee ID:', employee._id);
  process.exit(0);
});
"
```

**Or verify in MongoDB directly:**
```javascript
use automobile_sms
db.users.find({ email: "employee@test.com" })
db.appointments.find({ assignedEmployee: { $exists: true } })
db.timelogs.find()
```

---

## 🔧 Step 5: Most Common Fixes

### Fix 1: Re-run Seed Script
```bash
cd AutomobileSMS/backend
npm run seed
```

Wait for all ✅ messages, then refresh dashboard.

### Fix 2: Check Backend Server is Running
```bash
# Should be running in one terminal
cd AutomobileSMS/backend
npm run dev

# Should show: "Server running on port 5000"
```

### Fix 3: Check MongoDB Connection
Look at backend terminal for:
- ✅ `MongoDB Connected: ...`
- ❌ `Database connection failed` = MongoDB not running

**Start MongoDB if needed:**
```bash
# If using Docker:
docker-compose up mongodb -d

# If local:
mongod
```

### Fix 4: Check API URL
Verify frontend is calling correct backend:

**In frontend terminal, check:**
```
VITE_API_URL=http://localhost:5000/api
```

**Or create/check `.env` file in frontend folder:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

Then **restart frontend server**.

---

## 🧪 Step 6: Test API Directly

Test if backend API works:

**Open in browser or use curl:**
```
http://localhost:5000/api/health
```

**Should return:**
```json
{"status":"OK","message":"Automobile SMS Backend is running"}
```

**Then test with authentication:**
1. Get your token from browser localStorage
2. Test endpoint:
```
GET http://localhost:5000/api/employees/dashboard-stats
Headers: Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 🎯 Step 7: Quick Diagnostic Checklist

Run through these:

- [ ] Backend server running? (Check terminal)
- [ ] MongoDB connected? (Check backend terminal for "MongoDB Connected")
- [ ] Seed script ran successfully? (All ✅ messages)
- [ ] Frontend `.env` has correct API URL?
- [ ] User logged in as `employee@test.com`?
- [ ] Browser console shows errors? (What are they?)
- [ ] Network tab shows API calls? (What status codes?)

---

## 📋 What to Share for Help

If still not working, share:

1. **Browser console errors** (copy/paste red messages)
2. **Network tab** - Status code of `/api/employees/dashboard-stats`
3. **Backend terminal** - Any error messages
4. **Did seed script complete?** (All ✅ messages?)

---

## 🚀 Quick Fix Try This First:

```bash
# 1. Stop both servers (Ctrl+C)

# 2. Reseed database
cd AutomobileSMS/backend
npm run seed

# 3. Start backend
npm run dev

# 4. In another terminal, start frontend
cd AutomobileSMS/frontend
npm run dev

# 5. Clear browser cache (use Incognito)
# 6. Login as employee@test.com
# 7. Check dashboard
```

---

**Most likely cause: Seed script didn't create data, or backend API routes aren't working. Check Step 5 first!** 🔍

