import dotenv from 'dotenv';

dotenv.config();

export const config = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 5000,
    API_URL: process.env.API_URL || 'http://localhost:5000',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Database
    MONGODB_URI: process.env.MONGODB_URI,

    // JWT
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',

    // Redis
    REDIS_URL: process.env.REDIS_URL,

    // Cloudinary
    CLOUDINARY: {
        CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        API_KEY: process.env.CLOUDINARY_API_KEY,
        API_SECRET: process.env.CLOUDINARY_API_SECRET
    },

    // Email
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@siteforge.com',

    // Stripe
    STRIPE: {
        SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
    },

    // Vercel
    VERCEL: {
        TOKEN: process.env.VERCEL_TOKEN,
        TEAM_ID: process.env.VERCEL_TEAM_ID
    },

    // Rate Limiting
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
};

// Validation
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Error: ${varName} is not defined in .env file`);
        process.exit(1);
    }
});

console.log('✅ Environment variables loaded successfully');