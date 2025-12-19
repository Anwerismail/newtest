# 🚀 Production Deployment Guide

## Complete guide for deploying Evolyte Backend to production

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Redis configured (optional but recommended)
- [ ] Email service configured
- [ ] Storage service (Cloudinary) configured
- [ ] Deployment service (Vercel/Netlify) configured
- [ ] Sentry configured for error tracking
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Backup strategy in place

---

## 🏗️ Deployment Options

### Option 1: Railway (Recommended for Node.js)
### Option 2: Render
### Option 3: Heroku
### Option 4: AWS (Advanced)
### Option 5: VPS (DigitalOcean/Linode)

---

## 🚂 Option 1: Deploy to Railway

Railway is perfect for Node.js apps with MongoDB and Redis.

### Step 1: Prepare Your App

1. Ensure `package.json` has correct start script:
```json
{
  "scripts": {
    "start": "node src/app.js"
  }
}
```

2. Create `.railwayignore`:
```
node_modules/
.env
.git/
tests/
coverage/
*.log
```

### Step 2: Setup Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository
5. Railway will auto-detect Node.js

### Step 3: Add MongoDB

1. In Railway project, click "New"
2. Select "Database" → "MongoDB"
3. Copy the connection string
4. Add to environment variables as `MONGODB_URI`

### Step 4: Add Redis (Optional)

1. Click "New" → "Database" → "Redis"
2. Copy the connection string
3. Add to environment variables as `REDIS_URL`

### Step 5: Configure Environment Variables

In Railway settings, add all variables from `.env.example`:

```env
# Core
NODE_ENV=production
PORT=5000
API_URL=https://your-app.railway.app
FRONTEND_URL=https://your-frontend.com

# Database (Auto-filled by Railway)
MONGODB_URI=${{MongoDB.MONGO_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# JWT
JWT_SECRET=your_strong_secret_here_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
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

# Vercel
VERCEL_API_TOKEN=your_vercel_token

# Netlify
NETLIFY_API_TOKEN=your_netlify_token

# Sentry
SENTRY_DSN=your_sentry_dsn

# Logging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
```

### Step 6: Deploy

Railway will automatically deploy on every push to main branch.

### Step 7: Run Database Seeds (First Time)

1. Open Railway console/terminal
2. Run: `npm run seed`

---

## 🎨 Option 2: Deploy to Render

### Step 1: Create Web Service

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub repository

### Step 2: Configure Service

```yaml
Name: evolyte-backend
Region: Frankfurt (EU) or Oregon (US)
Branch: main
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### Step 3: Add Environment Variables

Same as Railway (see above)

### Step 4: Create MongoDB

1. Go to MongoDB Atlas (free tier)
2. Create cluster
3. Get connection string
4. Add to Render environment variables

### Step 5: Add Redis

1. In Render, create Redis instance
2. Copy connection string
3. Add to environment variables

---

## 🐳 Option 3: Docker Deployment

### Step 1: Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start app
CMD ["npm", "start"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/evolyte
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  mongo_data:
```

### Step 3: Deploy

```bash
docker-compose up -d
```

---

## 🔒 Security Hardening

### 1. Environment Variables

**CRITICAL:** Never commit these to git:
- JWT secrets
- Database credentials
- API keys
- Email passwords

### 2. Rate Limiting

Already configured! But verify limits are appropriate for production:

```javascript
// In src/config/env.js
RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: {
        SUPER_ADMIN: 1000,
        ADMIN: 500,
        PROJECT_MANAGER: 300,
        WORKER: 200,
        CLIENT: 100
    }
}
```

### 3. CORS Configuration

Update CORS to allow only your frontend:

```javascript
// In src/app.js
app.use(cors({
    origin: process.env.FRONTEND_URL, // Your actual frontend URL
    credentials: true
}));
```

### 4. HTTPS Only

Ensure your deployment platform uses HTTPS (all recommended platforms do by default).

### 5. Database Security

- Enable MongoDB authentication
- Use connection string with credentials
- Whitelist IP addresses in MongoDB Atlas
- Enable MongoDB encryption at rest

### 6. Secrets Rotation

Rotate these every 90 days:
- JWT secrets
- API keys
- Database passwords

---

## 📊 Monitoring Setup

### 1. Sentry Error Tracking

