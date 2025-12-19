# ⚡ Vercel Environment Variables Setup

## Quick Guide: Configure Your Deployed App

---

## 🎯 The Issue

Your app deployed successfully but shows:
```
Error: MONGODB_URI is not defined in .env file
```

**Why?** Environment variables need to be added in **Vercel Dashboard**, not in `.env` files.

---

## ✅ Solution: Add Environment Variables in Vercel

### **Step 1: Go to Vercel Dashboard**

1. Open: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project: **evolyte-backend**
3. Click **"Settings"** (top menu)
4. Click **"Environment Variables"** (left sidebar)

---

### **Step 2: Add Required Variables**

Click **"Add New"** and add these one by one:

#### **1. MongoDB (REQUIRED)**
```
Name: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/evolyte?retryWrites=true&w=majority
```
**Where to get:** [MongoDB Atlas Dashboard](https://cloud.mongodb.com)

#### **2. JWT Secrets (REQUIRED)**
```
Name: JWT_SECRET
Value: [Generate with: openssl rand -base64 32]

Name: JWT_REFRESH_SECRET
Value: [Generate another one with: openssl rand -base64 32]
```

#### **3. Email (REQUIRED for notifications)**
```
Name: EMAIL_HOST
Value: smtp.gmail.com

Name: EMAIL_PORT
Value: 587

Name: EMAIL_SECURE
Value: false

Name: EMAIL_USER
Value: your_email@gmail.com

Name: EMAIL_PASSWORD
Value: your_gmail_app_password

Name: EMAIL_FROM_NAME
Value: Evolyte

Name: EMAIL_FROM_EMAIL
Value: noreply@evolyte.com
```

#### **4. Cloudinary (REQUIRED for file uploads)**
```
Name: CLOUDINARY_CLOUD_NAME
Value: your_cloud_name

Name: CLOUDINARY_API_KEY
Value: your_api_key

Name: CLOUDINARY_API_SECRET
Value: your_api_secret
```

#### **5. Frontend URL**
```
Name: FRONTEND_URL
Value: https://your-frontend-url.vercel.app
(or http://localhost:3000 for local testing)
```

#### **6. API URL (Optional - set after first deploy)**
```
Name: API_URL
Value: https://your-backend-url.vercel.app
```

---

### **Step 3: Optional But Recommended**

#### **Redis (for caching - makes app 90% faster)**
```
Name: REDIS_URL
Value: redis://default:password@your-host.upstash.io:6379
```
**Setup guide:** `SETUP_UPSTASH_REDIS.md`

#### **Sentry (error tracking)**
```
Name: SENTRY_DSN
Value: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```
**Get from:** [sentry.io](https://sentry.io)

#### **Deployment APIs (for deployment feature)**
```
Name: VERCEL_API_TOKEN
Value: your_vercel_token

Name: NETLIFY_API_TOKEN
Value: your_netlify_token
```

---

### **Step 4: Choose Environment**

For each variable, select which environment(s):
- ✅ **Production** (check this)
- ✅ **Preview** (optional)
- ✅ **Development** (optional)

**Tip:** Check all three for consistency!

---

### **Step 5: Redeploy**

After adding all variables:

**Option A: Redeploy via Dashboard**
1. Go to **Deployments** tab
2. Click the **"..."** menu on latest deployment
3. Click **"Redeploy"**

**Option B: Redeploy via CLI**
```bash
vercel --prod
```

---

## 🎯 Quick Checklist

**Minimum Required (to make app work):**
- [ ] `MONGODB_URI`
- [ ] `JWT_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASSWORD`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `FRONTEND_URL`

**Recommended (for better performance):**
- [ ] `REDIS_URL` (90% faster responses!)
- [ ] `SENTRY_DSN` (error tracking)

---

## 📸 Visual Guide

### **What You'll See in Vercel Dashboard:**

```
Settings > Environment Variables
┌────────────────────────────────────────────┐
│  Add New Environment Variable              │
│                                            │
│  Name:  MONGODB_URI                        │
│  Value: mongodb+srv://...                  │
│                                            │
│  Apply to:                                 │
│  ☑ Production                              │
│  ☐ Preview                                 │
│  ☐ Development                             │
│                                            │
│  [Save]                                    │
└────────────────────────────────────────────┘
```

---

## 🚀 Generate JWT Secrets

**Windows (PowerShell):**
```powershell
# Generate JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Generate JWT_REFRESH_SECRET (run again for different value)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Mac/Linux:**
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
```

**Copy each output and paste into Vercel!**

---

## 🗄️ Get MongoDB URI

### **If you don't have MongoDB Atlas yet:**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free)
3. Create cluster (M0 Free tier)
4. Create database user (Database Access)
5. Whitelist IP: `0.0.0.0/0` (Network Access)
6. Get connection string (Connect → Connect your application)

**Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/evolyte?retryWrites=true&w=majority
```

Replace:
- `username` → your database username
- `password` → your database password
- `evolyte` → your database name

---

## 📧 Get Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → Enable
3. Security → App passwords → Generate
4. Select: Mail → Other (Evolyte)
5. Copy 16-character password
6. Add to Vercel as `EMAIL_PASSWORD`

---

## 🖼️ Get Cloudinary Credentials

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up (free - 25GB)
3. Dashboard shows:
   - Cloud Name
   - API Key
   - API Secret
4. Copy each to Vercel

---

## ✅ Verify It Works

After adding variables and redeploying:

### **1. Check Deployment Logs**

In Vercel Dashboard:
- Go to **Deployments**
- Click latest deployment
- Check **Build Logs** for errors

**Should see:**
```
✅ MongoDB Connected
✅ Redis connected (if configured)
Server started successfully
```

### **2. Test Health Endpoint**

```bash
curl https://your-app.vercel.app/health
```

**Should return:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T...",
  "environment": "production"
}
```

### **3. Test API Docs**

Visit: `https://your-app.vercel.app/api-docs`

**Should see Swagger UI!** 📚

### **4. Test Login**

After seeding database (see below), test:
```bash
curl -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123"
  }'
```

---

## 🌱 Seed Database

After environment variables are set:

### **Option 1: Via Vercel Dashboard (Easiest)**

Since Vercel is serverless, you need to use the API to create admin:

```bash
curl -X POST https://your-app.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "SUPER_ADMIN"
  }'
```

### **Option 2: Manually in MongoDB**

1. Go to MongoDB Atlas
2. Browse Collections → `users`
3. Insert Document (manually create admin user)

---

## 🚨 Common Issues

### Issue: "MONGODB_URI is not defined"

**Solution:** Make sure you:
1. Added `MONGODB_URI` in Vercel dashboard
2. Selected "Production" environment
3. Redeployed after adding variables

### Issue: "Invalid MongoDB connection string"

**Solution:** 
- Check password has no special characters issues
- Ensure format is correct: `mongodb+srv://...`
- Whitelist `0.0.0.0/0` in MongoDB Network Access

### Issue: "Email not sending"

**Solution:**
- Use Gmail app password (not regular password)
- Enable 2-Step Verification first
- Check `EMAIL_HOST` is `smtp.gmail.com`

### Issue: "Variables not applying"

**Solution:**
1. Clear Vercel cache
2. Redeploy with: `vercel --prod --force`

---

## 💡 Pro Tips

### **1. Use Different Values for Production**

Don't use the same JWT secrets or passwords as local development!

### **2. Store Secrets Safely**

Never commit `.env` files to git. They're in `.gitignore` already.

### **3. Test After Each Variable**

Add variables in groups, redeploy, test. Makes debugging easier.

### **4. Check Deployment Logs**

Always check logs after deployment to see if connections succeed.

---

## 📝 Environment Variables Template

Copy this for reference:

```env
# Core
NODE_ENV=production
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_32_char_secret
JWT_REFRESH_SECRET=your_32_char_refresh_secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM_NAME=Evolyte
EMAIL_FROM_EMAIL=noreply@evolyte.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# URLs
API_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app

# Optional
REDIS_URL=redis://default:password@host.upstash.io:6379
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VERCEL_API_TOKEN=your_token
NETLIFY_API_TOKEN=your_token

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=false
```

---

## ✅ Success Checklist

- [ ] Added all required environment variables in Vercel
- [ ] Selected "Production" for each variable
- [ ] Redeployed after adding variables
- [ ] Health endpoint returns "ok"
- [ ] Deployment logs show "MongoDB Connected"
- [ ] API docs are accessible
- [ ] Can register/login users

**All checked? You're live! 🎉**

---

**Date:** 2025-12-19  
**Status:** Environment Setup Complete  
**Time:** 10 minutes to configure
