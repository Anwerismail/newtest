# 🚂 Railway Quick Start - Deploy in 10 Minutes!

## The Fastest Way to Deploy Your Backend

---

## ⚡ Why This Guide?

Get your Evolyte backend live on Railway in **10 minutes flat**!

**What you get:**
- ✅ Real server (no serverless)
- ✅ Free MongoDB included
- ✅ Free Redis included
- ✅ No cold starts
- ✅ $5/month free credit

---

## 🚀 Deploy in 3 Steps

### **Step 1: Install Railway CLI** (1 minute)

```bash
npm install -g @railway/cli
```

### **Step 2: Login & Deploy** (2 minutes)

```bash
# Navigate to backend
cd Evolyte/backend

# Login to Railway
railway login

# Initialize project
railway init

# Deploy!
railway up
```

**Answer prompts:**
- Create new project? → **Yes**
- Project name? → **evolyte-backend**

**That's it! Deploying...** 🎉

### **Step 3: Add Databases** (2 minutes)

```bash
# Add MongoDB
railway add

# Select "PostgreSQL" then find MongoDB in list
# Or use dashboard (easier)
```

**In Railway Dashboard:**
1. Go to your project
2. Click "New" → "Database" → "Add MongoDB"
3. Click "New" → "Database" → "Add Redis"

**Done! Databases connected!** ✅

---

## 🔑 Step 4: Configure Environment (5 minutes)

### In Railway Dashboard:

1. Click your service (not databases)
2. Go to "Variables" tab
3. Add these essential variables:

```env
# Core (Railway auto-sets PORT)
NODE_ENV=production

# MongoDB (use Railway's provided variable)
MONGODB_URI=${MONGO_URL}

# JWT Secrets (generate new ones!)
JWT_SECRET=paste_32_char_secret_here
JWT_REFRESH_SECRET=paste_another_32_char_secret

# Email (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
```

4. Click "Deploy" to restart with new variables

---

## ✅ Step 5: Verify It Works! (2 minutes)

### Get Your URL

In Railway dashboard, you'll see your app URL:
```
https://evolyte-backend-production.up.railway.app
```

### Test Health Check

```bash
curl https://your-app.up.railway.app/health
```

**Should return:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T...",
  "environment": "production"
}
```

### Test API Docs

Visit in browser:
```
https://your-app.up.railway.app/api-docs
```

**Should see Swagger UI!** 📚

### Test Login

```bash
# First, seed the database (see below)
# Then test login:

curl -X POST https://your-app.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123"
  }'
```

**Should return JWT token!** 🎊

---

## 🌱 Seed Your Database

Run this ONCE after first deployment:

```bash
# Option 1: Railway CLI
railway run npm run seed

# Option 2: Railway Dashboard
# Go to your service → Shell tab → Run: npm run seed

# Option 3: Via API (register admin manually)
curl -X POST https://your-app.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "SUPER_ADMIN"
  }'
```

**Creates default admin:**
- Email: `admin@evolyte.com`
- Password: `Admin@123`

**⚠️ Change this password after first login!**

---

## 🔧 Quick Setup Services

### 1. Generate JWT Secrets (30 seconds)

```bash
# Generate two different 32+ character secrets
openssl rand -base64 32
openssl rand -base64 32
```

Copy and paste into Railway variables.

### 2. Setup Gmail (2 minutes)

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → 2-Step Verification → Enable
3. Security → App passwords → Generate
4. Copy 16-character password
5. Add to Railway:
   - `EMAIL_USER=your_email@gmail.com`
   - `EMAIL_PASSWORD=xxxx xxxx xxxx xxxx`

### 3. Setup Cloudinary (2 minutes)

1. Go to [cloudinary.com](https://cloudinary.com) → Sign up
2. Dashboard → Copy:
   - Cloud Name
   - API Key
   - API Secret
3. Add to Railway variables

**That's it! All services configured!** ✅

---

## 🎯 Complete Environment Variables Checklist

**Essential (Must have):**
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI=${MONGO_URL}`
- [ ] `JWT_SECRET`
- [ ] `JWT_REFRESH_SECRET`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASSWORD`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

**Recommended (Add later):**
- [ ] `REDIS_URL` (Railway auto-sets if Redis added)
- [ ] `SENTRY_DSN` (error tracking)
- [ ] `VERCEL_API_TOKEN` (for deployment feature)
- [ ] `NETLIFY_API_TOKEN` (for deployment feature)

**Auto-set by Railway:**
- ✅ `PORT` (Railway sets this automatically)
- ✅ `MONGO_URL` (from MongoDB plugin)
- ✅ `REDIS_URL` (from Redis plugin)

---

## 🔄 Auto-Deploy from GitHub

### Enable GitHub Integration:

1. In Railway project settings
2. Connect GitHub repository
3. Select branch (main)
4. **Done!** Now every push auto-deploys

**Workflow:**
```bash
git add .
git commit -m "Update feature"
git push
```

Railway automatically deploys! 🚀

---

## 📊 Monitor Your App

### View Logs (Real-time)

```bash
railway logs --follow
```

Or in dashboard: Service → Logs tab

### Check Metrics

Dashboard shows:
- CPU usage
- Memory usage
- Request count
- Database connections

### Set Up Alerts (Recommended)

1. Install Sentry (free):
   ```bash
   # Already configured in your app!
   # Just add SENTRY_DSN in Railway variables
   ```

2. Sign up at [sentry.io](https://sentry.io)
3. Get DSN → Add to Railway
4. Get error notifications!

---

## 💰 What Does It Cost?

### Free Tier ($5 credit/month):

**Your usage estimate:**
- Backend service: ~$3-4/month
- MongoDB: Included FREE
- Redis: Included FREE
- **Total: $0-1/month** (within free credit!)

### When you need to pay:

**Upgrade when you hit:**
- 10,000+ requests/day
- 100+ concurrent users
- Need more RAM
- **Cost: $5-10/month**

**Perfect for:**
- MVP
- Small-medium apps
- Development/staging

---

## 🚨 Common Issues & Fixes

### Issue: "Build Failed"

**Fix:**
```bash
# Check Railway logs
railway logs

