import express from 'express';
import { body } from 'express-validator';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserStats,
    getAvailableWorkers
} from '../controllers/admin/users.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validate, validateObjectId } from '../middlewares/validation.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

// Toutes les routes admin nécessitent authentification + rôle admin
router.use(protect);
router.use(authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER));

/**
 * @swagger
 * /api/v1/admin/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Admin]
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
router.get('/users/stats', getUserStats);

/**
 * @swagger
 * /api/v1/admin/users/workers/available:
 *   get:
 *     summary: Get available workers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available workers retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users/workers/available', getAvailableWorkers);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
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
 *         description: Users retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
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
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/users/:id', validateObjectId('id'), getUserById);

/**
 * @swagger
 * /api/v1/admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: Password@123
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, PROJECT_MANAGER, WORKER, CLIENT]
 *                 default: CLIENT
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
    '/users',
    [
        body('email')
            .isEmail()
            .withMessage('Email invalide')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Mot de passe minimum 6 caractères'),
        body('firstName')
            .notEmpty()
            .withMessage('Prénom requis')
            .trim(),
        body('lastName')
            .notEmpty()
            .withMessage('Nom requis')
            .trim(),
        body('role')
            .optional()
            .isIn(Object.values(ROLES))
            .withMessage('Rôle invalide'),
        validate
    ],
    createUser
);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   put:
 *     summary: Update a user
 *     tags: [Admin]
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
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, PROJECT_MANAGER, WORKER, CLIENT]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
    '/users/:id',
    [
        validateObjectId('id'),
        body('firstName')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Prénom ne peut pas être vide'),
        body('lastName')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Nom ne peut pas être vide'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Email invalide')
            .normalizeEmail(),
        body('role')
            .optional()
            .isIn(Object.values(ROLES))
            .withMessage('Rôle invalide'),
        body('status')
            .optional()
            .isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
            .withMessage('Statut invalide'),
        validate
    ],
    updateUser
);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Super Admin only)
 *     tags: [Admin]
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
 *         description: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
    '/users/:id',
    authorize(ROLES.SUPER_ADMIN),
    validateObjectId('id'),
    deleteUser
);

export default router;