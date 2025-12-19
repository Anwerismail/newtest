# 🚂 Deploy Evolyte Backend to Railway

## The Best Free Option for Your Backend!

---

## ⚡ Why Railway is Perfect for Your Backend

- ✅ **Real servers** - No serverless limitations
- ✅ **No cold starts** - Always warm and responsive
- ✅ **Built-in databases** - MongoDB & Redis included FREE
- ✅ **Persistent connections** - Perfect for your MongoDB + Redis setup
- ✅ **WebSockets support** - If you need real-time later
- ✅ **$5 free credit/month** - Enough for small-medium traffic
- ✅ **Easy scaling** - Click to upgrade resources
- ✅ **GitHub auto-deploy** - Push to deploy automatically

---

## 📋 Prerequisites

1. ✅ Railway account (free) - [railway.app](https://railway.app)
2. ✅ Credit card (required but won't charge on free tier)
3. ✅ GitHub repository (optional but recommended)

---

## 🚀 Method 1: Deploy via Railway Dashboard (Easiest)

### Step 1: Create Railway Account (2 minutes)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended)
3. Verify email
4. Add credit card (required, but you get $5/month free)

### Step 2: Create New Project (1 minute)

1. Click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your repository
4. Click "Deploy Now"

**That's it! Railway is deploying!** 🎉

### Step 3: Add MongoDB (1 minute)

1. In your project, click "New"
2. Select "Database"
3. Choose "Add MongoDB"
4. Railway creates a free MongoDB instance
5. Connection string is auto-added as `MONGO_URL`

### Step 4: Add Redis (1 minute)

1. Click "New" again
2. Select "Database"
3. Choose "Add Redis"
4. Railway creates a free Redis instance
5. Connection string is auto-added as `REDIS_URL`

### Step 5: Configure Environment Variables (5 minutes)

1. Click on your service (backend)
2. Go to "Variables" tab
3. Add all required variables (see below)
4. Click "Deploy"

**Total time: ~10 minutes!** ⚡

---

## 🚀 Method 2: Deploy via Railway CLI (Fast)

### Step 1: Install Railway CLI

```bash
# Install globally
npm install -g @railway/cli

# Login to Railway
railway login
```

### Step 2: Initialize Project

```bash
cd Evolyte/backend

# Link to Railway
railway init

# Follow prompts:
# - Create new project
# - Name: evolyte-backend
```

### Step 3: Add Databases

```bash
# Add MongoDB
railway add --plugin mongodb

# Add Redis
railway add --plugin redis
```

### Step 4: Deploy!

```bash
railway up
```

**Done! Your API is live!** 🎊

---

## 🔑 Required Environment Variables

After deployment, add these in Railway dashboard:

### **Core Variables:**

```env
NODE_ENV=production
PORT=5000

# Railway provides these automatically:
# MONGO_URL (from MongoDB plugin)
# REDIS_URL (from Redis plugin)

# Use Railway's MongoDB URL
MONGODB_URI=${MONGO_URL}

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_also_32_chars_plus
JWT_REFRESH_EXPIRE=30d

# Email Service (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM_NAME=Evolyte
EMAIL_FROM_EMAIL=noreply@evolyte.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Vercel (for deployment feature)
VERCEL_API_TOKEN=your_vercel_token

# Netlify (optional)
NETLIFY_API_TOKEN=your_netlify_token

# Sentry (optional but recommended)
SENTRY_DSN=your_sentry_dsn

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
```

### **Railway Auto-Provides These:**
- ✅ `MONGO_URL` - MongoDB connection string
- ✅ `REDIS_URL` - Redis connection string
- ✅ `RAILWAY_ENVIRONMENT` - Current environment
- ✅ `RAILWAY_PUBLIC_DOMAIN` - Your app URL

### **Set API_URL After First Deploy:**

```env
# Get from Railway dashboard (looks like: https://evolyte-backend-production.up.railway.app)
API_URL=https://your-app.up.railway.app

# Your frontend URL
FRONTEND_URL=https://your-frontend.railway.app
```

---

## 🗄️ Database Setup (Automatic!)

Railway makes this super easy:

### **MongoDB:**
1. Click "New" → "Database" → "MongoDB"
2. **Done!** Railway creates and connects it
3. Use `${MONGO_URL}` in your `MONGODB_URI` variable

**No manual setup needed!** Railway handles:
- ✅ Database creation
- ✅ User credentials
- ✅ Network configuration
- ✅ Automatic backups

### **Redis:**
1. Click "New" → "Database" → "Redis"
2. **Done!** Railway creates and connects it
3. Railway sets `REDIS_URL` automatically

**Perfect for caching!** Your app will:
- ✅ Cache templates (90% faster)
- ✅ Store rate limit data
- ✅ Handle password reset tokens

---

## 🌱 Seed Database (First Time)

After first deployment:

### Option 1: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Run seed command
railway run npm run seed
```

### Option 2: Using Railway Shell

1. Go to Railway dashboard
2. Click your service
3. Click "Shell" tab
4. Run: `npm run seed`

### Option 3: Via API

```bash
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

---

## ✅ Verify Deployment

### 1. Check Deployment Status

In Railway dashboard:
- Go to your project
- Check "Deployments" tab
- Should show "Success" ✅

### 2. Test Health Endpoint

```bash
curl https://your-app.up.railway.app/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T...",
  "environment": "production"
}
```

### 3. Test API Documentation

Visit: `https://your-app.up.railway.app/api-docs`

**Should see Swagger UI!** 📚

### 4. Test Authentication

```bash
# Login with admin
curl -X POST https://your-app.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123"
  }'
```

**Should return JWT token!** ✅

---

## 🔄 Automatic Deployments

### Enable GitHub Auto-Deploy

Railway automatically deploys when you push to GitHub!

**Workflow:**
1. Make code changes
2. Commit: `git commit -m "Add feature"`
3. Push: `git push origin main`
4. Railway auto-deploys! 🎉

**Each deployment:**
- Runs in ~2 minutes
- Shows live logs
- Creates unique URL for each branch
- Auto-rolls back on failure

---

## 🌍 Custom Domain (Optional)

### Step 1: Add Domain in Railway

1. Go to your service → Settings
2. Click "Networking"
3. Click "Generate Domain" (free subdomain)
4. Or add custom domain (e.g., `api.evolyte.com`)

### Step 2: Configure DNS

For custom domain:
1. Add CNAME record in your DNS:
   - Name: `api`
   - Value: Your Railway domain
2. Wait 5-10 minutes for DNS propagation

### Step 3: Update Environment Variables

```env
API_URL=https://api.evolyte.com
```

Redeploy for changes to take effect.

---

## 📊 Monitoring

### Railway Dashboard

Monitor in real-time:
- **Deployments:** Status and logs
- **Metrics:** CPU, Memory, Network usage
- **Logs:** Live application logs
- **Database:** Connection stats

### View Logs

```bash
# Via CLI
railway logs

# Or in dashboard
# Service → Logs tab
```

### Metrics

Railway shows:
- CPU usage
- Memory usage
- Network traffic
- Request count
- Response times

**Set alerts** for high usage!

---

## 💰 Cost & Free Tier

### Free Tier ($5 credit/month):

**Includes:**
- 512MB RAM
- Shared CPU
- MongoDB database
- Redis database
- 100GB network egress
- Unlimited deployments

**Good for:**
- Development
- Small apps
- 1,000-10,000 requests/day
- ~5-10 concurrent users

### When You'll Need to Upgrade:

**Upgrade to $5/month when:**
- 10,000+ requests/day
- 50+ concurrent users
- Need more RAM (1GB+)
- Need dedicated CPU

**Pricing:**
- $5/month per service
- Pay as you go
- No hidden fees

---

## 🚨 Troubleshooting

### Issue: "Build Failed"

**Solution:**
```bash
# Check logs in Railway dashboard
# Usually missing environment variables

# Verify package.json has:
"scripts": {
  "start": "node src/app.js"
}
```

### Issue: "MongoDB Connection Failed"

**Solution:**
1. Ensure MongoDB plugin is added
2. Check `MONGODB_URI` uses `${MONGO_URL}`
3. Restart service

### Issue: "App Crashed"

**Solution:**
```bash
# Check logs
railway logs

# Common causes:
# - Missing environment variables
# - Port binding (use process.env.PORT)
# - MongoDB not connected
```

### Issue: "Out of Memory"

**Solution:**
```bash
# Upgrade to 1GB RAM
# In Railway dashboard: Settings → Resources
# Increase memory slider
```

---

## 🔧 Advanced Configuration

### Custom Build Command

Edit `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  }
}
```

### Health Checks

Railway automatically monitors `/health` endpoint.

**Your app already has this!** ✅

### Restart Policy

Already configured in `railway.json`:
- Restarts on failure
- Max 10 retries
- Exponential backoff

---

## 📈 Scaling Strategy

### Vertical Scaling (Increase Resources)

1. Go to Settings → Resources
2. Adjust:
   - Memory: 512MB → 1GB → 2GB
   - CPU: Shared → Dedicated

### Horizontal Scaling

Railway Pro plan ($20/month):
- Multiple replicas
- Load balancing
- Auto-scaling

**You won't need this initially!**

---

## 🎯 Best Practices

### 1. Environment Variables

✅ **DO:**
- Use Railway's variable references: `${MONGO_URL}`
- Set different values per environment
- Rotate secrets regularly

❌ **DON'T:**
- Hardcode secrets in code
- Commit `.env` to git
- Share production credentials

### 2. Database

✅ **DO:**
- Use Railway's built-in MongoDB
- Enable automatic backups (Pro plan)
- Monitor connection count

❌ **DON'T:**
- Use external MongoDB on free tier (latency)
- Store files in MongoDB (use Cloudinary)

### 3. Monitoring

✅ **DO:**
- Check logs regularly
- Set up Sentry for errors
- Monitor memory usage
- Use Railway metrics

❌ **DON'T:**
- Ignore deployment failures
- Skip error tracking
- Exceed free tier limits unintentionally

---

## 🔄 Migration from Vercel (If Needed)

Already deployed to Vercel? Easy migration:

### Step 1: Deploy to Railway
```bash
railway init
railway up
```

### Step 2: Copy Environment Variables
1. Export from Vercel
2. Import to Railway
3. Update `MONGODB_URI` to use Railway's MongoDB

### Step 3: Test
```bash
curl https://your-railway-app.up.railway.app/health
```

### Step 4: Update Frontend
Change API URL in frontend to Railway URL

### Step 5: Delete Vercel Deployment (Optional)
Keep Vercel as backup or delete to avoid confusion

---

## ✅ Post-Deployment Checklist

After deployment:

- [ ] Health endpoint works
- [ ] API docs accessible (`/api-docs`)
- [ ] Can register new user
- [ ] Can login and get JWT
- [ ] Password reset emails arrive
- [ ] File uploads work (Cloudinary)
- [ ] MongoDB connected (check logs)
- [ ] Redis connected (check logs)
- [ ] Sentry receiving errors
- [ ] Logs visible in dashboard
- [ ] Custom domain configured (if applicable)

---

## 🎉 Success!

Your Evolyte backend is now live on Railway! 🚂

**Your URLs:**
- API: `https://your-app.up.railway.app`
- Docs: `https://your-app.up.railway.app/api-docs`
- Health: `https://your-app.up.railway.app/health`

**Advantages over Vercel:**
- ✅ No cold starts (always fast!)
- ✅ Real persistent connections
- ✅ Free MongoDB & Redis included
- ✅ Better for your use case
- ✅ Easier database management

---

## 📞 Quick Commands

```bash
# Railway CLI
railway login              # Login
railway init               # Initialize project
railway up                 # Deploy
railway logs               # View logs
railway logs --follow      # Live logs
railway run npm run seed   # Run seed
railway link               # Link to existing project
railway open               # Open in browser
railway status             # Check status
```

---

## 📚 Resources

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
- **Your API Docs:** `/api-docs`
- **MongoDB Docs:** [mongodb.com/docs](https://www.mongodb.com/docs)

---

**Date:** 2025-12-19  
**Guide Version:** 1.0  
**Status:** Ready to Deploy! 🚂
