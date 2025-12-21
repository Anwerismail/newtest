import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';
import { HTTP_STATUS } from './utils/constants.js';
import { logRequest, logInfo, logError } from './services/logger.service.js';
import { initRedis, closeRedis } from './services/cache.service.js';
import swaggerSpec from './config/swagger.js';
import { securityHeaders, sanitizeInput, preventParameterPollution, detectSuspiciousActivity, validateHttpMethods } from './middlewares/security.middleware.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();

// Connect to MongoDB (with error handling for serverless)
if (process.env.VERCEL !== '1') {
    // Traditional server: connect immediately
    connectDB();
} else {
    // Serverless: connect on first request to avoid timeout during cold start
    let isConnecting = false;
    let isConnected = false;
    
    app.use(async (req, res, next) => {
        if (isConnected) {
            return next();
        }
        
        if (!isConnecting) {
            isConnecting = true;
            try {
                await connectDB();
                isConnected = true;
            } catch (err) {
                logError('MongoDB connection failed', err);
                return res.status(503).json({ 
                    success: false, 
                    message: 'Database connection error' 
                });
            }
        } else {
            // Wait for connection to complete
            const maxWait = 5000; // 5 seconds
            const startTime = Date.now();
            while (!isConnected && Date.now() - startTime < maxWait) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            if (!isConnected) {
                return res.status(503).json({ 
                    success: false, 
                    message: 'Database connection timeout' 
                });
            }
        }
        
        next();
    });
}

// Connect to Redis (optional - app will work without it)
// Don't block startup on Redis connection in serverless
const redisPromise = initRedis().catch(err => {
    logError('Redis connection failed - caching disabled', err);
    return null;
});

// In serverless, give up on Redis quickly to avoid blocking
if (process.env.VERCEL === '1') {
    Promise.race([
        redisPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 2000))
    ]).catch(() => {
        logInfo('Redis skipped in serverless environment');
    });
}

// Middlewares
// Configure Helmet with CSP exceptions for Swagger UI
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
            fontSrc: ["'self'", "data:"]
        }
    }
})); // Security headers with CSP for Swagger UI
app.use(securityHeaders); // Additional security headers
app.use(validateHttpMethods); // Validate HTTP methods
// CORS - Allow multiple origins for development
const allowedOrigins = [
    config.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow all localhost
        if (config.NODE_ENV === 'development' && origin.includes('localhost')) {
            return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput); // XSS protection
app.use(preventParameterPollution); // Prevent parameter pollution
app.use(detectSuspiciousActivity); // Detect attacks

// Logging
if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Custom request logging
app.use(logRequest);

// API Documentation
// Serve the Swagger spec as JSON
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Serve custom Swagger UI HTML (works better with Vercel serverless)
app.get('/api-docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'swagger.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV
    });
});

// Import Routes
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import templatesRoutes from './routes/templates.routes.js';
import ticketsRoutes from './routes/tickets.routes.js';
import projectsRoutes from './routes/projects.routes.js';

// API Routes
app.get('/api/v1', (req, res) => {
    res.json({
        message: 'Evolyte API v1',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            admin: '/api/v1/admin',
            templates: '/api/v1/templates',
            tickets: '/api/v1/tickets',
            projects: '/api/v1/projects'
        }
    });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/templates', templatesRoutes);
app.use('/api/v1/tickets', ticketsRoutes);
app.use('/api/v1/projects', projectsRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Route non trouvée'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    logError('Request error', err, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?._id,
    });

    const statusCode = err.statusCode || HTTP_STATUS.SERVER_ERROR;
    const message = err.message || 'Erreur serveur';

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start Server (skip in Vercel serverless environment)
if (process.env.VERCEL !== '1') {
    const PORT = config.PORT;
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════╗
║                                           ║
║       🚀 EVOLYTE API STARTED             ║
║                                           ║
║  Environment: ${config.NODE_ENV.padEnd(27)}║
║  Port: ${PORT.toString().padEnd(33)}║
║  URL: ${config.API_URL.padEnd(34)}║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
        
        logInfo('Server started successfully', {
            environment: config.NODE_ENV,
            port: PORT,
            url: config.API_URL,
        });
    });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logInfo('SIGTERM received, closing server...');
    await closeRedis();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logInfo('SIGINT received, closing server...');
    await closeRedis();
    process.exit(0);
});

// Export for Vercel serverless
export default app;