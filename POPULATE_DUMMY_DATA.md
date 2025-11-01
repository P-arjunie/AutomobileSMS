# How to Populate Database with Dummy Data

This guide will help you populate your database with realistic dummy data for testing the Admin Dashboard.

## 🚀 Quick Start

### Step 1: Make sure MongoDB is running

```bash
# Check if MongoDB is running (if using Docker)
docker ps | grep mongo

# Or start MongoDB locally if not using Docker
mongod
```

### Step 2: Run the seed script

```bash
cd EAD/backend
node scripts/seed-dummy-data.js
```

### Step 3: Wait for completion

The script will:
- ✅ Create 1 admin user
- ✅ Create 5 employees (different departments)
- ✅ Create 10 customers
- ✅ Create 50 appointments (with various statuses and dates)
- ✅ Create service logs for in-progress and completed appointments

## 📊 What Data Will Be Created

### Users
- **1 Admin**: `admin@admin.com` / `admin123`
- **5 Employees**: Various departments (mechanical, electrical, bodywork, painting, inspection)
- **10 Customers**: Random names and emails

### Appointments (50 total)
- Various statuses: pending, confirmed, in-progress, waiting-parts, completed, cancelled
- Different service types: oil-change, brake-service, tire-rotation, etc.
- Dates ranging from 6 months ago to 6 months in the future
- Some with assigned employees, some without
- Completed appointments have actual costs
- Mix of different priorities and vehicles

### Service Logs
- Created for in-progress and completed appointments
- Includes hours logged, labor costs, and parts
- Different work types and descriptions

## 🔐 Test Login Credentials

After running the script, you can login with:

**Admin:**
- Email: `admin@admin.com`
- Password: `admin123`

**Employee:**
- Email: `john.mechanic@example.com`
- Password: `password123`

**Customer:**
- Email: `alice.johnson@example.com`
- Password: `password123`

## 🎯 What You'll See in Admin Dashboard

After populating the data, the Admin Dashboard will show:
- **Total Appointments**: 50
- **Active Services**: Number of in-progress service logs
- **Completed Today**: Appointments completed today (if any)
- **Revenue**: Sum of actual costs from completed appointments
- **Charts**: 
  - Appointments over time (last 30 days)
  - Service types distribution
  - Status distribution

## 🔄 Re-seeding Data

If you want to refresh the data:

```bash
# The script automatically clears existing data before seeding
cd EAD/backend
node scripts/seed-dummy-data.js
```

**⚠️ Warning:** This will delete all existing users, appointments, and service logs!

## 🛠️ Troubleshooting

### Error: "Cannot connect to MongoDB"
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `.env` file
- Default: `mongodb://localhost:27017/automobile_sms`

### Error: "Model validation failed"
- Make sure all required fields are present
- Check MongoDB connection

### No data showing in dashboard?
- Wait a few seconds for the script to complete
- Check browser console for API errors
- Make sure backend server is running
- Verify data in MongoDB: `db.appointments.countDocuments()`

## 📝 Customizing Data

To customize the amount of data, edit `scripts/seed-dummy-data.js`:

```javascript
// Change number of appointments
for (let i = 0; i < 50; i++) {  // Change 50 to your desired number
```

## ✅ Verification

After seeding, verify data in MongoDB:

```javascript
// In MongoDB shell or Compass
use automobile_sms

db.users.countDocuments({ role: 'admin' })      // Should be 1
db.users.countDocuments({ role: 'employee' })  // Should be 5
db.users.countDocuments({ role: 'customer' })  // Should be 10
db.appointments.countDocuments()                // Should be 50
db.servicelogs.countDocuments()                 // Should be ~30-40
```

## 🎉 Next Steps

1. **Start your backend:**
   ```bash
   cd EAD/backend
   npm run dev
   ```

2. **Start your frontend:**
   ```bash
   cd EAD/frontend
   npm run dev
   ```

3. **Login and explore:**
   - Go to `http://localhost:5173/login`
   - Login as admin: `admin@admin.com` / `admin123`
   - Explore the dashboard with real data!

