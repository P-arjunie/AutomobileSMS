# 🔐 Which Account Shows Which Data?

## ❌ IMPORTANT: Each Account Only Sees Their Own Data!

The system filters all data based on the **logged-in user's ID**. Here's what each test account sees:

---

## 📊 Test Accounts & What They See

### 👨‍🔧 **employee@test.com** (USE THIS ONE!)
- ✅ **Password:** `password123`
- ✅ **Can access:** `/employee/dashboard`, `/employee/time-logging`, `/employee/my-work`
- ✅ **Sees:** 
  - 4 assigned service projects (Toyota, Honda, Ford, Nissan)
  - Time logs created by this employee
  - Active timer (if running)
  - All employee dashboard stats
- ✅ **This is the account with test data!**

### 👨‍💼 **admin@test.com**
- **Password:** `password123`
- **Can access:** Can see all data, but...
- ⚠️ **Issue:** The test appointments are assigned to `employee@test.com`, not admin
- ⚠️ **To see data:** Admin would need to query for employee's ID
- 💡 **Use admin to assign services to employees**

### 👤 **customer@test.com**
- **Password:** `password123`
- ❌ **Cannot access:** Employee dashboard (gets redirected)
- ✅ **Can see:** Only their own appointments (the 4 test appointments are theirs, but assigned to employee)
- ❌ **Won't see:** Employee features like time logging, dashboard stats

---

## 🎯 To See the Test Data, You MUST:

### ✅ Login as: **employee@test.com**

1. Go to: http://localhost:5173/login
2. Email: `employee@test.com`
3. Password: `password123`
4. You'll be redirected to: `/employee/dashboard`
5. **This is where the test data shows!**

---

## 🔍 Why Different Accounts Show Different Data?

The backend filters data by the logged-in user:

```javascript
// Backend code filters by logged-in user
const employeeId = req.user._id;  // Gets current logged-in user's ID
let query = { assignedEmployee: employeeId };  // Only finds their assignments
```

So:
- **employee@test.com** → Sees appointments assigned to employee@test.com ✅
- **admin@test.com** → Sees appointments assigned to admin@test.com (none) ❌
- **customer@test.com** → Can't access employee features ❌

---

## 🛠️ To Make Admin See Data:

If you want admin to see the test data, you would need to:

**Option 1: Assign appointments to admin**
```bash
# Use admin account to assign services to themselves
# Via API: PATCH /api/employees/assign/:serviceId
```

**Option 2: Modify seed script**
Edit `backend/scripts/seedTestData.js` and change:
```javascript
assignedEmployee: employee._id,  // Change this to admin._id
```

---

## ✅ Quick Summary:

| Account | Employee Dashboard | Time Logging | Test Data |
|---------|-------------------|--------------|-----------|
| **employee@test.com** | ✅ YES | ✅ YES | ✅ **YES - Has all test data** |
| admin@test.com | ✅ YES (access) | ✅ YES (access) | ❌ NO (not assigned to admin) |
| customer@test.com | ❌ NO (redirected) | ❌ NO | ❌ NO (customer role) |

---

## 🎯 **BOTTOM LINE:**

**To see the test data:**
- ✅ **MUST login as:** `employee@test.com` / `password123`
- ✅ **That's the account with all the test appointments and time logs**
- ✅ **Other accounts won't show the data because they're not assigned to it**

---

**So yes, you need to log in with `employee@test.com` to see the data! That's why the dashboard was empty - you might have been logged in with a different account.** 🎯

