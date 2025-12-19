# 🧪 Services Testing Guide

## Quick Testing Checklist

### ✅ Pre-requisites
- [ ] `.env` file configured with all required variables
- [ ] MongoDB connected
- [ ] Server running (`npm run dev`)

---

## 1️⃣ Test Logging Service

### Test 1: Server Start Logs
```bash
npm run dev
```

**Expected Output:**
```
✅ Environment variables loaded successfully
✅ MongoDB Connected
[timestamp] [info]: Server started successfully { environment: 'development', port: 5000, ... }
```

### Test 2: Request Logging
```bash
curl http://localhost:5000/health
```

**Expected Output in Console:**
```
[timestamp] [http]: HTTP Request { method: 'GET', url: '/health', status: 200, duration: '5ms', ... }
```

**Status:** ✅ Logging service works if you see structured colored logs

---

## 2️⃣ Test Email Service

### Test 1: Welcome Email on Registration
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "role": "CLIENT"
  }'
```

**Expected:**
- ✅ 201 response with user data
- ✅ Welcome email sent to testuser@example.com
- ✅ Console log: `[info]: Email sent successfully`

**Note:** Configure email credentials in `.env` first:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

**Status:** ✅ Email service works if welcome email received

---

## 3️⃣ Test Storage Service

### Test 1: Upload Image to Project

**Step 1:** Create a project first:
```bash
# Get auth token first (login)
TOKEN="YOUR_JWT_TOKEN"

# Create project
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Testing storage",
    "templateId": "TEMPLATE_ID"
  }'
```

**Step 2:** Upload an image:
```bash
PROJECT_ID="your_project_id"

curl -X POST http://localhost:5000/api/v1/projects/$PROJECT_ID/assets/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/image.jpg"
```

**Expected:**
- ✅ 201 response with asset details
- ✅ Asset uploaded to Cloudinary
- ✅ Console log: `[info]: Asset uploaded to project`
- ✅ Asset URL returned (cloudinary.com)

**Note:** Configure Cloudinary in `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Status:** ✅ Storage service works if asset URL returned

---

## 4️⃣ Test Deployment Service

### Test 1: Deploy Project to Vercel

**Prerequisites:**
- Project created and completed
- Vercel API token in `.env`

```bash
curl -X POST http://localhost:5000/api/v1/projects/$PROJECT_ID/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "VERCEL",
    "production": true
  }'
```

**Expected:**
- ✅ 200 response: "Déploiement démarré"
- ✅ Deployment happens asynchronously
- ✅ Console log: `[info]: Deployment started`
- ✅ After 30-60s: `[info]: Deployment succeeded`
- ✅ Email notification sent to project owner

**Check deployment status:**
```bash
curl -X GET http://localhost:5000/api/v1/projects/$PROJECT_ID/deployment \
  -H "Authorization: Bearer $TOKEN"
```

**Note:** Configure Vercel in `.env`:
```env
VERCEL_API_TOKEN=your_vercel_token
```

**Status:** ✅ Deployment service works if project deployed successfully

---

## 5️⃣ Test DNS Verification

### Test 1: Verify Custom Domain

**Prerequisites:**
- Project with custom domain configured
- DNS records pointing to Vercel/Netlify

```bash
curl -X POST http://localhost:5000/api/v1/projects/$PROJECT_ID/domain/verify \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- ✅ 200 response with verification result
- ✅ Console log: `[info]: DNS verification...`
- ✅ Returns `verified: true` if DNS configured correctly
- ✅ Returns `verified: false` with explanation if not configured

**Status:** ✅ DNS verification works if real DNS lookup performed

---

## 🔍 Integration Tests

### Test Complete User Flow

**1. Register User → Welcome Email**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "Test@123",
    "firstName": "New",
    "lastName": "User",
    "role": "CLIENT"
  }'
```
✅ Check email inbox for welcome email

**2. Login → Logging**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "Test@123"
  }'
```
✅ Check console for authentication log

**3. Create Project → Logging**
```bash
TOKEN="your_jwt_token"
curl -X POST http://localhost:5000/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test Project",
    "templateId": "TEMPLATE_ID"
  }'
