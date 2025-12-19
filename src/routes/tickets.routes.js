import express from 'express';
import { body } from 'express-validator';
import {
    getAllTickets,
    getMyTickets,
    getTicketById,
    createTicket,
    updateTicket,
    changeTicketStatus,
    assignTicket,
    addComment,
    trackTime,
    getTicketHistory,
    deleteTicket
} from '../controllers/tickets.controller.js';
import {
    getTicketStats,
    getKanbanBoard,
    getTicketMetrics,
    getOverdueTickets
} from '../controllers/admin/tickets.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validate, validateObjectId } from '../middlewares/validation.middleware.js';
import { ROLES, TICKET_TYPES, TICKET_STATUS, PRIORITY } from '../utils/constants.js';

const router = express.Router();

// Toutes les routes nécessitent authentification
router.use(protect);

/**
 * Routes Admin
 */

// GET /api/v1/tickets/admin/stats - Statistiques
router.get(
    '/admin/stats',
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER),
    getTicketStats
);

// GET /api/v1/tickets/admin/board - Board Kanban
router.get(
    '/admin/board',
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER),
    getKanbanBoard
);

// GET /api/v1/tickets/admin/metrics - Métriques de performance
router.get(
    '/admin/metrics',
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER),
    getTicketMetrics
);

// GET /api/v1/tickets/admin/overdue - Tickets en retard
router.get(
    '/admin/overdue',
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER),
    getOverdueTickets
);

/**
 * Routes Utilisateurs
 */

// GET /api/v1/tickets/my - Mes tickets
router.get('/my', getMyTickets);

// GET /api/v1/tickets - Liste tous les tickets (selon rôle)
router.get('/', getAllTickets);

// GET /api/v1/tickets/:id - Récupérer un ticket
router.get('/:id', validateObjectId('id'), getTicketById);

// GET /api/v1/tickets/:id/history - Historique du ticket
router.get('/:id/history', validateObjectId('id'), getTicketHistory);

// POST /api/v1/tickets - Créer un ticket
router.post(
    '/',
    [
        body('type')
            .isIn(Object.values(TICKET_TYPES))
            .withMessage('Type de ticket invalide'),
        body('title')
            .notEmpty()
            .withMessage('Titre requis')
            .isLength({ max: 200 })
            .withMessage('Titre max 200 caractères'),
        body('description')
            .notEmpty()
            .withMessage('Description requise'),
        body('priority')
            .optional()
            .isIn(Object.values(PRIORITY))
            .withMessage('Priorité invalide'),
        body('category')
            .optional()
            .isIn(['FRONTEND', 'BACKEND', 'DESIGN', 'CONTENT', 'INFRASTRUCTURE', 'OTHER'])
            .withMessage('Catégorie invalide'),
        validate
    ],
    createTicket
);

// PUT /api/v1/tickets/:id - Modifier un ticket
router.put(
    '/:id',
    [
        validateObjectId('id'),
        body('title')
            .optional()
            .isLength({ max: 200 })
            .withMessage('Titre max 200 caractères'),
        body('priority')
            .optional()
            .isIn(Object.values(PRIORITY))
            .withMessage('Priorité invalide'),
        validate
    ],
    updateTicket
);

// PUT /api/v1/tickets/:id/status - Changer le statut
router.put(
    '/:id/status',
    [
        validateObjectId('id'),
        body('status')
            .isIn(Object.values(TICKET_STATUS))
            .withMessage('Statut invalide'),
        body('comment')
            .optional()
            .trim(),
        validate
    ],
    changeTicketStatus
);

// POST /api/v1/tickets/:id/assign - Assigner un ticket
router.post(
    '/:id/assign',
    authorize(ROLES.PROJECT_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN),
    [
        validateObjectId('id'),
        body('workerId')
            .notEmpty()
            .withMessage('Worker ID requis'),
        validate
    ],
    assignTicket
);

// POST /api/v1/tickets/:id/comments - Ajouter un commentaire
router.post(
    '/:id/comments',
    [
        validateObjectId('id'),
        body('content')
            .notEmpty()
            .withMessage('Contenu requis')
            .isLength({ max: 2000 })
            .withMessage('Commentaire max 2000 caractères'),
        validate
    ],
    addComment
);

// POST /api/v1/tickets/:id/time - Tracker le temps
router.post(
    '/:id/time',
    authorize(ROLES.WORKER, ROLES.PROJECT_MANAGER),
    [
        validateObjectId('id'),
        body('duration')
            .isInt({ min: 1 })
            .withMessage('Durée invalide (minutes)'),
        body('description')
            .optional()
            .trim(),
        validate
    ],
    trackTime
);

// DELETE /api/v1/tickets/:id - Supprimer un ticket
router.delete(
    '/:id',
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    validateObjectId('id'),
    deleteTicket
);

export default router;