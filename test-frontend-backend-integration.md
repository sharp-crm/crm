# 🧪 Frontend-Backend Integration Test Guide

## ✅ **Current Status**
- **Backend**: Running on `localhost:3000` ✅
- **Frontend**: Running on `localhost:5173` ✅  
- **Database**: Docker DynamoDB working ✅
- **Authentication**: Working perfectly ✅

## 🔧 **Fixed Issues**
1. ✅ **Port Mismatches**: Updated all frontend API calls from `8080` to `3000`
2. ✅ **API Client Usage**: Replaced raw `axios` with authenticated `API` client
3. ✅ **Missing Username Field**: Added auto-generated username for user creation
4. ✅ **Error Handling**: Improved error message extraction

## 🎯 **How to Test the Full Integration**

### **1. Authentication Test**
- Go to `http://localhost:5173/login`
- Try logging in with:
  - **Email**: `shashanth@sharp.com` **Password**: `Sharp123` ✅
  - **Email**: `john@sharp.com` **Password**: `sharp123` ✅

### **2. User Management Test**
After logging in as an admin user:

#### **View All Users**
- Navigate to **Settings > All Users**
- Should display current users with roles and permissions

#### **Create New User**
- Click "Add New User"
- Fill in:
  - First Name: `Alice`
  - Last Name: `Johnson`  
  - Email: `alice@sharp.com`
  - Password: `Test123`
  - Role: `SALES_REP`
- Click "Create"
- Should show success and refresh the user list

#### **Edit User Profile**
- Go to **Settings > Personal**
- Update your name and phone number
- Click "Save Changes"
- Should show "Profile updated successfully"

### **3. CRUD Operations Test**

#### **Test User Routes**
```bash
# Get all users (Admin only)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/users

# Get users by domain  
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/users/tenant-users

# Create user (Admin only)
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users \
  -d '{"email":"test@sharp.com","password":"Test123","username":"Test User","firstName":"Test","lastName":"User"}'

# Update user
curl -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users/USER_ID \
  -d '{"firstName":"Updated","lastName":"Name"}'
```

### **4. Other Entity Tests**

#### **Contacts Management**
- Navigate to **Contacts**
- Try creating, viewing, editing contacts

#### **Leads Management**  
- Navigate to **Leads**
- Try creating, viewing, editing leads

#### **Deals Management**
- Navigate to **Deals**
- Try creating, viewing, editing deals

## 🐛 **Common Issues & Solutions**

### **Issue: "Access denied" errors**
- **Cause**: User doesn't have admin role
- **Solution**: Login with `john@sharp.com` or `shashanth@sharp.com` (both are ADMIN)

### **Issue: "Token not found" errors**
- **Cause**: Authentication token expired or not set
- **Solution**: Logout and login again

### **Issue: "Route not found" errors**
- **Cause**: Backend route doesn't exist
- **Solution**: Check backend `app.ts` for available routes

### **Issue: Database connection errors**
- **Cause**: Docker DynamoDB not running
- **Solution**: Restart Docker container
```bash
docker ps  # Check if container is running
docker restart confident_hopper  # Restart if needed
```

## 🚀 **Next Steps**

1. **Test all entity CRUD operations** (Contacts, Leads, Deals, Tasks)
2. **Test role-based permissions** (create SALES_REP user and test access)
3. **Test data persistence** (create data, refresh page, verify it's still there)
4. **Test error handling** (try invalid data, network errors)

## 📋 **Available Test Accounts**

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `john@sharp.com` | `sharp123` | ADMIN | Full system access |
| `shashanth@sharp.com` | `Sharp123` | ADMIN | Full system access |
| Any new user you create | As set | Role as set | Test different permissions |

## ✅ **Success Criteria**

Your frontend-backend integration is working if:
- ✅ Login works without errors
- ✅ User list loads and displays properly  
- ✅ New users can be created successfully
- ✅ Profile updates work
- ✅ Navigation between pages works
- ✅ Data persists after page refresh
- ✅ Error messages are clear and helpful

**Happy Testing! 🎉** 