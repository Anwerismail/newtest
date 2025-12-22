# 🚀 Evolyte Backend API

Backend REST API for Evolyte - A complete platform for website creation with ticketing system, project management, and automatic deployment.

## 🎯 Status
🚨 getMyTickets CALLED! URL: /api/v1/tickets/my?page=1&limit=50
getMyTickets CALLED! URL: /api/v1/tickets/my?page=1&limit=50
getMyTickets CALLED! URL: /api/v1/tickets/my?page=1&limit=50
**Version:** 1.0.0  
**Environment:** Production Ready  
**Deployment:** Vercel  
**Live API:** https://evolyte-backend.vercel.app  

## 🛠️ Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **Cache:** Redis (Upstash)
- **Authentication:** JWT with Role-Based Access Control
- **Storage:** Cloudinary
- **Email:** Nodemailer
- **Logging:** Winston
- **Monitoring:** Sentry
- **Deployment:** Vercel Serverless
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest + Supertest

## 🔒 Security Features

- ✅ Helmet Security Headers with CSP
- ✅ Rate Limiting (Role-based)
- ✅ Input Sanitization (XSS Protection)
- ✅ Parameter Pollution Prevention
- ✅ Password Hashing (bcrypt)
- ✅ JWT Token Management
- ✅ MongoDB Injection Prevention
- ✅ CORS Configuration

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd Evolyte/backend
npm install
```

### 2. Environment Setup

Create `.env` file from template:

```bash
cp .env.example .env
```

Configure required variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/evolyte

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Redis Cache (Optional)
REDIS_URL=redis://default:password@host:port

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Sentry (Optional)
SENTRY_DSN=your-sentry-dsn

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 3. Seed Database

Create default users:

```bash
npm run seed
```

**Default accounts created:**
- Super Admin: `admin@evolyte.com` / `Admin@123`
- Manager: `manager@evolyte.com` / `Manager@123`
- Worker: `worker@evolyte.com` / `Worker@123`
- Client: `client@evolyte.com` / `Client@123`

⚠️ **Change these passwords in production!**

### 4. Start Development Server

```bash
npm run dev
```

Server starts at `http://localhost:5000`

### 5. View API Documentation

Open Swagger UI: `http://localhost:5000/api-docs`

## 📡 API Endpoints

### Base URL
- **Local:** `http://localhost:5000`
- **Production:** `https://evolyte-backend.vercel.app`

### Core Endpoints

| Category | Method | Endpoint | Description | Auth |
|----------|--------|----------|-------------|------|
| **Health** | GET | `/health` | Health check | ❌ |
| **Docs** | GET | `/api-docs` | Swagger UI | ❌ |
| **Auth** | POST | `/api/v1/auth/register` | Register user | ❌ |
| **Auth** | POST | `/api/v1/auth/login` | Login | ❌ |
| **Auth** | GET | `/api/v1/auth/me` | Get profile | ✅ |
| **Auth** | PUT | `/api/v1/auth/profile` | Update profile | ✅ |
| **Auth** | PUT | `/api/v1/auth/password` | Change password | ✅ |
| **Templates** | GET | `/api/v1/templates` | List templates | ❌ |
| **Templates** | GET | `/api/v1/templates/:id` | Get template | ❌ |
| **Projects** | GET | `/api/v1/projects` | List projects | ✅ |
| **Projects** | POST | `/api/v1/projects` | Create project | ✅ |
| **Projects** | GET | `/api/v1/projects/:id` | Get project | ✅ |
| **Tickets** | GET | `/api/v1/tickets` | List tickets | ✅ |
| **Tickets** | POST | `/api/v1/tickets` | Create ticket | ✅ |
| **Admin** | GET | `/api/v1/admin/users` | List users | 🔐 Admin |

### Quick API Test

#### 1. Health Check
```bash
curl http://localhost:5000/health
```

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@evolyte.com",
    "password": "Admin@123"
  }'
```

#### 3. Get Profile (with token)
```bash
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Full API documentation:** Visit `/api-docs` for interactive Swagger UI

## 🔐 User Roles & Permissions

| Role | Description | Access Level |
|------|-------------|--------------|
| `SUPER_ADMIN` | Full system access | 4 |
| `ADMIN` | Administrative access | 3 |
| `PROJECT_MANAGER` | Manage projects & tickets | 2 |
| `WORKER` | Development tasks | 1 |
| `CLIENT` | End user access | 0 |

## 📁 Project Structure

