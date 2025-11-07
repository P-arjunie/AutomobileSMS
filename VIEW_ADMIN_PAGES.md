# How to View Admin Pages Without Login

Since the login functionality may not be fully set up yet, I've added a **Development Mode** that allows you to view all admin pages without authentication.

## 🚀 Quick Access

### Option 1: Development Mode (Recommended for Testing)

1. **Start your frontend server:**
   ```bash
   cd EAD/frontend
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:5173/dev
   ```

3. **You'll see a menu with links to all admin pages:**
   - Admin Dashboard
   - All Appointments
   - All Services
   - Reports

4. **Or access directly:**
   - Dashboard: `http://localhost:5173/dev/admin/dashboard`
   - Appointments: `http://localhost:5173/dev/admin/appointments`
   - Services: `http://localhost:5173/dev/admin/services`
   - Reports: `http://localhost:5173/dev/admin/reports`

### Option 2: Create Admin User and Login Properly

1. **Create an admin user:**
   ```bash
   cd EAD/backend
   node scripts/create-admin.js
   ```

2. **Start backend server:**
   ```bash
   cd EAD/backend
   npm run dev
   ```

3. **Start frontend server:**
   ```bash
   cd EAD/frontend
   npm run dev
   ```

4. **Login at:**
   ```
   http://localhost:5173/login
   ```
   - Email: `admin@admin.com`
   - Password: `admin123`

5. **Access admin pages at:**
   - Dashboard: `http://localhost:5173/admin/dashboard`
   - Appointments: `http://localhost:5173/admin/appointments`
   - Services: `http://localhost:5173/admin/services`
   - Reports: `http://localhost:5173/admin/reports`

## 📝 Important Notes

### Development Mode (`/dev` routes)
- ✅ **No authentication required** - pages load immediately
- ✅ **Perfect for viewing UI and layouts**
- ⚠️ **API calls will fail** if backend is not running
- ⚠️ **Mock data only** - won't show real data
- ⚠️ **REMOVE IN PRODUCTION** - These routes should be deleted before deploying

### Proper Login (`/admin` routes)
- ✅ **Full functionality** - all features work
- ✅ **Real data** - connects to actual database
- ✅ **Secure** - requires authentication
- ✅ **Production ready**

## 🎨 What You'll See

### Without Backend Running
- Pages will load and display
- UI components will render
- Charts will show but be empty
- You'll see error messages for API calls
- Buttons and navigation will work

### With Backend Running
- All data will load correctly
- Charts will populate with real data
- Filters and exports will work
- Full functionality enabled

## 🐛 Troubleshooting

**Pages not loading?**
- Make sure frontend server is running
- Check browser console for errors
- Verify the URL path includes `/dev/`

**API errors?**
- That's normal if backend isn't running
- Pages will still display but won't show data
- Start backend server to see real data

**Want to remove dev mode later?**
- Remove `/dev` routes from `App.jsx`
- Remove `DevModeBypass` component
- Remove dev mode checks from admin components

## ✅ Summary

**For quick viewing (no backend needed):**
```
http://localhost:5173/dev
```

**For full functionality (backend required):**
1. Create admin user
2. Start backend
3. Login at `/login`
4. Access `/admin/*` pages

