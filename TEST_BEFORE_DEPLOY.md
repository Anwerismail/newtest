# 🧪 Test Before Deploying to Vercel

## Quick local testing to ensure everything works

---

## ✅ Step 1: Install Dependencies (1 minute)

```bash
cd Evolyte/backend
npm install
```

**Expected:** No errors, all packages installed

---

## ✅ Step 2: Configure Environment (2 minutes)

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
# Minimum required for testing:
```

**Minimum .env for local testing:**
```env
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Use a test MongoDB (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/evolyte-test

# Generate test secrets
JWT_SECRET=test-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=test-refresh-secret-also-32-chars

# Optional for local testing (skip if not needed)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## ✅ Step 3: Run Tests (2 minutes)

```bash
npm test
```

**Expected output:**
```
 PASS  tests/unit/services/logger.service.test.js
 PASS  tests/unit/services/cache.service.test.js
 PASS  tests/unit/services/email.service.test.js
 PASS  tests/unit/middlewares/auth.middleware.test.js
 PASS  tests/unit/middlewares/rateLimit.middleware.test.js
 PASS  tests/integration/auth.test.js
 PASS  tests/integration/passwordReset.test.js

Test Suites: 7 passed, 7 total
Tests:       XX passed, XX total
```

**If tests fail:**
- Check if MongoDB is running
- Verify .env configuration
- See test logs for specific errors

---

## ✅ Step 4: Start Development Server (1 minute)

```bash
npm run dev
```

**Expected output:**
```
✅ Environment variables loaded successfully
✅ MongoDB Connected
✅ Redis connected and ready (or warning if not configured)
✅ Sentry initialized (or info if not configured)

╔═══════════════════════════════════════════╗
║                                           ║
║       🚀 EVOLYTE API STARTED             ║
║                                           ║
║  Environment: development                 ║
║  Port: 5000                               ║
║  URL: http://localhost:5000               ║
║                                           ║
╚═══════════════════════════════════════════╝
```

---

## ✅ Step 5: Test API Endpoints (3 minutes)

### 1. Health Check

```bash
curl http://localhost:5000/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T...",
  "environment": "development"
}
```

### 2. API Documentation

Open in browser:
```
http://localhost:5000/api-docs
```

**Expected:** Swagger UI with all endpoints documented

### 3. Register User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "role": "CLIENT"
  }'
```

**Expected:**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "user": { ... },
    "token": "eyJhbGc..."
  }
}
```

### 4. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

**Expected:**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": { ... },
    "token": "eyJhbGc..."
  }
}
```

### 5. Get Profile (Authenticated)

```bash
# Replace YOUR_TOKEN with the token from login
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

---

## ✅ Step 6: Test Rate Limiting (1 minute)

```bash
# Make multiple rapid requests (should get rate limited)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo " - Attempt $i"
done
```

**Expected:** After 5 attempts, should get:
```json
{
  "success": false,
  "message": "Trop de requêtes...",
  "retryAfter": 900
}
```

---

## ✅ Step 7: Run Seed Data (Optional)

```bash
npm run seed
```

**Expected:**
```
✅ Admin user created
Email: admin@evolyte.com
Password: Admin@123

✅ Manager created
✅ Worker created
✅ Client created
```

---

## 🎯 Pre-Deployment Checklist

Before deploying to Vercel:

- [ ] All tests pass (`npm test`)
- [ ] Server starts without errors (`npm run dev`)
- [ ] Health endpoint works
- [ ] API docs accessible
- [ ] Can register user
- [ ] Can login
- [ ] Can get profile with token
- [ ] Rate limiting works
- [ ] No console errors
- [ ] Database connection stable

**All checked? Ready to deploy! 🚀**

---

## 🚨 Common Issues

### Issue: MongoDB Connection Failed

**Solution:**
```bash
# If using local MongoDB
mongod

# If using MongoDB Atlas
# Check connection string in .env
# Verify IP whitelist includes your IP
```

### Issue: Tests Fail

**Solution:**
```bash
# Clear test database
# Restart with fresh .env
npm test
```

### Issue: Port Already in Use

**Solution:**
```bash
# Kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID [PID] /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9

# Or use different port
# Change PORT=5001 in .env
```

### Issue: Module Not Found

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Performance Check

Before deploying, verify:

### Response Times (Local)
- Health check: < 10ms ✅
- Register: < 200ms ✅
- Login: < 150ms ✅
- Get profile: < 100ms ✅

### Memory Usage
```bash
# Check Node.js memory
node --max-old-space-size=512 src/app.js
```

Should use < 200MB at idle

---

## ✅ Final Verification

Run this complete test script:

```bash
#!/bin/bash

echo "🧪 Running pre-deployment tests..."

# 1. Health check
echo "1. Testing health endpoint..."
curl -s http://localhost:5000/health | grep "ok" && echo "✅ Health check passed" || echo "❌ Health check failed"

# 2. API docs
echo "2. Testing API docs..."
curl -s http://localhost:5000/api-docs | grep "swagger" && echo "✅ API docs accessible" || echo "❌ API docs failed"

# 3. Register
echo "3. Testing registration..."
REGISTER=$(curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"pretest@example.com","password":"Test@123","firstName":"Pre","lastName":"Test","role":"CLIENT"}')
echo $REGISTER | grep "token" && echo "✅ Registration works" || echo "❌ Registration failed"

# 4. Login
echo "4. Testing login..."
LOGIN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pretest@example.com","password":"Test@123"}')
TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*' | grep -o '[^"]*$')
echo $TOKEN | grep "eyJ" && echo "✅ Login works" || echo "❌ Login failed"

# 5. Authenticated request
echo "5. Testing authenticated request..."
curl -s http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" | grep "success" && echo "✅ Auth works" || echo "❌ Auth failed"

echo ""
echo "🎉 Pre-deployment tests complete!"
echo "If all tests passed, you're ready to deploy!"
```

---

## 🚀 Ready to Deploy!

If everything works locally:

1. **Stop the dev server** (Ctrl+C)
2. **Follow:** `VERCEL_QUICK_START.md`
3. **Deploy:** `vercel`
4. **Configure:** Environment variables
5. **Test:** Production endpoints

---

## 📝 Notes

- Local testing uses development environment
- Production uses MongoDB Atlas, not local
- Some features require production services:
  - Email (needs Gmail app password)
  - File upload (needs Cloudinary)
  - Deployment (needs Vercel/Netlify tokens)
  - Caching (needs Redis/Upstash)

**These can be configured in production!**

---

**Ready to deploy? Follow VERCEL_QUICK_START.md next! 🚀**
