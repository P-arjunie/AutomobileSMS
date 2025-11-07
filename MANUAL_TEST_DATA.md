# 📝 Manual Test Data Creation Guide

Since the seed script had connection issues, here's how to create test data manually:

## Option 1: Create via Frontend UI (Easiest)

### Step 1: Login as Customer
1. Logout from employee account
2. Login as: `customer@test.com` / `password123`
3. Or register a new customer account

### Step 2: Create Appointments
1. Go to dashboard
2. Create 2-3 service appointments
3. Logout

### Step 3: Login as Admin
1. Login as: `admin@test.com` / `password123`
2. Go to appointments list
3. Assign the appointments to `employee@test.com`
4. Logout

### Step 4: Login as Employee
1. Login as: `employee@test.com` / `password123`
2. Go to `/employee/dashboard`
3. You should now see the assigned services!

---

## Option 2: Fix MongoDB Connection for Seed Script

The seed script needs the MongoDB connection. Check:

### Check .env file exists:
```bash
cd AutomobileSMS/backend
# Check if .env file exists
```

### Create .env file if missing:
Create `AutomobileSMS/backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/automobile_sms
# OR if using MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/automobile_sms
JWT_SECRET=your-super-secret-jwt-key-change-this
FRONTEND_URL=http://localhost:5173
```

### Then run seed:
```bash
npm run seed
```

---

## Option 3: Create Data Directly in MongoDB

If you have MongoDB Compass or shell access:

1. Connect to your MongoDB database
2. Create a user with role "employee"
3. Create appointments with `assignedEmployee` field set to the employee's ID
4. Create some time logs

---

## Quick Test: Verify Connection Works

The fact that your backend server connected successfully means MongoDB IS working. The seed script issue might be:
- Missing .env file
- Different MongoDB URI format needed

**Try this:** Copy the MongoDB URI from your working backend server and use it in the seed script's environment.

---

**For now, use Option 1 (create via UI) - it's the fastest way to get test data!** ✅

