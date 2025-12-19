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
    getProjectStats,
    getAllProjects,
    getDashboard,
    forceDeployProject,
    updateProjectAdmin,
    deleteProjectPermanently
} from '../controllers/admin/projects.controller.js';

const router = express.Router();

// ========================================
// Routes Publiques/Authentifiées
// ========================================

// CRUD de base
router.post('/', protect, createProject);
router.get('/my', protect, getMyProjects);
router.get('/:id', protect, validateObjectId('id'), getProjectById);
router.put('/:id', protect, validateObjectId('id'), updateProject);
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
// Domaine et Déploiement
// ========================================

router.put('/:id/domain', protect, validateObjectId('id'), configureDomain);
router.post('/:id/domain/verify', protect, validateObjectId('id'), verifyDomain);
router.post('/:id/deploy', protect, validateObjectId('id'), deploymentRateLimit, deployProject);
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
