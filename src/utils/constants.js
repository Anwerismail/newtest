// Rôles utilisateurs
export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    WORKER: 'WORKER',
    CLIENT: 'CLIENT'
};

// Statuts de projet
export const PROJECT_STATUS = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    REVIEW: 'REVIEW',
    COMPLETED: 'COMPLETED',
    DEPLOYED: 'DEPLOYED',
    MAINTENANCE: 'MAINTENANCE',
    ARCHIVED: 'ARCHIVED'
};

// Types de tickets
export const TICKET_TYPES = {
    NEW_PROJECT: 'NEW_PROJECT',
    BUG_FIX: 'BUG_FIX',
    MODIFICATION: 'MODIFICATION',
    CONTENT_UPDATE: 'CONTENT_UPDATE',
    REDESIGN: 'REDESIGN',
    SUPPORT: 'SUPPORT'
};

// Statuts de tickets
export const TICKET_STATUS = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    REVIEW: 'REVIEW',
    TESTING: 'TESTING',
    WAITING: 'WAITING',
    COMPLETED: 'COMPLETED',
    DEPLOYED: 'DEPLOYED',
    CLOSED: 'CLOSED',
    CANCELLED: 'CANCELLED'
};

// Priorités
export const PRIORITY = {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
};

// Types de templates
export const TEMPLATE_TYPES = {
    STATIC: 'static',
    REACT: 'react',
    NEXTJS: 'nextjs',
    VUE: 'vue'
};

// Catégories de templates
export const TEMPLATE_CATEGORIES = {
    PORTFOLIO: 'PORTFOLIO',
    BUSINESS: 'BUSINESS',
    ECOMMERCE: 'ECOMMERCE',
    BLOG: 'BLOG',
    RESTAURANT: 'RESTAURANT',
    EVENT: 'EVENT',
    OTHER: 'OTHER'
};

// Statuts de déploiement
export const DEPLOYMENT_STATUS = {
    NOT_DEPLOYED: 'NOT_DEPLOYED',
    DEPLOYING: 'DEPLOYING',
    DEPLOYED: 'DEPLOYED',
    FAILED: 'FAILED'
};

// Plans d'abonnement
export const SUBSCRIPTION_PLANS = {
    FREE: {
        name: 'FREE',
        maxProjects: 1,
        maxStorage: 1024, // MB
        customDomain: false,
        analytics: false,
        support: 'email',
        price: 0
    },
    STARTER: {
        name: 'STARTER',
        maxProjects: 5,
        maxStorage: 5120, // MB
        customDomain: true,
        analytics: true,
        support: 'priority_email',
        price: 29.99
    },
    PRO: {
        name: 'PRO',
        maxProjects: 20,
        maxStorage: 20480, // MB
        customDomain: true,
        analytics: true,
        support: 'priority_chat',
        price: 79.99
    },
    ENTERPRISE: {
        name: 'ENTERPRISE',
        maxProjects: -1, // Illimité
        maxStorage: -1, // Illimité
        customDomain: true,
        analytics: true,
        support: 'dedicated',
        price: 199.99
    }
};

// Messages d'erreur
export const ERROR_MESSAGES = {
    UNAUTHORIZED: 'Accès non autorisé',
    FORBIDDEN: 'Action interdite',
    NOT_FOUND: 'Ressource non trouvée',
    VALIDATION_ERROR: 'Erreur de validation',
    SERVER_ERROR: 'Erreur serveur',
    INVALID_CREDENTIALS: 'Identifiants invalides',
    EMAIL_EXISTS: 'Cet email est déjà utilisé',
    TOKEN_EXPIRED: 'Token expiré',
    INVALID_TOKEN: 'Token invalide'
};

// Codes HTTP
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500
};