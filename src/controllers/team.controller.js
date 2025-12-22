import User from '../models/User.model.js';
import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from '../utils/constants.js';
import { logInfo, logError, logBusiness } from '../services/logger.service.js';
import { sendEmail } from '../services/email.service.js';

/**
 * Get manager's primary team
 * GET /api/v1/team/my-team
 * ACCESS: PROJECT_MANAGER, ADMIN, SUPER_ADMIN
 */
export const getMyTeam = async (req, res) => {
    try {
        // Only managers and admins can access this
        if (req.user.role !== ROLES.PROJECT_MANAGER && 
            req.user.role !== ROLES.ADMIN && 
            req.user.role !== ROLES.SUPER_ADMIN) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        // Get all workers where this user is the primaryManager
        const teamMembers = await User.find({
            primaryManager: req.user._id,
            role: ROLES.WORKER
        })
        .select('-password')
        .sort({ 'profile.firstName': 1 });

        logInfo('Primary team retrieved', {
            managerId: req.user._id,
            teamSize: teamMembers.length
        });

        res.json({
            success: true,
            data: teamMembers,
            count: teamMembers.length
        });

    } catch (error) {
        logError('Get my team error', error, { userId: req.user._id });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * Assign worker to manager's primary team
 * POST /api/v1/team/assign
 * ACCESS: ADMIN, SUPER_ADMIN
 */
export const assignWorkerToTeam = async (req, res) => {
    try {
        const { workerId, managerId } = req.body;

        // Only admins can assign workers to teams
        if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Seuls les admins peuvent assigner des workers aux équipes'
            });
        }

        // Validate worker
        const worker = await User.findById(workerId);
        if (!worker) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Worker non trouvé'
            });
        }

        if (worker.role !== ROLES.WORKER) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Seuls les workers peuvent être assignés à une équipe'
            });
        }

        // Validate manager
        const manager = await User.findById(managerId);
        if (!manager) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Manager non trouvé'
            });
        }

        if (manager.role !== ROLES.PROJECT_MANAGER) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Seuls les PROJECT_MANAGER peuvent avoir une équipe'
            });
        }

        // Check if worker already has a primary manager
        if (worker.primaryManager && worker.primaryManager.toString() !== managerId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: `Ce worker est déjà dans l'équipe d'un autre manager`
            });
        }

        // Assign worker to manager's team
        worker.primaryManager = managerId;
        await worker.save();

        // Populate for response
        await worker.populate('primaryManager', 'profile email');

        logBusiness('Worker assigned to primary team', {
            workerId: worker._id,
            workerEmail: worker.email,
            managerId: manager._id,
            managerEmail: manager.email,
            assignedBy: req.user._id
        });

        // Send email notification to worker
        try {
            await sendEmail(
                worker.email,
                `Vous avez été assigné à l'équipe de ${manager.profile.firstName} ${manager.profile.lastName}`,
                `<p>Bonjour ${worker.profile.firstName},</p>
                <p>Vous avez été assigné à l'équipe principale de <strong>${manager.profile.firstName} ${manager.profile.lastName}</strong>.</p>
                <p>Votre manager sera votre point de contact principal pour vos projets et tâches.</p>
                <p>L'équipe Evolyte 💜</p>`,
                `Bonjour ${worker.profile.firstName},\n\nVous avez été assigné à l'équipe principale de ${manager.profile.firstName} ${manager.profile.lastName}.\n\nL'équipe Evolyte`
            );
        } catch (emailError) {
            logError('Failed to send team assignment email', emailError);
        }

        res.json({
            success: true,
            message: 'Worker assigné à l\'équipe avec succès',
            data: worker
        });

    } catch (error) {
        logError('Assign worker to team error', error, { userId: req.user._id });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * Remove worker from manager's primary team
 * POST /api/v1/team/remove
 * ACCESS: ADMIN, SUPER_ADMIN
 */
export const removeWorkerFromTeam = async (req, res) => {
    try {
        const { workerId } = req.body;

        // Only admins can remove workers from teams
        if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Seuls les admins peuvent retirer des workers des équipes'
            });
        }

        const worker = await User.findById(workerId);
        if (!worker) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Worker non trouvé'
            });
        }

        if (!worker.primaryManager) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Ce worker n\'est assigné à aucune équipe'
            });
        }

        const previousManager = worker.primaryManager;
        worker.primaryManager = null;
        await worker.save();

        logBusiness('Worker removed from primary team', {
            workerId: worker._id,
            workerEmail: worker.email,
            previousManager: previousManager,
            removedBy: req.user._id
        });

        res.json({
            success: true,
            message: 'Worker retiré de l\'équipe avec succès',
            data: worker
        });

    } catch (error) {
        logError('Remove worker from team error', error, { userId: req.user._id });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * Get all available workers (not assigned to any team)
 * GET /api/v1/team/available-workers
 * ACCESS: ADMIN, SUPER_ADMIN
 */
export const getAvailableWorkers = async (req, res) => {
    try {
        if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        const availableWorkers = await User.find({
            role: ROLES.WORKER,
            primaryManager: null
        })
        .select('-password')
        .sort({ 'profile.firstName': 1 });

        res.json({
            success: true,
            data: availableWorkers,
            count: availableWorkers.length
        });

    } catch (error) {
        logError('Get available workers error', error, { userId: req.user._id });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

export default {
    getMyTeam,
    assignWorkerToTeam,
    removeWorkerFromTeam,
    getAvailableWorkers
};