# Usually missing package.json scripts:
"scripts": {
  "start": "node src/app.js"
}
```

### Issue: "Can't connect to MongoDB"

**Fix:**
1. Check MongoDB plugin is added
2. Verify `MONGODB_URI=${MONGO_URL}` in variables
3. Restart service

### Issue: "Port binding error"

**Fix:**
Already handled! Your app uses `process.env.PORT` which Railway sets automatically.

### Issue: "Out of memory"

**Fix:**
```bash
# Increase memory in Railway dashboard
# Settings → Resources → Memory: 1GB
```

---

## ✅ Success Checklist

After deployment:

- [ ] App is "Success" in Railway dashboard
- [ ] Health check returns OK
- [ ] API docs are accessible
- [ ] Can register new user
- [ ] Can login and get token
- [ ] MongoDB connected (check logs for "✅ MongoDB Connected")
- [ ] Redis connected (check logs for "✅ Redis connected")
- [ ] No errors in logs

**All checked? You're live!** 🎉

---

## 🎓 Next Steps

### 1. Secure Your App

```bash
# Change default admin password
curl -X PUT https://your-app.up.railway.app/api/v1/auth/password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Admin@123",
    "newPassword": "YourSecurePassword@2025"
  }'
```

### 2. Add Custom Domain (Optional)

1. Railway dashboard → Service → Settings → Networking
2. Add custom domain (e.g., `api.evolyte.com`)
3. Update DNS records
4. Done!

### 3. Setup Monitoring

1. Add Sentry DSN to Railway
2. Monitor errors at [sentry.io](https://sentry.io)
3. Set up alerts

### 4. Build Your Frontend!

Your backend is ready! Point your frontend to:
```
https://your-app.up.railway.app
```

---

## 📚 Useful Commands

```bash
# Railway CLI
railway login              # Login
railway init               # Initialize
railway up                 # Deploy
railway logs               # View logs
railway logs --follow      # Live logs
railway open               # Open in browser
railway status             # Check status
railway run npm run seed   # Seed database
railway env                # List variables
railway link               # Link existing project
```

---

## 🎉 You're Done!

**Congratulations!** Your backend is now:
- ✅ Live on Railway
- ✅ No cold starts
- ✅ Free MongoDB & Redis
- ✅ Auto-deploys from GitHub
- ✅ Ready for real users

**Your URLs:**
- API: `https://your-app.up.railway.app`
- Docs: `https://your-app.up.railway.app/api-docs`
- Health: `https://your-app.up.railway.app/health`

**Time taken: 10 minutes** ⚡

---

## 📞 Need Help?

- **Full Guide:** `RAILWAY_DEPLOYMENT.md` (detailed version)
- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
- **Your API Docs:** `/api-docs` (interactive!)

---

## 🚀 Ready to Build Frontend?

Your backend is production-ready! You can now:
1. Build your frontend
2. Point it to your Railway API
3. Launch your product!

**Backend URL for frontend:**
```javascript
const API_URL = 'https://your-app.up.railway.app';
```

---

**Happy Building! 🚂**

Date: 2025-12-19  
Status: Ready to Deploy!
