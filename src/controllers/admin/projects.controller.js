import Project from '../../models/Project.model.js';
import User from '../../models/User.model.js';
import { PROJECT_STATUS, DEPLOYMENT_STATUS } from '../../utils/constants.js';

/**
 * @desc    Statistiques globales des projets
 * @route   GET /api/v1/projects/admin/stats
 * @access  Private (ADMIN+)
 */
export const getProjectStats = async (req, res) => {
    try {
        const { period = 30 } = req.query; // Période en jours

        const periodDate = new Date();
        periodDate.setDate(periodDate.getDate() - parseInt(period));

        // Statistiques globales
        const totalProjects = await Project.countDocuments();
        const projectsThisPeriod = await Project.countDocuments({
            createdAt: { $gte: periodDate }
        });

        const deployedProjects = await Project.countDocuments({
            'deployment.status': 'DEPLOYED'
        });

        const activeProjects = await Project.countDocuments({
            status: { $in: ['IN_PROGRESS', 'REVIEW', 'COMPLETED'] }
        });

        // Par statut
        const byStatus = await Project.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusCount = {};
        byStatus.forEach(item => {
            statusCount[item._id] = item.count;
        });

        // Par template
        const byTemplate = await Project.aggregate([
            {
                $lookup: {
                    from: 'templates',
                    localField: 'template',
                    foreignField: '_id',
                    as: 'templateInfo'
                }
            },
            { $unwind: '$templateInfo' },
            {
                $group: {
                    _id: '$templateInfo.name',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Déploiements récents
        const recentDeployments = await Project.countDocuments({
            'deployment.lastDeployment.deployedAt': { $gte: periodDate }
        });

        // Projets avec domaine personnalisé
        const customDomainProjects = await Project.countDocuments({
            'domain.customDomain.verified': true
        });

        // Statistiques de stockage (total des assets)
        const storageStats = await Project.aggregate([
            { $unwind: { path: '$content.assets', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: '$content.assets.size' },
                    totalAssets: { $sum: 1 }
                }
            }
        ]);

        // Top projets (par visites)
        const topProjects = await Project.find()
            .sort({ 'stats.totalVisits': -1 })
            .limit(10)
            .populate('owner', 'email profile')
            .populate('template', 'name category')
            .select('name stats.totalVisits stats.uniqueVisitors deployment.status createdAt');

        res.json({
            success: true,
            data: {
                overview: {
                    totalProjects,
                    projectsThisPeriod,
                    deployedProjects,
                    activeProjects,
                    customDomainProjects,
                    recentDeployments
                },
                byStatus: statusCount,
                topTemplates: byTemplate,
                storage: storageStats[0] || { totalSize: 0, totalAssets: 0 },
                topProjects
            }
        });

    } catch (error) {
        console.error('Error getting project stats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

/**
 * @desc    Liste tous les projets (Admin)
 * @route   GET /api/v1/projects/admin/all
 * @access  Private (ADMIN+)
 */
export const getAllProjects = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            search,
            owner,
            deploymentStatus,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const filter = {};

        if (status) filter.status = status;
        if (owner) filter.owner = owner;
        if (deploymentStatus) filter['deployment.status'] = deploymentStatus;
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'domain.subdomain': { $regex: search, $options: 'i' } },
                { 'domain.customDomain.domain': { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const sortOrder = order === 'desc' ? -1 : 1;

        const projects = await Project.find(filter)
            .populate('owner', 'email profile')
            .populate('template', 'name category type')
            .populate('initialTicket', 'ticketNumber type status')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Project.countDocuments(filter);

        // Enrichir avec URLs et progression
        const enrichedProjects = projects.map(project => ({
            ...project,
            url: project.domain?.customDomain?.verified 
                ? `https://${project.domain.customDomain.domain}`
                : project.domain?.subdomain 
                    ? `https://${project.domain.subdomain}.evolyte.app`
                    : null,
            progress: getProgressPercentage(project.status)
        }));

        res.json({
            success: true,
            data: {
                projects: enrichedProjects,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error getting all projects:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des projets',
            error: error.message
        });
    }
};

/**
 * @desc    Dashboard avec métriques détaillées
 * @route   GET /api/v1/projects/admin/dashboard
 * @access  Private (ADMIN+)
 */
export const getDashboard = async (req, res) => {
    try {
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Projets créés (7 et 30 derniers jours)
        const projectsLast7Days = await Project.countDocuments({
            createdAt: { $gte: last7Days }
        });

        const projectsLast30Days = await Project.countDocuments({
            createdAt: { $gte: last30Days }
        });

        // Déploiements (7 et 30 derniers jours)
        const deploymentsLast7Days = await Project.countDocuments({
            'deployment.lastDeployment.deployedAt': { $gte: last7Days }
        });

        const deploymentsLast30Days = await Project.countDocuments({
            'deployment.lastDeployment.deployedAt': { $gte: last30Days }
        });

        // Croissance par jour (7 derniers jours)
        const dailyGrowth = await Project.aggregate([
            {
                $match: {
                    createdAt: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Projets par utilisateur (top 10)
        const projectsByUser = await Project.aggregate([
            {
                $group: {
                    _id: '$owner',
                    projectCount: { $sum: 1 },
                    deployedCount: {
                        $sum: {
                            $cond: [
                                { $eq: ['$deployment.status', 'DEPLOYED'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { projectCount: -1 } },
            { $limit: 10 }
        ]);

        // Populate user info
        await User.populate(projectsByUser, {
            path: '_id',
            select: 'email profile'
        });

        // Taux de déploiement
        const totalProjects = await Project.countDocuments();
        const deployedCount = await Project.countDocuments({
            'deployment.status': 'DEPLOYED'
        });
        const deploymentRate = totalProjects > 0 
            ? ((deployedCount / totalProjects) * 100).toFixed(2)
            : 0;

        // Temps moyen de déploiement
        const avgBuildTime = await Project.aggregate([
            {
                $match: {
                    'deployment.lastDeployment.buildTime': { $exists: true, $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    avgTime: { $avg: '$deployment.lastDeployment.buildTime' }
                }
            }
        ]);

        // Projets nécessitant attention
        const needsAttention = await Project.find({
            $or: [
                { status: 'PENDING', createdAt: { $lt: last7Days } }, // Pending > 7 jours
                { 'deployment.status': 'FAILED' }, // Déploiement échoué
                { status: 'IN_PROGRESS', updatedAt: { $lt: last7Days } } // Pas d'update depuis 7j
            ]
        })
        .populate('owner', 'email profile')
        .populate('template', 'name')
        .limit(20);

        res.json({
            success: true,
            data: {
                metrics: {
                    projectsLast7Days,
                    projectsLast30Days,
                    deploymentsLast7Days,
                    deploymentsLast30Days,
                    deploymentRate: parseFloat(deploymentRate),
                    avgBuildTime: avgBuildTime[0]?.avgTime || 0
                },
                dailyGrowth,
                topUsers: projectsByUser,
                needsAttention
            }
        });

    } catch (error) {
        console.error('Error getting dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du dashboard',
            error: error.message
        });
    }
};

/**
 * @desc    Forcer un déploiement (Admin)
 * @route   POST /api/v1/projects/admin/:id/deploy
 * @access  Private (ADMIN+)
 */
export const forceDeployProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Admin peut forcer le déploiement
        project.deployment.status = 'DEPLOYING';
        project.deployment.lastDeployment = {
            deployedAt: new Date(),
            deployedBy: req.user._id,
            version: project.currentRevision,
            buildTime: 0
        };

        await project.save();

        res.json({
            success: true,
            message: 'Déploiement forcé démarré',
            data: {
                projectId: project._id,
                status: project.deployment.status
            }
        });

    } catch (error) {
        console.error('Error forcing deployment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du déploiement',
            error: error.message
        });
    }
};

/**
 * @desc    Mettre à jour un projet (Admin)
 * @route   PUT /api/v1/projects/admin/:id
 * @access  Private (ADMIN+)
 */
export const updateProjectAdmin = async (req, res) => {
    try {
        const updates = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        )
        .populate('owner', 'email profile')
        .populate('template', 'name category');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Projet mis à jour',
            data: { project }
        });

    } catch (error) {
        console.error('Error updating project (admin):', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour',
            error: error.message
        });
    }
};

/**
 * @desc    Supprimer définitivement un projet (Admin)
 * @route   DELETE /api/v1/projects/admin/:id
 * @access  Private (SUPER_ADMIN)
 */
export const deleteProjectPermanently = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Projet supprimé définitivement'
        });

    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression',
            error: error.message
        });
    }
};

// Helper
function getProgressPercentage(status) {
    const statusOrder = {
        'PENDING': 0,
        'IN_PROGRESS': 40,
        'REVIEW': 70,
        'COMPLETED': 90,
        'DEPLOYED': 100,
        'MAINTENANCE': 100,
        'ARCHIVED': 100
    };
    return statusOrder[status] || 0;
}
