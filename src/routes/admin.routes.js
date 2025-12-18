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
 * Routes Users
 */

// GET /api/v1/admin/users/stats - Statistiques
router.get('/users/stats', getUserStats);

// GET /api/v1/admin/users/workers/available - Workers disponibles
router.get('/users/workers/available', getAvailableWorkers);

// GET /api/v1/admin/users - Liste tous les users
router.get('/users', getAllUsers);

// GET /api/v1/admin/users/:id - Récupérer un user
router.get('/users/:id', validateObjectId('id'), getUserById);

// POST /api/v1/admin/users - Créer un user
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

// PUT /api/v1/admin/users/:id - Modifier un user
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

// DELETE /api/v1/admin/users/:id - Supprimer un user (SUPER_ADMIN only)
router.delete(
    '/users/:id',
    authorize(ROLES.SUPER_ADMIN), // Seul SUPER_ADMIN peut supprimer
    validateObjectId('id'),
    deleteUser
);

export default router;