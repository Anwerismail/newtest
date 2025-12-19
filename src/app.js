import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';
import { HTTP_STATUS } from './utils/constants.js';
import { logRequest, logInfo, logError } from './services/logger.service.js';
import { initRedis, closeRedis } from './services/cache.service.js';
import swaggerSpec from './config/swagger.js';
import { securityHeaders, sanitizeInput, preventParameterPollution, detectSuspiciousActivity, validateHttpMethods } from './middlewares/security.middleware.js';

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Connect to Redis (optional - app will work without it)
initRedis().catch(err => {
    logError('Redis connection failed - caching disabled', err);
});

// Middlewares
app.use(helmet()); // Security headers
app.use(securityHeaders); // Additional security headers
app.use(validateHttpMethods); // Validate HTTP methods
app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Evolyte API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
        persistAuthorization: true,
    },
}));

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

// Start Server
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