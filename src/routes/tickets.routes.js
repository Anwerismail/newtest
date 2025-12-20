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
import { apiRateLimit } from '../middlewares/rateLimit.middleware.js';
import { ROLES, TICKET_TYPES, TICKET_STATUS, PRIORITY } from '../utils/constants.js';

const router = express.Router();

// Toutes les routes nécessitent authentification
router.use(protect);

// Apply rate limiting to all ticket routes
router.use(apiRateLimit);

/**
 * @swagger
 * /api/v1/tickets/admin/stats:
 *   get:
 *     summary: Get ticket statistics (Admin/Manager)
 *     tags: [Tickets]
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
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER),
    getTicketStats
);

/**
 * @swagger
 * /api/v1/tickets/admin/board:
 *   get:
 *     summary: Get Kanban board view of tickets (Admin/Manager)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kanban board retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/admin/board',
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER),
    getKanbanBoard
);

/**
 * @swagger
 * /api/v1/tickets/admin/metrics:
 *   get:
 *     summary: Get ticket performance metrics (Admin/Manager)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/admin/metrics',
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER),
    getTicketMetrics
);

/**
 * @swagger
 * /api/v1/tickets/admin/overdue:
 *   get:
 *     summary: Get overdue tickets (Admin/Manager)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue tickets retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
    '/admin/overdue',
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.PROJECT_MANAGER),
    getOverdueTickets
);

/**
 * @swagger
 * /api/v1/tickets/my:
 *   get:
 *     summary: Get my tickets (assigned to me or created by me)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: Tickets retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my', getMyTickets);

/**
 * @swagger
 * /api/v1/tickets:
 *   get:
 *     summary: Get all tickets (filtered by role)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by ticket type
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
 *         description: Tickets retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', getAllTickets);

/**
 * @swagger
 * /api/v1/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
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
 *         description: Ticket retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', validateObjectId('id'), getTicketById);

/**
 * @swagger
 * /api/v1/tickets/{id}/history:
 *   get:
 *     summary: Get ticket history
 *     tags: [Tickets]
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
 *         description: History retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/history', validateObjectId('id'), getTicketHistory);

/**
 * @swagger
 * /api/v1/tickets:
 *   post:
 *     summary: Create a new ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - title
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [NEW_PROJECT, BUG_FIX, MODIFICATION, CONTENT_UPDATE, REDESIGN, SUPPORT]
 *                 example: BUG_FIX
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: Fix navigation menu on mobile
 *               description:
 *                 type: string
 *                 example: The navigation menu is not responsive on mobile devices
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *               category:
 *                 type: string
 *                 enum: [FRONTEND, BACKEND, DESIGN, CONTENT, INFRASTRUCTURE, OTHER]
 *               project:
 *                 type: string
 *                 description: Project ID
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
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

/**
 * @swagger
 * /api/v1/tickets/{id}:
 *   put:
 *     summary: Update a ticket
 *     tags: [Tickets]
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
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
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

/**
 * @swagger
 * /api/v1/tickets/{id}/status:
 *   put:
 *     summary: Change ticket status
 *     tags: [Tickets]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_PROGRESS, IN_REVIEW, BLOCKED, RESOLVED, CLOSED, CANCELLED]
 *                 example: IN_PROGRESS
 *               comment:
 *                 type: string
 *                 description: Optional comment about status change
 *     responses:
 *       200:
 *         description: Status changed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
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

/**
 * @swagger
 * /api/v1/tickets/{id}/assign:
 *   post:
 *     summary: Assign ticket to a worker (Manager/Admin only)
 *     tags: [Tickets]
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
 *               - workerId
 *             properties:
 *               workerId:
 *                 type: string
 *                 description: Worker user ID
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
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

/**
 * @swagger
 * /api/v1/tickets/{id}/comments:
 *   post:
 *     summary: Add a comment to a ticket
 *     tags: [Tickets]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *                 example: I've started working on this issue
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
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

/**
 * @swagger
 * /api/v1/tickets/{id}/time:
 *   post:
 *     summary: Track time spent on ticket (Worker/Manager only)
 *     tags: [Tickets]
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
 *               - duration
 *             properties:
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *                 description: Time in minutes
 *                 example: 120
 *               description:
 *                 type: string
 *                 example: Fixed navigation menu responsive issues
 *     responses:
 *       200:
 *         description: Time tracked successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
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

/**
 * @swagger
 * /api/v1/tickets/{id}:
 *   delete:
 *     summary: Delete a ticket (Admin only)
 *     tags: [Tickets]
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
 *         description: Ticket deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
    '/:id',
    authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
    validateObjectId('id'),
    deleteTicket
);

export default router;