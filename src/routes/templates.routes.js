import express from 'express';
import { body } from 'express-validator';
import {
    getAllTemplates,
    getTemplateById,
    getCategories,
    getPopularTemplates,
    getRecommendedTemplates,
    cloneTemplate,
    addReview,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateStats
} from '../controllers/templates.controller.js';
import { protect, authorize, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate, validateObjectId } from '../middlewares/validation.middleware.js';
import { apiRateLimit } from '../middlewares/rateLimit.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

// Apply rate limiting to all template routes
router.use(apiRateLimit);

/**
 * Routes Publiques / Utilisateurs
 */

// GET /api/v1/templates - Liste tous les templates
router.get('/', getAllTemplates);

// GET /api/v1/templates/categories - Catégories
router.get('/categories', getCategories);

// GET /api/v1/templates/popular - Templates populaires
router.get('/popular', getPopularTemplates);

// GET /api/v1/templates/recommended - Templates recommandés (requiert auth)
router.get('/recommended', protect, getRecommendedTemplates);

// GET /api/v1/templates/:idOrSlug - Récupérer un template
router.get('/:idOrSlug', optionalAuth, getTemplateById);

// POST /api/v1/templates/:id/clone - Cloner un template (requiert auth)
router.post('/:id/clone', protect, validateObjectId('id'), cloneTemplate);

// POST /api/v1/templates/:id/review - Ajouter une review
router.post(
    '/:id/review',
    protect,
    validateObjectId('id'),
    [
        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Note entre 1 et 5'),
        body('comment')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Commentaire max 500 caractères'),
        validate
    ],
    addReview
);

/**
 * Routes Admin
 */

// GET /api/v1/templates/admin/stats - Statistiques (admin)
router.get(
    '/admin/stats',
    protect,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    getTemplateStats
);

// POST /api/v1/templates/admin - Créer template (admin)
router.post(
    '/admin',
    protect,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    [
        body('name').notEmpty().withMessage('Nom requis'),
        body('description').notEmpty().withMessage('Description requise'),
        body('category').notEmpty().withMessage('Catégorie requise'),
        body('type').notEmpty().withMessage('Type requis'),
        body('preview.thumbnail').notEmpty().withMessage('Thumbnail requis'),
        validate
    ],
    createTemplate
);

// PUT /api/v1/templates/admin/:id - Modifier template (admin)
router.put(
    '/admin/:id',
    protect,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    validateObjectId('id'),
    updateTemplate
);

// DELETE /api/v1/templates/admin/:id - Supprimer template (super admin)
router.delete(
    '/admin/:id',
    protect,
    authorize(ROLES.SUPER_ADMIN),
    validateObjectId('id'),
    deleteTemplate
);

export default router;