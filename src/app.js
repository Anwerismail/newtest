import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import { connectDB } from './config/database.js';
import { HTTP_STATUS } from './utils/constants.js';

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(helmet()); // Security headers
app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

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

// API Routes
app.get('/api/v1', (req, res) => {
    res.json({
        message: 'SiteForge API v1',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            admin: '/api/v1/admin',
            templates: '/api/v1/templates',
            projects: '/api/v1/projects',
            tickets: '/api/v1/tickets'
        }
    });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/templates', templatesRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Route non trouvée'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);

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
║       🚀 SITEFORGE API STARTED           ║
║                                           ║
║  Environment: ${config.NODE_ENV.padEnd(27)}║
║  Port: ${PORT.toString().padEnd(33)}║
║  URL: ${config.API_URL.padEnd(34)}║
║                                           ║
╚═══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    process.exit(0);
});

export default app;