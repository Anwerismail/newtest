# 🚀 Deploy Evolyte Backend to Vercel

## Complete Step-by-Step Guide

---

## ⚡ Why Vercel?

- ✅ **Fast deployment** - Deploy in 2 minutes
- ✅ **Automatic HTTPS** - Free SSL certificates
- ✅ **Global CDN** - Fast worldwide
- ✅ **Easy scaling** - Automatic
- ✅ **Free tier** - Perfect for getting started
- ✅ **GitHub integration** - Auto-deploy on push

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ Vercel account (free) - [vercel.com](https://vercel.com)
2. ✅ MongoDB Atlas database (free) - [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. ✅ GitHub repository with your code
4. ✅ All required API keys (Cloudinary, email, etc.)

---

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Prepare Your Project

Your project is already configured! We've added:
- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Files to ignore
- ✅ Serverless-compatible setup

### Step 2: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### Step 3: Deploy from CLI

```bash
# Navigate to backend folder
cd Evolyte/backend

# Login to Vercel
vercel login

# Deploy
vercel
```

**Follow the prompts:**
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- What's your project's name? **evolyte-backend**
- In which directory is your code located? **./ (current)**

**That's it! Your backend is deploying! 🎉**

---

## 🌐 Deploy from Vercel Dashboard (Alternative)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Import"

### Step 3: Configure Project

Vercel will auto-detect Node.js. Just verify:

```
Framework Preset: Other
Build Command: (leave empty)
Output Directory: (leave empty)
Install Command: npm install
```

### Step 4: Add Environment Variables

Click "Environment Variables" and add all from `.env.example`:

**Required Variables:**

```env
NODE_ENV=production
PORT=5000
API_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app

# MongoDB
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_also_32_chars_plus
JWT_REFRESH_EXPIRE=30d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM_NAME=Evolyte
EMAIL_FROM_EMAIL=noreply@evolyte.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Vercel (for project deployments)
VERCEL_API_TOKEN=your_vercel_api_token

# Netlify (optional)
NETLIFY_API_TOKEN=your_netlify_token

# Redis (optional but recommended)
REDIS_URL=your_redis_url_from_upstash

# Sentry (optional)
SENTRY_DSN=your_sentry_dsn

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=false
```

### Step 5: Deploy!

Click **"Deploy"** and wait ~2 minutes. ☕

---

## 🗄️ Setup MongoDB Atlas

### Step 1: Create Cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free)
3. Create cluster (M0 Free tier)
4. Choose region (closest to your users)

### Step 2: Configure Security

1. **Database Access:**
   - Click "Database Access"
   - Add new user (username + password)
   - Give "Read and write to any database" role

2. **Network Access:**
   - Click "Network Access"
   - Add IP Address: **`0.0.0.0/0`** (allow from anywhere)
   - ⚠️ Required for Vercel serverless functions

### Step 3: Get Connection String

1. Click "Connect"
2. Choose "Connect your application"
3. Copy connection string
4. Replace `<password>` with your actual password
5. Replace `<dbname>` with `evolyte`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/evolyte?retryWrites=true&w=majority
```

### Step 4: Add to Vercel

In Vercel dashboard:
- Go to your project
- Settings → Environment Variables
- Add `MONGODB_URI` = `your_connection_string`

---

## 🔥 Setup Redis (Upstash - Recommended)

### Why Redis?

- ✅ Caching (90% faster responses)
- ✅ Password reset tokens
- ✅ Rate limiting data
- ✅ Session storage

### Step 1: Create Upstash Database

1. Go to [upstash.com](https://upstash.com)
2. Sign up (free)
3. Create Redis database
4. Choose region (same as Vercel deployment)

### Step 2: Get Redis URL

1. Click on your database
2. Copy "REST URL" or "Redis URL"
3. Should look like: `redis://default:xxxxx@xxxxx.upstash.io:6379`

### Step 3: Add to Vercel

```env
REDIS_URL=redis://default:xxxxx@xxxxx.upstash.io:6379
```

---

## 📧 Setup Email Service (Gmail)

### Step 1: Enable 2-Step Verification

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → Enable

### Step 2: Create App Password

1. Security → App passwords
2. Select app: "Mail"
3. Select device: "Other" (name it "Evolyte")
4. Click "Generate"
5. Copy the 16-character password

### Step 3: Add to Vercel

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM_NAME=Evolyte
EMAIL_FROM_EMAIL=noreply@evolyte.com
```

---

## 🖼️ Setup Cloudinary

### Step 1: Create Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up (free tier: 25GB)

### Step 2: Get Credentials

1. Dashboard → Copy:
   - Cloud Name
   - API Key
   - API Secret

### Step 3: Add to Vercel

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_secret_here
```

---

## 🔑 Setup Sentry (Error Tracking)

### Step 1: Create Sentry Project

1. Go to [sentry.io](https://sentry.io)
2. Sign up (free tier: 5,000 errors/month)
3. Create new project
4. Choose "Node.js"

### Step 2: Get DSN

1. Settings → Projects → Your Project
2. Client Keys (DSN)
3. Copy DSN

### Step 3: Add to Vercel

```env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

---

## 🌱 Seed Database (First Time Only)

After first deployment, seed your database:

### Option 1: Using Vercel CLI

```bash
vercel env pull .env.production
NODE_ENV=production npm run seed
```

### Option 2: Using MongoDB Compass

1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect with your MongoDB URI
3. Manually create admin user in `users` collection

### Option 3: Using API Endpoint

Create a temporary seed endpoint:

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

---

## ✅ Verify Deployment

### 1. Check Deployment Status

In Vercel dashboard:
- Go to your project
- Check "Deployments" tab
- Should show "Ready"

### 2. Test Health Endpoint

```bash
curl https://your-app.vercel.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T...",
  "environment": "production"
}
```

### 3. Test API Docs

Visit: `https://your-app.vercel.app/api-docs`

Should see Swagger UI! 📚

### 4. Test Login

```bash
curl -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123"
  }'
```

**Should return JWT token!** ✅

### 5. Check Logs

In Vercel dashboard:
- Go to your deployment
- Click "Logs"
- Should see requests and no errors

---

## 🔄 Automatic Deployments

### Enable Auto-Deploy from GitHub

Vercel automatically deploys when you push to GitHub!

**Workflow:**
1. Make code changes
2. Commit: `git commit -m "Add feature"`
3. Push: `git push origin main`
4. Vercel auto-deploys! 🎉

**Production URL:** `https://your-app.vercel.app`  
**Preview URLs:** Vercel creates preview for each push

---

## 🌍 Custom Domain (Optional)

### Step 1: Add Domain in Vercel

1. Go to project → Settings → Domains
2. Add your domain (e.g., `api.evolyte.com`)
3. Follow DNS configuration instructions

### Step 2: Update Environment Variables

```env
API_URL=https://api.evolyte.com
```

Redeploy for changes to take effect.

---

## 🚨 Troubleshooting

### Issue: "Module not found"

**Solution:**
```bash
# Clear Vercel cache
vercel --prod --force

# Or rebuild
vercel --prod
```

### Issue: "MongoDB connection failed"

**Solution:**
1. Check MongoDB Atlas IP whitelist (must include `0.0.0.0/0`)
2. Verify connection string has correct password
3. Check if database user has proper permissions

### Issue: "Environment variables not working"

**Solution:**
1. Redeploy after adding variables
2. Check variable names match exactly
3. No spaces in variable values

### Issue: "Function timeout"

**Solution:**
Increase timeout in `vercel.json`:
```json
{
  "functions": {
    "src/app.js": {
      "maxDuration": 30
    }
  }
}
```

### Issue: "Rate limit errors"

**Solution:**
Check Redis connection. If not using Redis, rate limiting falls back to memory (limited in serverless).

---

## 📊 Monitoring Your Deployment

### Vercel Dashboard

Monitor:
- **Deployments:** Success/failure status
- **Logs:** Real-time request logs
- **Analytics:** Request counts, response times
- **Errors:** Failed requests

### Sentry Dashboard

Monitor:
- **Errors:** Stack traces
- **Performance:** Slow endpoints
- **Users:** Affected users
- **Trends:** Error frequency

### MongoDB Atlas

Monitor:
- **Connection count**
- **Query performance**
- **Storage usage**
- **Cluster metrics**

---

## 💰 Costs

### Free Tier Limits

**Vercel:**
- 100GB bandwidth/month
- 100 hours serverless execution/month
- Unlimited projects
- **Cost: $0/month** ✅

**MongoDB Atlas:**
- 512MB storage
- Shared cluster
- **Cost: $0/month** ✅

**Upstash Redis:**
- 10,000 commands/day
- 256MB storage
- **Cost: $0/month** ✅

**Cloudinary:**
- 25GB storage
- 25GB bandwidth/month
- **Cost: $0/month** ✅

**Sentry:**
- 5,000 errors/month
- **Cost: $0/month** ✅

**Total Cost: $0/month for moderate usage!** 🎉

### When to Upgrade?

Upgrade when you exceed:
- 100+ API requests/second
- 1M+ requests/month
- 1GB+ MongoDB storage
- 5,000+ Sentry errors/month

---

## 🎯 Best Practices

### 1. Environment Variables

✅ **DO:**
- Store all secrets in Vercel env variables
- Use different values for production
- Rotate secrets every 90 days

❌ **DON'T:**
- Commit secrets to git
- Use development secrets in production
- Share API keys

### 2. Database

✅ **DO:**
- Enable MongoDB backups
- Monitor connection pool
- Use indexes for queries

❌ **DON'T:**
- Store large files in MongoDB (use Cloudinary)
- Use admin credentials for app
- Allow unlimited connections

### 3. Monitoring

✅ **DO:**
- Check Sentry daily
- Monitor response times
- Set up alerts for errors

❌ **DON'T:**
- Ignore warnings
- Leave errors unresolved
- Skip log reviews

---

## 🚀 Performance Tips

### 1. Enable Caching

Redis is already configured! Ensure `REDIS_URL` is set.

### 2. Optimize Queries

All queries are already optimized with indexes.

### 3. Use CDN

Cloudinary provides automatic CDN for images.

### 4. Monitor Performance

Check Sentry performance tab for slow endpoints.

---

## 📝 Post-Deployment Checklist

After deployment, verify:

- [ ] Health endpoint works (`/health`)
- [ ] API docs accessible (`/api-docs`)
- [ ] Can register new user
- [ ] Can login and get JWT token
- [ ] Password reset emails arrive
- [ ] File uploads work
- [ ] Sentry receiving errors
- [ ] Logs visible in Vercel
- [ ] MongoDB connected
- [ ] Redis connected (if configured)
- [ ] Rate limiting active
- [ ] Email notifications work

---

## 🎉 Success!

Your Evolyte backend is now live on Vercel! 🚀

**Your URLs:**
- API: `https://your-app.vercel.app`
- Docs: `https://your-app.vercel.app/api-docs`
- Health: `https://your-app.vercel.app/health`

**Next Steps:**
1. Test all endpoints
2. Build your frontend
3. Point frontend to your API
4. Launch! 🎊

---

## 📞 Need Help?

**Resources:**
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- MongoDB Docs: [mongodb.com/docs](https://www.mongodb.com/docs)
- Your backend docs: `/api-docs`

**Common Commands:**
```bash
vercel                  # Deploy
vercel --prod          # Deploy to production
vercel logs            # View logs
vercel env ls          # List env variables
vercel domains         # Manage domains
```

---

**Date:** 2025-12-19  
**Guide Version:** 1.0  
**Status:** Ready to Deploy! 🚀
