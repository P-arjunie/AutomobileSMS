# 🚀 Quick Start - Testing the Employee Time Logging System

## Step 1: Seed Test Data (IMPORTANT!)

This will populate your database with test users and appointments so you can test all features.

```bash
cd AutomobileSMS/backend
npm run seed
```

**Expected Output:**
```
✅ Connected to MongoDB
✅ Created Admin user (or already exists)
✅ Created Employee user (or already exists)
✅ Created Customer user (or already exists)
✅ Created 4 Appointments
✅ Created 7 Time Logs
✅ Created 1 Active Timer
```

## Step 2: Login as Employee

1. Open browser: http://localhost:5173/login
2. Login credentials:
   - **Email:** `employee@test.com`
   - **Password:** `password123`

## Step 3: Access Employee Dashboard

After login, go to:
- **URL:** http://localhost:5173/employee/dashboard

**You should now see:**
- ✅ Stats cards with numbers (not empty!)
- ✅ Active timer alert (if timer is running)
- ✅ Table with 4 assigned service projects
- ✅ Filter options working

## Step 4: Test Time Logging

1. Click **"Time Logging"** link or go to:
   - http://localhost:5173/employee/time-logging

2. **You should see:**
   - ✅ Active timer displaying (counts up)
   - ✅ Time log history table with entries
   - ✅ Summary section with hours

3. **Try these actions:**
   - ✅ Stop the active timer
   - ✅ Start a new timer for different service
   - ✅ Create manual time entry
   - ✅ Edit a time log
   - ✅ Delete a time log

## Step 5: Test My Work Page

1. Click **"My Work"** link or go to:
   - http://localhost:5173/employee/my-work

2. **You should see:**
   - ✅ Performance metrics (5 cards)
   - ✅ Calendar view with services
   - ✅ Today's tasks list
   - ✅ Completed work history

## ✅ Verification Checklist

After seeding data and logging in, verify these work:

- [ ] Dashboard shows stats (not 0 or empty)
- [ ] Assigned services table has 4 entries
- [ ] Active timer is visible and counting
- [ ] Can start/stop timer
- [ ] Can create manual time entries
- [ ] Time log history shows entries
- [ ] Can edit/delete time logs
- [ ] Calendar shows scheduled services
- [ ] Today's tasks displays correctly
- [ ] Summary shows hours calculated

---

## 🔧 If Dashboard is Still Empty

**Check these:**

1. **Did you run the seed script?**
   ```bash
   cd backend
   npm run seed
   ```

2. **Are you logged in as the correct user?**
   - Must be: `employee@test.com`
   - Not: `customer@test.com` (customers don't see employee dashboard)

3. **Check browser console (F12):**
   - Look for API errors
   - Verify requests to `/api/employees/dashboard-stats` are successful

4. **Check backend terminal:**
   - Look for errors
   - Verify MongoDB connection

5. **Verify in MongoDB:**
   ```javascript
   // In MongoDB shell or MongoDB Compass
   use automobile_sms
   db.appointments.find({ assignedEmployee: { $exists: true } })
   db.timelogs.find()
   ```

---

## 📊 Test Accounts Created by Seed Script

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@test.com | password123 | Can assign services, view all data |
| Employee | employee@test.com | password123 | **Use this to test employee features** |
| Customer | customer@test.com | password123 | Creates appointments |

---

## 🎯 Quick Test Flow

1. **Seed data:** `npm run seed` (in backend folder)
2. **Login:** employee@test.com / password123
3. **Go to:** /employee/dashboard
4. **Verify:** Stats and services appear
5. **Test timer:** Start/Stop in Time Logging page
6. **Test manual entry:** Create time log manually
7. **Test calendar:** View My Work page
8. **Test filters:** Try date and status filters

---

## 💡 Pro Tips

- **Clear data and reseed:** Just run `npm run seed` again (it won't duplicate users)
- **Multiple employees:** Modify seed script to create more employees
- **More test data:** Edit `seedTestData.js` to add more appointments
- **API testing:** Use Postman to test endpoints directly (see TESTING_GUIDE.md)

---

**That's it! You should now have a fully populated dashboard with test data! 🎉**