```
backend/
├── api/
│   └── index.js              # Vercel serverless entry point
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # MongoDB connection
│   │   ├── env.js           # Environment variables
│   │   ├── swagger.js       # API documentation
│   │   └── sentry.js        # Error tracking
│   ├── controllers/         # Business logic
│   │   ├── auth.controller.js
│   │   ├── projects.controller.js
│   │   ├── tickets.controller.js
│   │   ├── templates.controller.js
│   │   └── admin/
│   ├── models/              # MongoDB schemas
│   │   ├── User.model.js
│   │   ├── Project.model.js
│   │   ├── Ticket.model.js
│   │   └── Template.model.js
│   ├── routes/              # API routes
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── security.middleware.js
│   │   └── rateLimit.middleware.js
│   ├── services/            # External services
│   │   ├── cache.service.js        # Redis caching
│   │   ├── email.service.js        # Email sending
│   │   ├── storage.service.js      # Cloudinary uploads
│   │   ├── deployment.service.js   # Vercel/Netlify
│   │   └── logger.service.js       # Winston logging
│   ├── utils/               # Utilities
│   ├── views/               # HTML templates
│   │   └── swagger.html     # Custom Swagger UI
│   └── app.js              # Express app
├── tests/                   # Test suite
│   ├── unit/
│   ├── integration/
│   └── helpers/
├── .env.example             # Environment template
├── vercel.json              # Vercel configuration
└── package.json
```

## ✨ Features

### 🔐 Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (5 roles)
- ✅ Password reset with secure tokens
- ✅ Profile management
- ✅ Account security

### 🎫 Ticketing System
- ✅ Create, update, assign tickets
- ✅ Comments and attachments
- ✅ Status workflow management
- ✅ Time tracking
- ✅ Priority and labels

### 📦 Project Management
- ✅ CRUD operations
- ✅ Collaboration tools
- ✅ Version control integration
- ✅ Deployment management
- ✅ Custom domains

### 🎨 Template System
- ✅ Browse templates
- ✅ Template ratings
- ✅ Download tracking
- ✅ Category filtering

### 🚀 Deployment Integration
- ✅ Vercel API integration
- ✅ Netlify API integration
- ✅ Automatic deployments
- ✅ Environment management

### 📧 Notifications
- ✅ Email notifications
- ✅ Password reset emails
- ✅ Welcome emails
- ✅ Ticket updates

### 🛡️ Security & Performance
- ✅ Rate limiting (role-based)
- ✅ Redis caching
- ✅ Input sanitization
- ✅ Security headers
- ✅ Error tracking (Sentry)
- ✅ Comprehensive logging (Winston)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

## 🐛 Troubleshooting

### Server won't start?
1. ✅ Check MongoDB connection (`MONGODB_URI` is correct)
2. ✅ Verify environment variables are set
3. ✅ Ensure port 5000 is available
4. ✅ Node.js version >= 20

### MongoDB Atlas connection error?
1. ✅ Whitelist `0.0.0.0/0` in Network Access
2. ✅ Check username/password in connection string
3. ✅ URL-encode special characters in password

### Redis connection issues?
- Redis is optional - app works without it
- Check `REDIS_URL` format
- Verify Upstash Redis is active

### Swagger UI not loading?
- Clear browser cache
- Check `/api-docs.json` endpoint
- Verify Helmet CSP configuration

## 🚀 Deployment to Vercel

### Prerequisites
1. MongoDB Atlas with IP `0.0.0.0/0` whitelisted
2. Environment variables ready
3. Vercel account (free)

### Deploy Steps

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel --prod
```

### Environment Variables (Vercel Dashboard)

Add these in **Settings → Environment Variables**:

```
MONGODB_URI
JWT_SECRET
JWT_EXPIRE
FRONTEND_URL
EMAIL_USER (optional)
EMAIL_PASS (optional)
REDIS_URL (optional)
CLOUDINARY_CLOUD_NAME (optional)
CLOUDINARY_API_KEY (optional)
CLOUDINARY_API_SECRET (optional)
SENTRY_DSN (optional)
```

✅ **Enable for:** Production, Preview, Development

### Verify Deployment

After deployment:
1. Check health: `https://your-app.vercel.app/health`
2. View docs: `https://your-app.vercel.app/api-docs`
3. Check logs: `vercel logs --prod`

### Free Tier Benefits
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ 100GB bandwidth/month
- ✅ Auto-deploy from Git
- ✅ Serverless functions

## 📚 Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run seed       # Seed database with default users
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is private and proprietary.

---

**Made with ❤️ by Evolyte Team**