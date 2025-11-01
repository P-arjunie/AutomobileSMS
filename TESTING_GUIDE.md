# 🧪 Complete Testing Guide - Employee Time Logging System

This guide will help you test **every feature** of the Employee Time Logging & Work Management system.

## 📋 Prerequisites

1. ✅ Backend server running on port 5000
2. ✅ Frontend server running on port 5173
3. ✅ MongoDB running and connected
4. ✅ Test data seeded (see below)

---

## 🗄️ Step 1: Seed Test Data

First, populate the database with test data:

```bash
cd AutomobileSMS/backend
node scripts/seedTestData.js
```

This will create:
- ✅ Admin user (admin@test.com / password123)
- ✅ Employee user (employee@test.com / password123)
- ✅ Customer user (customer@test.com / password123)
- ✅ 4 Test appointments (assigned to employee)
- ✅ 7 Time logs (including 1 active timer)

---

## 🔐 Step 2: Login as Employee

1. Go to: http://localhost:5173/login
2. Login with:
   - **Email:** `employee@test.com`
   - **Password:** `password123`

---

## ✅ Step 3: Complete Feature Testing Checklist

### 🏠 **EMPLOYEE DASHBOARD** (`/employee/dashboard`)

#### Test 1: View Dashboard Stats
- [ ] **Total Hours Today** - Should show hours logged today
- [ ] **Active Projects** - Should show count of in-progress projects
- [ ] **Completed Projects** - Should show count of completed projects
- [ ] **Total Assigned Projects** - Should show total assigned projects

**Expected Result:** All stats cards display with numbers (not empty)

#### Test 2: Active Timer Alert
- [ ] Check if active timer alert appears at top of dashboard
- [ ] Verify it shows vehicle info and elapsed time
- [ ] Click "View Timer" link to navigate to time logging page

**Expected Result:** Blue alert box showing active timer details

#### Test 3: Filter Assigned Services
- [ ] **Filter by Status:**
  - Select "In Progress" - Should show only in-progress services
  - Select "Confirmed" - Should show only confirmed services
  - Select "Completed" - Should show only completed services
- [ ] **Filter by Date Range:**
  - Set date from and date to
  - Verify services are filtered correctly
- [ ] **Clear Filters:**
  - Click "Clear Filters" button
  - Verify all services are shown again

**Expected Result:** Services list updates based on filters

#### Test 4: Assigned Service Projects Table
- [ ] Verify table shows:
  - Vehicle information (year, make, model)
  - Service type
  - Customer name
  - Scheduled date
  - Status badge
  - Time logged (hours)
  - Active timer indicator (if applicable)
  - "Log Time" action link

**Expected Result:** Table displays all assigned services with correct information

#### Test 5: Navigation Links
- [ ] Click "Time Logging" link in header
- [ ] Click "My Work" link in header
- [ ] Verify navigation works correctly

**Expected Result:** Navigation to different pages works smoothly

---

### ⏱️ **TIME LOGGING INTERFACE** (`/employee/time-logging`)

#### Test 6: Active Timer Display
- [ ] Verify active timer is shown at top
- [ ] Check timer displays:
  - Vehicle and service info
  - Running time (updates every second)
  - Start time
  - "Stop Timer" button
- [ ] Watch timer count up in real-time

**Expected Result:** Timer displays and updates every second

#### Test 7: Start New Timer
- [ ] If no active timer, click "Start Timer" section
- [ ] Select a service project from dropdown
- [ ] Click "Start Timer" button
- [ ] Verify:
  - Timer starts immediately
  - Success toast notification appears
  - Timer shows in dashboard

**Expected Result:** New timer starts successfully

#### Test 8: Stop Timer
- [ ] With active timer running, click "Stop Timer"
- [ ] Verify:
  - Timer stops
  - Success toast notification
  - Timer removed from active state
  - Time log created in history

**Expected Result:** Timer stops and time log is saved

#### Test 9: Manual Time Entry
- [ ] Click "Manual Entry" button
- [ ] Fill in form:
  - Select service project
  - Enter start date/time
  - Enter end date/time
  - Add description (optional)
