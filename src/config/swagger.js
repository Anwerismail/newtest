import swaggerJsdoc from 'swagger-jsdoc';
import { ENV } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Evolyte API Documentation',
      version: '1.0.0',
      description: 'Complete API documentation for Evolyte - Website Builder Platform',
      contact: {
        name: 'Evolyte Team',
        email: 'support@evolyte.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: ENV.API_URL || 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.evolyte.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { 
              type: 'string', 
              enum: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'WORKER', 'CLIENT'],
              example: 'CLIENT'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
              example: 'ACTIVE'
            },
            createdAt: { type: 'string', format: 'date-time' },
            lastLogin: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'My Website' },
            slug: { type: 'string', example: 'my-website' },
            description: { type: 'string', example: 'A beautiful website' },
            owner: { type: 'string', example: '507f1f77bcf86cd799439011' },
            template: { type: 'string' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DEPLOYED', 'ARCHIVED'],
            },
            deployment: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['NOT_DEPLOYED', 'DEPLOYING', 'DEPLOYED', 'FAILED'] },
                provider: { type: 'string', enum: ['VERCEL', 'NETLIFY', 'AWS', 'CUSTOM'] },
                deploymentUrl: { type: 'string' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            ticketNumber: { type: 'string', example: 'EVO-2025-0001' },
            type: {
              type: 'string',
              enum: ['NEW_PROJECT', 'BUG_FIX', 'MODIFICATION', 'CONTENT_UPDATE', 'REDESIGN', 'SUPPORT'],
            },
            title: { type: 'string', example: 'Fix navigation menu' },
            description: { type: 'string' },
            priority: {
              type: 'string',
              enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            },
            status: {
              type: 'string',
              enum: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'RESOLVED', 'CLOSED', 'CANCELLED'],
            },
            reporter: { type: 'string' },
            assignedTo: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Template: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Modern Portfolio' },
            slug: { type: 'string', example: 'modern-portfolio' },
            description: { type: 'string' },
            category: {
              type: 'string',
              enum: ['PORTFOLIO', 'BUSINESS', 'ECOMMERCE', 'BLOG', 'RESTAURANT', 'EVENT'],
            },
            type: {
              type: 'string',
              enum: ['static', 'react', 'nextjs', 'vue'],
            },
            visibility: {
              type: 'string',
              enum: ['free', 'premium'],
            },
            preview: {
              type: 'object',
              properties: {
                thumbnail: { type: 'string' },
                images: { type: 'array', items: { type: 'string' } },
                liveUrl: { type: 'string' },
              },
            },
            metadata: {
              type: 'object',
              properties: {
                downloads: { type: 'number' },
                rating: { type: 'number', minimum: 0, maximum: 5 },
                reviewCount: { type: 'number' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Non autorisé - Token manquant ou invalide',
              },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Accès refusé - Permissions insuffisantes',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Ressource non trouvée',
              },
            },
          },
        },
        BadRequest: {
          description: 'Invalid request data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Données invalides',
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Erreur serveur',
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string' },
                  retryAfter: { type: 'number', description: 'Seconds until retry' },
                },
              },
              example: {
                success: false,
                message: 'Trop de requêtes. Veuillez réessayer plus tard.',
                retryAfter: 900,
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management (admin only)',
      },
      {
        name: 'Projects',
        description: 'Project management endpoints',
      },
      {
        name: 'Templates',
        description: 'Website template endpoints',
      },
      {
        name: 'Tickets',
        description: 'Ticket management system',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // Path to API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
