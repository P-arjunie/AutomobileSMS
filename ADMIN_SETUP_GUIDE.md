# Admin Dashboard & Reporting - Setup Guide

## ✅ What Has Been Implemented

All Admin Dashboard & Reporting features have been successfully implemented:

### Backend
- ✅ Admin routes mounted at `/api/admin`
- ✅ Reports routes mounted at `/api/reports`
- ✅ Dashboard statistics endpoint
- ✅ All appointments management endpoint
- ✅ All services overview endpoint
- ✅ Employee performance endpoint
- ✅ Customer list endpoint
- ✅ Report generation and export functionality

### Frontend
- ✅ Admin Dashboard with metrics and charts
- ✅ All Appointments Management page
- ✅ All Services Overview page
- ✅ Reports Page with report generation
- ✅ Route protection for admin-only access

## 🚀 Next Steps

### Step 1: Start the Backend Server

```bash
cd EAD/backend
npm install  # If not already done
npm run dev  # or npm start
```

Make sure MongoDB is running on your system.

### Step 2: Start the Frontend Server

```bash
cd EAD/frontend
npm install  # If not already done
npm run dev
```

### Step 3: Create an Admin User

You have **3 options** to create an admin user:

#### Option A: Using the Script (Recommended)
```bash
cd EAD/backend
node scripts/create-admin.js
```

This will create:
- Email: `admin@admin.com`
- Password: `admin123`
- ⚠️ **Change this password after first login!**

#### Option B: Using the API (Postman/cURL)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@admin.com",
    "password": "admin123",
    "phone": "+1234567890",
    "role": "admin",
    "employeeId": "ADMIN001",
    "department": "management"
  }'
```

#### Option C: Using MongoDB Directly
Connect to MongoDB and insert:
```javascript
use automobile_sms
db.users.insertOne({
  firstName: "Admin",
  lastName: "User",
  email: "admin@admin.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYhZiFJN5.2", // admin123
  phone: "+1234567890",
  role: "admin",
  employeeId: "ADMIN001",
  department: "management",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Step 4: Login as Admin

1. Open your browser to `http://localhost:5173` (or your frontend URL)
2. Login with:
   - Email: `admin@admin.com`
   - Password: `admin123`
3. You will be automatically redirected to `/admin/dashboard`

### Step 5: Explore the Features

#### Admin Dashboard (`/admin/dashboard`)
- View real-time statistics
- See charts for appointments over time
- Service types distribution
- Status distribution
- Quick links to all management sections

#### All Appointments (`/admin/appointments`)
- View all appointments across all customers
- Advanced filters: date range, status, customer, employee, service type
- Search by customer name or vehicle
- Export to CSV

#### All Services (`/admin/services`)
- List all service projects
- Status overview with charts
- Employee workload distribution
- Service completion metrics
- Filters and pagination

#### Reports (`/admin/reports`)
- Generate custom reports:
  - Service Completion Reports
  - Employee Productivity Reports
  - Customer Service History Reports
  - Revenue Reports
  - Appointments Reports
- Select date ranges
- Export to CSV or JSON
- Save reports for later

## 🔍 Testing Checklist

- [ ] Login as admin successfully
- [ ] Access admin dashboard and see statistics
- [ ] Navigate to All Appointments page
- [ ] Apply filters on appointments
- [ ] Export appointments to CSV
- [ ] Navigate to All Services page
- [ ] View employee workload charts
- [ ] Navigate to Reports page
- [ ] Generate a service completion report
- [ ] Export a report to CSV
- [ ] Save a report and retrieve it later

## 🐛 Troubleshooting

### Issue: Can't login as admin
**Solution**: Make sure the admin user was created successfully. Check MongoDB for the user document.

### Issue: "Access denied" when accessing admin routes
**Solution**: Ensure you're logged in with an admin role. Check the JWT token includes `role: "admin"`.

### Issue: Charts not displaying
**Solution**: Make sure `recharts` is installed in frontend: `cd frontend && npm install recharts`

### Issue: Export not working
**Solution**: Check browser console for errors. Ensure backend is running and API endpoint is accessible.

### Issue: No data in dashboard
**Solution**: Make sure you have:
- At least one appointment in the database
- At least one service log
- Some completed appointments for revenue stats

## 📝 Important Notes

1. **Security**: Change the default admin password immediately after first login
2. **Data**: The dashboard shows real-time data. If there's no data, the charts will be empty
3. **Export**: CSV exports are generated on-the-fly. For large datasets, it may take a moment
4. **Reports**: Saved reports are stored in the database and linked to the admin user who created them

## 🎉 You're All Set!

The Admin Dashboard & Reporting system is fully functional. Start exploring the features and customize as needed!