- [ ] Click "Save Time Log"
- [ ] Verify:
  - Success toast
  - Entry appears in history table

**Expected Result:** Manual time entry saved successfully

#### Test 10: Time Log History Table
- [ ] Verify table shows:
  - Date/time
  - Service project
  - Duration (hours/minutes)
  - Description
  - Status badge
- [ ] Check all columns are populated correctly

**Expected Result:** History table displays all time logs

#### Test 11: Filter Time Log History
- [ ] Set start date filter
- [ ] Set end date filter
- [ ] Verify table updates to show only logs in date range

**Expected Result:** Filtering works correctly

#### Test 12: Edit Time Log
- [ ] Click "Edit" button on any completed time log
- [ ] Modal opens with edit form
- [ ] Modify:
  - Start time
  - End time
  - Description
- [ ] Click "Save"
- [ ] Verify:
  - Success toast
  - Updated values in table

**Expected Result:** Time log edits successfully

#### Test 13: Delete Time Log
- [ ] Click "Delete" button on a time log
- [ ] Confirm deletion in popup
- [ ] Verify:
  - Success toast
  - Log removed from table

**Expected Result:** Time log deleted successfully

#### Test 14: Time Summary
- [ ] Check summary section shows:
  - Total Hours
  - Total Logs
  - Completed Logs
  - Average Hours/Day
- [ ] Test period buttons:
  - Click "Daily" - Shows today's summary
  - Click "Weekly" - Shows this week's summary
  - Click "Monthly" - Shows this month's summary

**Expected Result:** Summary updates based on selected period

#### Test 15: Prevent Multiple Active Timers
- [ ] Try to start a second timer while one is already running
- [ ] Verify error message appears
- [ ] Verify only one timer can be active at a time

**Expected Result:** System prevents multiple active timers

#### Test 16: Overlap Prevention
- [ ] Try to create manual time entry that overlaps with existing log
- [ ] Verify error message about overlap
- [ ] Create non-overlapping entry successfully

**Expected Result:** System prevents overlapping time logs

---

### 📅 **MY WORK PAGE** (`/employee/my-work`)

#### Test 17: Performance Metrics Cards
- [ ] Verify all 5 metric cards display:
  - Monthly Hours
  - Weekly Hours
  - Time Logs Count
  - Active Projects
  - Completed Projects
- [ ] Verify numbers are accurate

**Expected Result:** All metrics display correctly

#### Test 18: Calendar View
- [ ] Verify calendar grid displays current month
- [ ] Check services appear on correct dates
- [ ] Test navigation:
  - Click left arrow (previous month)
  - Click right arrow (next month)
- [ ] Verify services show on calendar:
  - Vehicle make displayed
  - Multiple services indicator (+X more)

**Expected Result:** Calendar displays services correctly

#### Test 19: Today's Tasks List
- [ ] Verify list shows tasks scheduled for today
- [ ] Check each task card displays:
  - Vehicle info
  - Service type
  - Customer name
  - Status badge
  - Scheduled time
  - Time logged
  - Active timer indicator (if applicable)

**Expected Result:** Today's tasks display correctly

#### Test 20: Completed Work History
- [ ] Verify table shows completed services (last 30 days)
- [ ] Check columns:
  - Vehicle
  - Service Type
  - Customer
  - Scheduled Date
  - Completed Date
  - Time Logged
- [ ] Verify data is accurate

**Expected Result:** Completed work history displays correctly

---

### 🔧 **BACKEND API TESTING**

#### Test 21: Time Logs API
Test all endpoints using Postman or curl:

**POST /api/time-logs** - Create time log
```bash
POST http://localhost:5000/api/time-logs
Headers: Authorization: Bearer <token>
Body: {
  "serviceProjectId": "<appointment_id>",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "description": "Test work"
}
```

**GET /api/time-logs** - Get time logs
```bash
GET http://localhost:5000/api/time-logs?startDate=2024-01-01&endDate=2024-01-31
Headers: Authorization: Bearer <token>
```

