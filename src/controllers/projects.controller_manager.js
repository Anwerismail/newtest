import Project from '../models/Project.model.js';
import User from '../models/User.model.js';
import { logInfo, logBusiness, logError } from '../services/logger.service.js';
import { sendProjectAssignedEmail } from '../services/email.service.js';

/**
 * @desc    Assigner un project manager au projet
 * @route   PUT /api/v1/projects/:id/assign-manager
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const assignProjectManager = async (req, res) => {
    try {
        const { managerId } = req.body;

        // Vérifier que le projet existe
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Vérifier permissions (Admin seulement)
        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Seuls les admins peuvent assigner un project manager'
            });
        }

        // Si managerId fourni, vérifier que c'est un admin ou project manager
        if (managerId) {
            const manager = await User.findById(managerId);
            if (!manager) {
                return res.status(404).json({
                    success: false,
                    message: 'Manager non trouvé'
                });
            }

            if (manager.role !== 'ADMIN' && manager.role !== 'SUPER_ADMIN' && manager.role !== 'PROJECT_MANAGER') {
                return res.status(400).json({
                    success: false,
                    message: 'L\'utilisateur doit avoir le rôle ADMIN, SUPER_ADMIN ou PROJECT_MANAGER'
                });
            }
        }

        // Assigner le manager
        project.projectManager = managerId || null;
        project.managerAssignedAt = managerId ? new Date() : null;
        project.managerAssignedBy = managerId ? req.user._id : null;

        await project.save();

        // Populate pour la réponse
        await project.populate([
            { path: 'owner', select: 'email profile' },
            { path: 'projectManager', select: 'email profile role' },
            { path: 'managerAssignedBy', select: 'email profile' },
            { path: 'assignedWorker', select: 'email profile workerProfile' }
        ]);

        logBusiness('Project manager assigned', {
            projectId: project._id,
            projectName: project.name,
            managerId: managerId,
            assignedBy: req.user._id
        });

        // Send email notification to manager (non-blocking)
        if (managerId && project.projectManager) {
            const manager = await User.findById(managerId);
            if (manager) {
                sendProjectAssignedEmail(manager, project, 'PROJECT_MANAGER').catch(err => {
                    logError('Failed to send project assignment email to manager', err, {
                        projectId: project._id,
                        managerId: manager._id,
                    });
                });
            }
        }

        res.json({
            success: true,
            message: managerId ? 'Manager assigné avec succès' : 'Manager retiré avec succès',
            data: project
        });

    } catch (error) {
        console.error('Error assigning project manager:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'assignation du manager',
            error: error.message
        });
    }
};

/**
 * @desc    Obtenir la liste des managers disponibles
 * @route   GET /api/v1/projects/available-managers
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const getAvailableManagers = async (req, res) => {
    try {
        // Seuls les admins peuvent voir cette liste
        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        const filter = {
            role: { $in: ['ADMIN', 'SUPER_ADMIN', 'PROJECT_MANAGER'] }
        };

        const managers = await User.find(filter)
            .select('email profile role')
            .sort({ role: 1, 'profile.firstName': 1 })
            .lean();

        // Count managed projects for each manager
        const managersWithStats = await Promise.all(managers.map(async (manager) => {
            const managedProjects = await Project.countDocuments({
                projectManager: manager._id,
                status: { $nin: ['ARCHIVED', 'COMPLETED', 'DEPLOYED'] }
            });

            const totalProjects = await Project.countDocuments({
                projectManager: manager._id,
                status: { $ne: 'ARCHIVED' }
            });

            return {
                ...manager,
                stats: {
                    activeProjects: managedProjects,
                    totalProjects: totalProjects
                }
            };
        }));

        res.json({
            success: true,
            data: managersWithStats,
            total: managersWithStats.length
        });

    } catch (error) {
        console.error('Error getting available managers:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des managers',
            error: error.message
        });
    }
};
