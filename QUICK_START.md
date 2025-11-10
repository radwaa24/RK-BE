# 🚀 Quick Start Guide

## Step 1: Setup Environment

1. **Create `.env` file** (copy from `env.example`):
   ```bash
   # Windows PowerShell
   Copy-Item env.example .env
   ```

2. **Edit `.env` file** with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string_here
   JWT_SECRET=your_secret_key_here
   ```

## Step 2: Install & Start

```bash
# Install dependencies
npm install

# Start server (development mode)
npm run dev
```

Server will run on: **http://localhost:5000**

## Step 3: Test the API

### Option A: Use Postman (Easiest)

1. **Download Postman:** https://www.postman.com/downloads/
2. **Import Collection:**
   - Open Postman
   - Click "Import" button
   - Select `RK_Ecommerce_API.postman_collection.json`
3. **Test Endpoints:**
   - Start with "Health Check"
   - Then "Register User" or "Login"
   - Token will be automatically saved!
   - Test other endpoints

### Option B: Use Test Script

```bash
# Make sure server is running first!
node test-api.js
```

### Option C: Use cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

## Step 4: Understanding the Flow

1. **Register/Login** → Get JWT token
2. **Use token** in `Authorization: Bearer TOKEN` header
3. **Call protected routes** with token
4. **Admin routes** require admin role

## 📚 Full Documentation

See **BACKEND_GUIDE.md** for complete documentation!

## 🎯 Common First Steps

1. ✅ Test health check: `GET /api/health`
2. ✅ Register a user: `POST /api/auth/register`
3. ✅ Login: `POST /api/auth/login`
4. ✅ Get your profile: `GET /api/auth/me` (with token)
5. ✅ Get products: `GET /api/products`
6. ✅ Get categories: `GET /api/categories`

## 🔑 Important Notes

- **Token expires in 7 days** (configurable in `.env`)
- **Protected routes** need `Authorization: Bearer TOKEN` header
- **Admin routes** need admin role (default role is 'user')
- **Base URL:** `http://localhost:5000/api`

## 🆘 Need Help?

1. Check server console for errors
2. Verify `.env` file exists and has correct values
3. Make sure MongoDB is connected
4. Check `BACKEND_GUIDE.md` for detailed explanations

---

**Happy Testing! 🎉**

