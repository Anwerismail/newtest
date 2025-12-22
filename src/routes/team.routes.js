import express from 'express';
import * as teamController from '../controllers/team.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get manager's primary team
router.get('/my-team', teamController.getMyTeam);

// Assign worker to manager's team (admin only)
router.post('/assign', teamController.assignWorkerToTeam);

// Remove worker from team (admin only)
router.post('/remove', teamController.removeWorkerFromTeam);

// Get available workers (not assigned to any team)
router.get('/available-workers', teamController.getAvailableWorkers);

export default router;
