# ⚡ Vercel Deployment - Quick Start

## Deploy in 10 Minutes! 🚀

---

## 🎯 Overview

This guide gets you deployed to Vercel in **10 minutes**. No previous Vercel experience needed!

---

## ✅ Pre-Flight Checklist

Before starting, have these ready:

- [ ] Vercel account (free) - [vercel.com](https://vercel.com)
- [ ] MongoDB Atlas (free) - [mongodb.com/atlas](https://mongodb.com/cloud/atlas)
- [ ] Gmail account for emails
- [ ] Cloudinary account (free) - [cloudinary.com](https://cloudinary.com)
- [ ] GitHub repository with your code

**Total setup time: ~10 minutes**

---

## 🚀 Method 1: Deploy via Vercel CLI (Recommended)

### Step 1: Install Vercel CLI (2 minutes)

```bash
# Install globally
npm install -g vercel

# Login to Vercel
vercel login
```

### Step 2: Deploy (1 minute)

```bash
# Navigate to backend folder
cd Evolyte/backend

# Deploy!
vercel
```

**Answer the prompts:**
- Setup and deploy? → **Yes**
- Which scope? → **Your account**
- Link to existing project? → **No**
- Project name? → **evolyte-backend**
- Directory? → **./  (current directory)**

**Done! Your API is deploying! 🎉**

You'll get a URL like: `https://evolyte-backend-xxxxx.vercel.app`

### Step 3: Configure Environment Variables (5 minutes)

```bash
# Add variables one by one
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add EMAIL_USER
# ... (continue for all required variables)

# Or use the dashboard (easier)
```

**OR use Vercel Dashboard:**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. Settings → Environment Variables
4. Copy from `.env.vercel.example`

### Step 4: Redeploy with Variables (1 minute)

```bash
vercel --prod
```

### Step 5: Test Your API (1 minute)

```bash
# Health check
curl https://your-project.vercel.app/health

# API docs
open https://your-project.vercel.app/api-docs
```

**Total time: ~10 minutes! ✅**

---

## 🌐 Method 2: Deploy via GitHub (Alternative)

### Step 1: Push to GitHub (2 minutes)

```bash
cd Evolyte/backend

git init
git add .
git commit -m "Ready for Vercel deployment"
git branch -M main
git remote add origin https://github.com/yourusername/evolyte-backend.git
git push -u origin main
```

### Step 2: Import to Vercel (3 minutes)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Import"
5. Click "Deploy"

### Step 3: Add Environment Variables (5 minutes)

1. Go to Settings → Environment Variables
2. Add all variables from `.env.vercel.example`
3. Click "Redeploy"

**Total time: ~10 minutes! ✅**

---

## 🔑 Essential Environment Variables

**Copy these to Vercel (required):**

```env
# Core
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string

# JWT (generate with: openssl rand -base64 32)
JWT_SECRET=your_32_char_secret
JWT_REFRESH_SECRET=another_32_char_secret

# Email (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Optional but recommended:**

```env
REDIS_URL=your_upstash_redis_url
SENTRY_DSN=your_sentry_dsn
```

---

## 🗄️ Quick MongoDB Setup (3 minutes)

### Option 1: Use Existing MongoDB

If you have MongoDB Atlas:
1. Get connection string
2. Add to Vercel: `MONGODB_URI`

### Option 2: Create New MongoDB (Free)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create account → Create cluster (M0 Free)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (all IPs)
5. Get connection string
6. Add to Vercel as `MONGODB_URI`

**Format:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/evolyte?retryWrites=true&w=majority
```

---

## 📧 Quick Email Setup (2 minutes)

### Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → Enable
3. Security → App passwords → Generate
4. Copy 16-character password
5. Add to Vercel:
   - `EMAIL_USER=your_email@gmail.com`
   - `EMAIL_PASSWORD=xxxx xxxx xxxx xxxx`

---

## 🖼️ Quick Cloudinary Setup (2 minutes)

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up (free)
3. Copy from dashboard:
   - Cloud Name
   - API Key
   - API Secret
4. Add to Vercel

---

## ✅ Post-Deployment Checklist

After deployment, verify:

```bash
# 1. Health check
curl https://your-app.vercel.app/health
# Should return: {"status":"ok"}

# 2. API docs
open https://your-app.vercel.app/api-docs
# Should show Swagger UI

# 3. Register test user
curl -X POST https://your-app.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "role": "CLIENT"
  }'
# Should return user + token

# 4. Login
curl -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
# Should return token
```

**If all 4 work → You're live! 🎉**

---

## 🌱 Seed Your Database

After first deployment:

```bash
# Install dependencies
npm install

# Pull production env
vercel env pull .env.production

# Run seed
NODE_ENV=production npm run seed
```

**Creates default admin:**
- Email: `admin@evolyte.com`
- Password: `Admin@123`

**⚠️ Change this password immediately!**

---

## 🚨 Troubleshooting

### Error: "Module not found"

```bash
# Clear cache and redeploy
vercel --prod --force
```

### Error: "MongoDB connection failed"

1. Check MongoDB IP whitelist includes `0.0.0.0/0`
2. Verify connection string password
3. Check if database user exists

### Error: "Environment variables not working"

1. Redeploy after adding variables
2. Check spelling (case-sensitive)
3. No spaces in values

### Error: "Function timeout"

Already configured to 30 seconds in `vercel.json`. If still timing out:

```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 60
    }
  }
}
```

---

## 📊 Monitor Your Deployment

### Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. View:
   - Deployments (success/failure)
   - Logs (real-time)
   - Analytics (requests)

### Check Logs

```bash
# Via CLI
vercel logs

# Or in dashboard
# Deployments → Click deployment → Logs
```

---

## 🔄 Update Your Deployment

### Automatic (GitHub)

Just push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push
```

Vercel auto-deploys! ✨

### Manual (CLI)

```bash
vercel --prod
```

---

## 🌍 Add Custom Domain (Optional)

### Step 1: Add Domain

1. Go to Settings → Domains
2. Add your domain (e.g., `api.yourdomain.com`)
3. Follow DNS instructions

### Step 2: Update Environment

```bash
vercel env add API_URL production
# Value: https://api.yourdomain.com
```

### Step 3: Redeploy

```bash
vercel --prod
```

---

## 💰 Cost

**Free tier includes:**
- ✅ 100GB bandwidth/month
- ✅ 100 hours serverless/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN

**Perfect for:**
- Development
- Small-medium traffic
- MVP launches
- Side projects

**Upgrade when:**
- 100+ API requests/second
- Custom team features needed
- Enterprise support required

---

## 🎯 Next Steps

After deployment:

1. ✅ **Test all endpoints** - Use `/api-docs`
2. ✅ **Secure admin account** - Change default password
3. ✅ **Monitor logs** - Check for errors
4. ✅ **Build frontend** - Point to your API URL
5. ✅ **Launch!** - You're production-ready! 🚀

---

## 📞 Quick Commands

```bash
# Deploy
vercel                    # Preview
vercel --prod            # Production

# Logs
vercel logs              # View logs
vercel logs --follow     # Live logs

# Environment
vercel env ls            # List variables
vercel env add NAME      # Add variable
vercel env rm NAME       # Remove variable

# Domains
vercel domains ls        # List domains
vercel domains add       # Add domain

# Info
vercel whoami            # Current user
vercel projects ls       # List projects
```

---

## ✅ Success Checklist

- [ ] Vercel CLI installed
- [ ] Project deployed
- [ ] Environment variables configured
- [ ] MongoDB connected
- [ ] Health endpoint works
- [ ] API docs accessible
- [ ] Can register user
- [ ] Can login
- [ ] Admin account created
- [ ] Logs visible
- [ ] No errors in dashboard

**All checked? You're live! 🎉**

---

## 🎉 Congratulations!

Your Evolyte backend is now:
- ✅ Live on Vercel
- ✅ Globally distributed
- ✅ Auto-scaling
- ✅ HTTPS enabled
- ✅ Monitored
- ✅ Production-ready

**API URL:** `https://your-project.vercel.app`  
**Docs:** `https://your-project.vercel.app/api-docs`

**Ready to build your frontend! 🚀**

---

Date: 2025-12-19  
Version: Quick Start v1.0