**PUT /api/time-logs/:id** - Update time log
```bash
PUT http://localhost:5000/api/time-logs/<time_log_id>
Headers: Authorization: Bearer <token>
Body: {
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T12:00:00Z",
  "description": "Updated description"
}
```

**DELETE /api/time-logs/:id** - Delete time log
```bash
DELETE http://localhost:5000/api/time-logs/<time_log_id>
Headers: Authorization: Bearer <token>
```

**POST /api/time-logs/start** - Start timer
```bash
POST http://localhost:5000/api/time-logs/start
Headers: Authorization: Bearer <token>
Body: {
  "serviceProjectId": "<appointment_id>",
  "description": "Starting work"
}
```

**POST /api/time-logs/stop** - Stop timer
```bash
POST http://localhost:5000/api/time-logs/stop
Headers: Authorization: Bearer <token>
```

**GET /api/time-logs/summary** - Get summary
```bash
GET http://localhost:5000/api/time-logs/summary?period=monthly
Headers: Authorization: Bearer <token>
```

#### Test 22: Employee Work API

**GET /api/employees/assigned-services** - Get assigned services
```bash
GET http://localhost:5000/api/employees/assigned-services?status=in-progress
Headers: Authorization: Bearer <token>
```

**GET /api/employees/dashboard-stats** - Get dashboard stats
```bash
GET http://localhost:5000/api/employees/dashboard-stats
Headers: Authorization: Bearer <token>
```

**PATCH /api/employees/assign/:serviceId** - Assign service (Admin only)
```bash
PATCH http://localhost:5000/api/employees/assign/<appointment_id>
Headers: Authorization: Bearer <admin_token>
Body: {
  "employeeId": "<employee_id>"
}
```

---

## 🐛 Troubleshooting

### Issue: Dashboard shows empty data
**Solution:**
1. Run seed script: `node backend/scripts/seedTestData.js`
2. Ensure employee is logged in
3. Check if appointments are assigned to employee

### Issue: Timer not starting
**Solution:**
1. Check browser console for errors
2. Verify service project is selected
3. Check if employee is assigned to the service
4. Verify no other active timer exists

### Issue: Time logs not saving
**Solution:**
1. Check backend server logs
2. Verify MongoDB connection
3. Check time validation (end time must be after start time)

### Issue: API returns 401 Unauthorized
**Solution:**
1. Logout and login again
2. Check if JWT token is valid
3. Verify user role is "employee" or "admin"

---

## ✅ Verification Checklist

After completing all tests, verify:

- [ ] ✅ All dashboard stats display correctly
- [ ] ✅ Active timer works and updates in real-time
- [ ] ✅ Can start/stop timer successfully
- [ ] ✅ Manual time entries save correctly
- [ ] ✅ Time log history displays all entries
- [ ] ✅ Can edit and delete time logs
- [ ] ✅ Calendar view shows scheduled services
- [ ] ✅ Today's tasks list is accurate
- [ ] ✅ Completed work history displays correctly
- [ ] ✅ Time summaries (daily/weekly/monthly) calculate correctly
- [ ] ✅ Filters work on all pages
- [ ] ✅ No overlapping time logs can be created
- [ ] ✅ Only one active timer allowed per employee
- [ ] ✅ All API endpoints respond correctly

---

## 🎉 Success Criteria

Your system is working correctly if:
1. ✅ Dashboard shows populated stats and assigned services
2. ✅ Timer starts/stops and updates in real-time
3. ✅ Time logs save, edit, and delete successfully
4. ✅ Calendar and tasks display correctly
5. ✅ All API endpoints return expected responses
6. ✅ No errors in browser console or backend logs

---

## 📞 Need Help?

If any test fails:
1. Check browser console (F12) for frontend errors
2. Check backend terminal for server errors
3. Verify MongoDB connection
4. Ensure test data is seeded correctly
5. Verify user is logged in with correct role

---

**Happy Testing! 🚀**

