import express from 'express';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validateObjectId } from '../middlewares/validation.middleware.js';
import { upload } from '../services/storage.service.js';
import { uploadRateLimit, deploymentRateLimit } from '../middlewares/rateLimit.middleware.js';

// Controllers
import {
    createProject,
    getMyProjects,
    getProjectById,
    updateProject,
    deleteProject,
    getRevisions,
    restoreRevision,
    addCollaborator,
    removeCollaborator,
    configureDomain,
    verifyDomain,
    deployProject,
    getDeploymentStatus,
    uploadAsset,
    addAsset,
    deleteAsset
} from '../controllers/projects.controller.js';

import {
    assignWorker,
    getAvailableWorkers
} from '../controllers/projects.controller_assign.js';

import {
    assignProjectManager,
    getAvailableManagers
} from '../controllers/projects.controller_manager.js';

import {
    getProjectStats,
    getAllProjects,
    getDashboard,
    forceDeployProject,
    updateProjectAdmin,
    deleteProjectPermanently
} from '../controllers/admin/projects.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Awesome Website
 *               description:
 *                 type: string
 *               template:
 *                 type: string
 *                 description: Template ID to use
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', protect, createProject);

/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: Get all projects (accessible to user)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
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
 *         description: Projects retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', protect, getMyProjects);

/**
 * @swagger
 * /api/v1/projects/my:
 *   get:
 *     summary: Get my projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Projects retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my', protect, getMyProjects);

/**
 * @swagger
 * /api/v1/projects/available-managers:
 *   get:
 *     summary: Get available project managers
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Managers retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/available-managers', protect, getAvailableManagers);

/**
 * @swagger
 * /api/v1/projects/available-workers:
 *   get:
 *     summary: Get available workers
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *         description: Filter by specialization
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Filter by skills (comma-separated)
 *     responses:
 *       200:
 *         description: Workers retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/available-workers', protect, getAvailableWorkers);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
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
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', protect, validateObjectId('id'), getProjectById);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
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
 *                 enum: [DRAFT, IN_PROGRESS, REVIEW, COMPLETED, DEPLOYED, ARCHIVED]
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', protect, validateObjectId('id'), updateProject);

/**
 * @swagger
 * /api/v1/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
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
 *         description: Project deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', protect, validateObjectId('id'), deleteProject);

// ========================================
// Révisions et Versioning
// ========================================

router.get('/:id/revisions', protect, validateObjectId('id'), getRevisions);
router.post('/:id/revisions/:revisionId/restore', protect, validateObjectId('id'), restoreRevision);

// ========================================
// Collaborateurs
// ========================================

router.post('/:id/collaborators', protect, validateObjectId('id'), addCollaborator);
router.delete('/:id/collaborators/:userId', protect, validateObjectId('id'), validateObjectId('userId'), removeCollaborator);

// ========================================
// Worker Assignment
// ========================================

/**
 * @swagger
 * /api/v1/projects/{id}/assign-worker:
 *   put:
 *     summary: Assign a worker to the project
 *     tags: [Projects]
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
 *             properties:
 *               workerId:
 *                 type: string
 *                 description: Worker user ID (null to unassign)
 *     responses:
 *       200:
 *         description: Worker assigned successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/assign-worker', protect, validateObjectId('id'), assignWorker);

/**
 * @swagger
 * /api/v1/projects/{id}/assign-manager:
 *   put:
 *     summary: Assign a project manager to the project
 *     tags: [Projects]
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
 *             properties:
 *               managerId:
 *                 type: string
 *                 description: Manager user ID (null to unassign)
 *     responses:
 *       200:
 *         description: Manager assigned successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id/assign-manager', protect, validateObjectId('id'), assignProjectManager);

/**
 * @swagger
 * /api/v1/projects/{id}/domain:
 *   put:
 *     summary: Configure custom domain
 *     tags: [Projects]
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
 *             properties:
 *               domain:
 *                 type: string
 *                 example: mywebsite.com
 *     responses:
 *       200:
 *         description: Domain configured successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id/domain', protect, validateObjectId('id'), configureDomain);

/**
 * @swagger
 * /api/v1/projects/{id}/domain/verify:
 *   post:
 *     summary: Verify custom domain
 *     tags: [Projects]
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
 *         description: Domain verified successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/:id/domain/verify', protect, validateObjectId('id'), verifyDomain);

/**
 * @swagger
 * /api/v1/projects/{id}/deploy:
 *   post:
 *     summary: Deploy project to production
 *     tags: [Projects]
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
 *               provider:
 *                 type: string
 *                 enum: [VERCEL, NETLIFY]
 *                 default: VERCEL
 *     responses:
 *       200:
 *         description: Deployment started successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/:id/deploy', protect, validateObjectId('id'), deploymentRateLimit, deployProject);

/**
 * @swagger
 * /api/v1/projects/{id}/deployment:
 *   get:
 *     summary: Get deployment status
 *     tags: [Projects]
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
 *         description: Deployment status retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id/deployment', protect, validateObjectId('id'), getDeploymentStatus);

// ========================================
// Assets
// ========================================

router.post('/:id/assets/upload', protect, validateObjectId('id'), uploadRateLimit, upload.single('file'), uploadAsset);
router.post('/:id/assets', protect, validateObjectId('id'), addAsset);
router.delete('/:id/assets/:assetId', protect, validateObjectId('id'), deleteAsset);

// ========================================
// Routes Admin
// ========================================

router.get('/admin/stats', protect, authorize('ADMIN', 'SUPER_ADMIN'), getProjectStats);
router.get('/admin/dashboard', protect, authorize('ADMIN', 'SUPER_ADMIN'), getDashboard);
router.get('/admin/all', protect, authorize('ADMIN', 'SUPER_ADMIN'), getAllProjects);
router.post('/admin/:id/deploy', protect, authorize('ADMIN', 'SUPER_ADMIN'), validateObjectId('id'), forceDeployProject);
router.put('/admin/:id', protect, authorize('ADMIN', 'SUPER_ADMIN'), validateObjectId('id'), updateProjectAdmin);
router.delete('/admin/:id', protect, authorize('SUPER_ADMIN'), validateObjectId('id'), deleteProjectPermanently);

export default router;