```
✅ Check console for business event log

**4. Upload Asset → Storage Service**
```bash
PROJECT_ID="your_project_id"
curl -X POST http://localhost:5000/api/v1/projects/$PROJECT_ID/assets/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.jpg"
```
✅ Check Cloudinary dashboard for uploaded file

**5. Deploy Project → Deployment + Email**
```bash
curl -X POST http://localhost:5000/api/v1/projects/$PROJECT_ID/deploy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider": "VERCEL"}'
```
✅ Check email for deployment notification
✅ Check Vercel dashboard for deployment

**6. Create Ticket → Logging**
```bash
curl -X POST http://localhost:5000/api/v1/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SUPPORT",
    "title": "Test ticket",
    "description": "Testing services",
    "priority": "MEDIUM"
  }'
```
✅ Check console for ticket creation log

**7. Assign Ticket → Email Notification**
```bash
TICKET_ID="your_ticket_id"
WORKER_ID="worker_user_id"
curl -X POST http://localhost:5000/api/v1/tickets/$TICKET_ID/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"workerId": "'$WORKER_ID'"}'
```
✅ Worker receives email notification

---

## 📊 Verification Checklist

| Service | Test | Status |
|---------|------|--------|
| **Logging** | Server start logs visible | ⬜ |
| **Logging** | Request logs in console | ⬜ |
| **Logging** | Error logs with stack traces | ⬜ |
| **Email** | Welcome email received | ⬜ |
| **Email** | Ticket assignment email | ⬜ |
| **Email** | Deployment notification | ⬜ |
| **Storage** | Image uploaded to Cloudinary | ⬜ |
| **Storage** | Asset URL returned | ⬜ |
| **Storage** | Asset deleted from cloud | ⬜ |
| **Deployment** | Project deployed to Vercel | ⬜ |
| **Deployment** | Deployment status tracked | ⬜ |
| **Deployment** | Build logs available | ⬜ |
| **DNS** | Domain verification works | ⬜ |

---

## 🐛 Troubleshooting

### Email Service Not Working
```
Error: Email sent failed
```
**Solutions:**
1. Check email credentials in `.env`
2. Enable "Less secure app access" in Gmail (or use app password)
3. Check firewall/network allows SMTP port 587
4. Verify EMAIL_HOST is correct

### Storage Service Not Working
```
Error: Cloudinary configuration missing
```
**Solutions:**
1. Verify CLOUDINARY_* variables in `.env`
2. Check Cloudinary dashboard for API keys
3. Ensure account is active
4. Test with smaller files first

### Deployment Service Not Working
```
Error: VERCEL_API_TOKEN not configured
```
**Solutions:**
1. Get Vercel token from: https://vercel.com/account/tokens
2. Add to `.env`: `VERCEL_API_TOKEN=your_token`
3. Verify token has deployment permissions
4. Check Vercel dashboard for deployment logs

### Logging Service Not Working
```
No logs appearing
```
**Solutions:**
1. Check LOG_LEVEL in `.env` (should be 'debug' for dev)
2. Ensure Winston is installed: `npm install winston`
3. Check console for any startup errors
4. Verify logger.service.js is imported in app.js

---

## ✅ Success Criteria

All services are working correctly if:

1. ✅ Colored, structured logs appear in console
2. ✅ Emails are received in inbox
3. ✅ Files uploaded to Cloudinary dashboard
4. ✅ Projects deployed to Vercel/Netlify
5. ✅ No error logs during normal operations
6. ✅ All async operations complete successfully

---

## 🎯 Next Steps After Testing

Once all services are verified:

1. **Production Configuration:**
   - Set `NODE_ENV=production`
   - Enable file logging: `ENABLE_FILE_LOGGING=true`
   - Set appropriate LOG_LEVEL: `info` or `warn`

2. **Security:**
   - Rotate API tokens regularly
   - Use environment-specific credentials
   - Enable 2FA on external services

3. **Monitoring:**
   - Monitor logs in `logs/` directory
   - Set up log aggregation (ELK, Datadog, etc.)
   - Configure alerts for errors

4. **Optimization:**
   - Implement rate limiting
   - Add Redis caching
   - Optimize asset delivery

---

**Happy Testing! 🚀**

Date: 2025-12-19  
Version: 1.0.0