1. Create account at [sentry.io](https://sentry.io)
2. Create new project (Node.js)
3. Copy DSN
4. Add to environment variables:
```env
SENTRY_DSN=https://...@sentry.io/...
```

### 2. Performance Monitoring

Sentry automatically tracks:
- API response times
- Database query performance
- Error rates
- User impact

### 3. Logging

Logs are automatically saved to `logs/` directory in production:
- `all.log` - All logs
- `error.log` - Errors only
- `exceptions.log` - Unhandled exceptions

**Access logs:**
```bash
# Railway/Render
railway logs
render logs

# Docker
docker-compose logs -f app
```

### 4. Health Checks

Monitor these endpoints:
- `GET /health` - Basic health check
- `GET /api/v1` - API status

Set up monitoring with:
- UptimeRobot (free)
- Better Uptime
- Pingdom

---

## 🗄️ Database Management

### Initial Setup

1. **Run Seeds** (first deployment only):
```bash
npm run seed
npm run seed:templates
```

This creates:
- Default admin account
- Sample templates

### Backups

**MongoDB Atlas (Recommended):**
- Automatic backups enabled by default
- Point-in-time recovery
- Download backups anytime

**Manual Backup:**
```bash
mongodump --uri="your_mongodb_uri" --out=./backup
```

**Restore:**
```bash
mongorestore --uri="your_mongodb_uri" ./backup
```

### Migrations

For schema changes:
1. Test in development
2. Backup production database
3. Run migration script
4. Verify data integrity

---

## 🚀 Performance Optimization

### 1. Enable Caching

Ensure Redis is configured:
```env
REDIS_URL=redis://...
```

### 2. Database Indexing

All important indexes are already created in models. Verify they exist:
```javascript
// MongoDB shell
db.users.getIndexes()
db.projects.getIndexes()
db.tickets.getIndexes()
db.templates.getIndexes()
```

### 3. CDN for Assets

Cloudinary automatically provides CDN for uploaded files.

### 4. Compression

Already enabled with helmet and express defaults.

### 5. Connection Pooling

MongoDB driver automatically manages connection pooling.

---

## 📈 Scaling Strategy

### Horizontal Scaling

**Railway/Render:**
- Increase replicas in dashboard
- Load balancer automatic

**Docker:**
```yaml
deploy:
  replicas: 3
```

### Vertical Scaling

Increase resources:
- RAM: 512MB → 1GB → 2GB
- CPU: 0.5 → 1 → 2 cores

### Database Scaling

**MongoDB Atlas:**
- M0 (Free) → M2 → M5 → M10+
- Enable sharding for 1M+ users

**Redis:**
- Upstash free → Pro
- Enable cluster mode

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 🐛 Troubleshooting

### App Won't Start

1. Check logs: `railway logs` or `render logs`
2. Verify environment variables
3. Check MongoDB connection
4. Verify Node.js version (20+)

### Database Connection Errors

1. Verify MONGODB_URI
2. Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for cloud platforms)
3. Verify database user credentials

### High Response Times

1. Check Redis connection (caching may be off)
2. Review database indexes
3. Check Sentry performance tab
4. Scale up resources

### Error: Module not found

1. Run `npm install` in deployment platform
2. Verify `package.json` is committed
3. Check build logs

---

## ✅ Post-Deployment Verification

### 1. API Endpoints

Test all critical endpoints:

```bash
# Health check
curl https://your-api.railway.app/health

# API info
curl https://your-api.railway.app/api/v1

# Login (should work)
curl -X POST https://your-api.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@evolyte.com","password":"Admin@123"}'
```

### 2. Database Connection

Login as admin and verify data loads.

### 3. Email Service

Test password reset to verify email works.

### 4. File Upload

Upload a test image to verify Cloudinary works.

### 5. Deployment

Deploy a test project to verify Vercel/Netlify integration.

### 6. Monitoring

1. Check Sentry dashboard for errors
2. Verify logs are being written
3. Set up uptime monitoring

---

## 📞 Support & Resources

### Documentation
- API Docs: `https://your-api.railway.app/api-docs`
- Main README: `README.md`
- Phase Summaries: `PHASE_1_SUMMARY.md`, `PHASE_2_SUMMARY.md`

### Monitoring
- Sentry: [sentry.io](https://sentry.io)
- Railway: [railway.app](https://railway.app)
- MongoDB Atlas: [cloud.mongodb.com](https://cloud.mongodb.com)

### Need Help?
- Check logs first
- Review this deployment guide
- Check platform documentation

---

## 🎉 Success Checklist

After deployment, you should have:

- ✅ API running and accessible
- ✅ Database connected and seeded
- ✅ Redis caching working
- ✅ Email notifications working
- ✅ File uploads working
- ✅ Deployments working
- ✅ Error tracking active
- ✅ Monitoring in place
- ✅ Backups configured
- ✅ HTTPS enabled
- ✅ Rate limiting active
- ✅ Security hardened

---

**Congratulations! Your Evolyte backend is now in production! 🚀**

Date: 2025-12-19  
Version: 1.0.0  
Status: Production Ready
