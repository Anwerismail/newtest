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
 * @swagger
 * /api/v1/templates:
 *   get:
 *     summary: Get all templates
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type (static, react, nextjs, vue)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Template'
 *                 pagination:
 *                   type: object
 */
router.get('/', getAllTemplates);

/**
 * @swagger
 * /api/v1/templates/categories:
 *   get:
 *     summary: Get all template categories
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', getCategories);

/**
 * @swagger
 * /api/v1/templates/popular:
 *   get:
 *     summary: Get popular templates
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Popular templates retrieved successfully
 */
router.get('/popular', getPopularTemplates);

/**
 * @swagger
 * /api/v1/templates/recommended:
 *   get:
 *     summary: Get recommended templates for user
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended templates retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/recommended', protect, getRecommendedTemplates);

/**
 * @swagger
 * /api/v1/templates:
 *   post:
 *     summary: Create a new template (Worker/Manager/Admin)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - category
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: Modern Portfolio
 *               description:
 *                 type: string
 *                 example: A beautiful portfolio template with modern design
 *               category:
 *                 type: string
 *                 enum: [PORTFOLIO, BUSINESS, ECOMMERCE, BLOG, RESTAURANT, EVENT]
 *                 example: PORTFOLIO
 *               type:
 *                 type: string
 *                 enum: [static, react, nextjs, vue]
 *                 example: react
 *               preview:
 *                 type: object
 *                 properties:
 *                   thumbnail:
 *                     type: string
 *                     example: https://example.com/thumbnail.jpg
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [modern, portfolio, responsive]
 *               complexity:
 *                 type: string
 *                 enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *                 default: INTERMEDIATE
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
    '/',
    protect,
    authorize(ROLES.WORKER, ROLES.PROJECT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN),
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

/**
 * @swagger
 * /api/v1/templates/{idOrSlug}:
 *   get:
 *     summary: Get template by ID or slug
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: idOrSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID or slug
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Template'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:idOrSlug', optionalAuth, getTemplateById);

/**
 * @swagger
 * /api/v1/templates/{id}/clone:
 *   post:
 *     summary: Clone a template to create a new project
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: My New Website
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template cloned successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:id/clone', protect, validateObjectId('id'), cloneTemplate);

/**
 * @swagger
 * /api/v1/templates/{id}/review:
 *   post:
 *     summary: Add a review to a template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 example: Great template, easy to customize!
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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
 * @swagger
 * /api/v1/templates/admin/stats:
 *   get:
 *     summary: Get template statistics (Admin)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/admin/stats',
    protect,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    getTemplateStats
);

// Duplicate route removed - now handled above before :idOrSlug route

/**
 * @swagger
 * /api/v1/templates/admin/{id}:
 *   put:
 *     summary: Update a template (Admin)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
    '/admin/:id',
    protect,
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    validateObjectId('id'),
    updateTemplate
);

/**
 * @swagger
 * /api/v1/templates/admin/{id}:
 *   delete:
 *     summary: Delete a template (Super Admin only)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
    '/admin/:id',
    protect,
    authorize(ROLES.SUPER_ADMIN),
    validateObjectId('id'),
    deleteTemplate
);

export default router;