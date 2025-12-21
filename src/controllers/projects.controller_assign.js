import Project from '../models/Project.model.js';
import User from '../models/User.model.js';
import { logInfo, logBusiness } from '../services/logger.service.js';

/**
 * @desc    Assigner un worker au projet
 * @route   PUT /api/v1/projects/:id/assign-worker
 * @access  Private (ADMIN, PROJECT_MANAGER, Owner)
 */
export const assignWorker = async (req, res) => {
    try {
        const { workerId } = req.body;

        // Vérifier que le projet existe
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Vérifier permissions (Admin, Project Manager, ou Owner)
        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
        const isProjectManager = req.user.role === 'PROJECT_MANAGER';
        const isOwner = project.owner.toString() === req.user._id.toString();

        if (!isAdmin && !isProjectManager && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission d\'assigner un worker'
            });
        }

        // Si workerId fourni, vérifier que c'est un worker
        if (workerId) {
            const worker = await User.findById(workerId);
            if (!worker) {
                return res.status(404).json({
                    success: false,
                    message: 'Worker non trouvé'
                });
            }

            if (worker.role !== 'WORKER') {
                return res.status(400).json({
                    success: false,
                    message: 'L\'utilisateur doit avoir le rôle WORKER'
                });
            }

            // Vérifier disponibilité du worker
            if (worker.workerProfile?.availability?.status === 'OFFLINE') {
                return res.status(400).json({
                    success: false,
                    message: 'Ce worker n\'est pas disponible actuellement'
                });
            }
        }

        // Assigner le worker
        project.assignedWorker = workerId || null;
        project.assignedAt = workerId ? new Date() : null;
        project.assignedBy = workerId ? req.user._id : null;

        // Si on assigne un worker et le projet est PENDING, passer à IN_PROGRESS
        if (workerId && project.status === 'PENDING') {
            project.status = 'IN_PROGRESS';
        }

        await project.save();

        // Populate pour la réponse
        await project.populate([
            { path: 'owner', select: 'email profile' },
            { path: 'assignedWorker', select: 'email profile workerProfile.skills workerProfile.specialization' },
            { path: 'assignedBy', select: 'email profile' }
        ]);

        logBusiness('Worker assigned to project', {
            projectId: project._id,
            projectName: project.name,
            workerId: workerId,
            assignedBy: req.user._id
        });

        res.json({
            success: true,
            message: workerId ? 'Worker assigné avec succès' : 'Worker retiré avec succès',
            data: project
        });

    } catch (error) {
        console.error('Error assigning worker:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'assignation du worker',
            error: error.message
        });
    }
};

/**
 * @desc    Obtenir la liste des workers disponibles
 * @route   GET /api/v1/projects/available-workers
 * @access  Private (ADMIN, PROJECT_MANAGER, CLIENT)
 */
export const getAvailableWorkers = async (req, res) => {
    try {
        const { specialization, skills } = req.query;

        const filter = {
            role: 'WORKER',
            'workerProfile.availability.status': { $in: ['AVAILABLE', 'BUSY'] }
        };

        if (specialization) {
            filter['workerProfile.specialization'] = specialization;
        }

        if (skills) {
            const skillsArray = skills.split(',');
            filter['workerProfile.skills'] = { $in: skillsArray };
        }

        const workers = await User.find(filter)
            .select('email profile workerProfile')
            .sort({ 'workerProfile.availability.status': 1 }) // AVAILABLE first
            .lean();

        // Count assigned projects for each worker
        const workersWithStats = await Promise.all(workers.map(async (worker) => {
            // Count all active projects (not archived or completed/deployed)
            const activeProjects = await Project.countDocuments({
                assignedWorker: worker._id,
                status: { $nin: ['ARCHIVED', 'COMPLETED', 'DEPLOYED'] }
            });

            // Count total assigned projects (including completed)
            const totalProjects = await Project.countDocuments({
                assignedWorker: worker._id,
                status: { $ne: 'ARCHIVED' }
            });

            return {
                ...worker,
                stats: {
                    currentProjects: activeProjects,  // Projects in progress
                    totalProjects: totalProjects,     // All non-archived projects
                    availability: worker.workerProfile?.availability?.status || 'OFFLINE'
                }
            };
        }));

        res.json({
            success: true,
            data: workersWithStats,
            total: workersWithStats.length
        });

    } catch (error) {
        console.error('Error getting available workers:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des workers',
            error: error.message
        });
    }
};
