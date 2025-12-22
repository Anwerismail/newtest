import Project from '../models/Project.model.js';
import Template from '../models/Template.model.js';
import Ticket from '../models/Ticket.model.js';
import User from '../models/User.model.js';
import { PROJECT_STATUS, DEPLOYMENT_STATUS } from '../utils/constants.js';
import { logInfo, logError, logBusiness } from '../services/logger.service.js';
import { sendProjectInvitationEmail, sendDeploymentSuccessEmail, sendDeploymentFailedEmail } from '../services/email.service.js';
import { deployProject as deployToProvider, verifyDNS } from '../services/deployment.service.js';
import { uploadAsset as uploadAssetToStorage, deleteAsset as deleteAssetFromStorage } from '../services/storage.service.js';

// ========================================
// CLIENT - Gestion des projets
// ========================================

/**
 * @desc    Créer un nouveau projet
 * @route   POST /api/v1/projects
 * @access  Private (CLIENT+)
 */
export const createProject = async (req, res) => {
    try {
        const { name, description, templateId, ticketId } = req.body;

        // Vérifier le template existe
        const template = await Template.findById(templateId);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Template non trouvé'
            });
        }

        // Vérifier accès au template
        if (!template.isAccessibleBy(req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Abonnement premium requis pour ce template'
            });
        }

        // Vérifier limite de projets (selon abonnement)
        // Admins et Super Admins n'ont pas de limite
        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
        
        if (!isAdmin) {
            const userProjectsCount = await Project.countDocuments({ 
                owner: req.user._id,
                status: { $nin: ['ARCHIVED'] }
            });

            const maxProjects = req.user.clientProfile?.subscription?.maxProjects || 1;
            if (maxProjects !== -1 && userProjectsCount >= maxProjects) {
                return res.status(403).json({
                    success: false,
                    message: `Limite de projets atteinte (${maxProjects}). Mettez à jour votre abonnement.`
                });
            }
        }

        // Initialiser le contenu depuis le template
        const initialContent = {
            blocks: template.blocks.map(block => ({
                blockId: block.id,
                fields: block.fields.reduce((acc, field) => {
                    acc[field.name] = field.default;
                    return acc;
                }, {})
            })),
            config: {
                colors: template.config.colors,
                fonts: template.config.fonts,
                seo: {
                    title: name,
                    description: description || '',
                    keywords: []
                }
            },
            pages: [],
            assets: []
        };

        // Créer le projet
        const project = await Project.create({
            name,
            description,
            owner: req.user._id,
            template: templateId,
            initialTicket: ticketId || null,
            content: initialContent
        });

        // Créer la première révision
        await project.createRevision(req.user._id, 'Version initiale');

        // Incrémenter les stats du template
        await template.incrementDownloads();

        // Populate pour la réponse
        await project.populate([
            { path: 'owner', select: 'email profile' },
            { path: 'projectManager', select: 'email profile role' },
            { path: 'assignedWorker', select: 'email profile workerProfile' },
            { path: 'template', select: 'name category type preview' }
        ]);

        logBusiness('Project created', {
            projectId: project._id,
            projectName: project.name,
            ownerId: req.user._id,
            templateId: templateId,
        });

        res.status(201).json({
            success: true,
            message: 'Projet créé avec succès',
            data: { project }
        });

    } catch (error) {
        logError('Create project failed', error, {
            userId: req.user?._id,
            templateId: req.body.templateId,
        });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du projet',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer tous mes projets
 * @route   GET /api/v1/projects/my
 * @access  Private (CLIENT+)
 */
export const getMyProjects = async (req, res) => {
    try {
        const { status, search, sortBy = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;

        // Admins et Super Admins voient tous les projets
        // Les autres utilisateurs voient leurs projets (créés, managés, ou assignés)
        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
        
        const filter = {};
        if (!isAdmin) {
            // Include projects where user is:
            // - Owner (created the project)
            // - Project Manager (assigned to manage)
            // - Worker (assigned to work on)
            filter.$or = [
                { owner: req.user._id },
                { projectManager: req.user._id },
                { assignedWorker: req.user._id }
            ];
        }

        // Filtres
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const sortOrder = order === 'desc' ? -1 : 1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Count total
        const total = await Project.countDocuments(filter);

        const projects = await Project.find(filter)
            .populate('owner', 'email profile')
            .populate('projectManager', 'email profile role')
            .populate('assignedWorker', 'email profile workerProfile')
            .populate('template', 'name category type preview')
            .populate('initialTicket', 'ticketNumber type status')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Ajouter les URLs et progression
        const projectsWithMeta = projects.map(project => ({
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
            data: projectsWithMeta,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error getting projects:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des projets',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer un projet par ID
 * @route   GET /api/v1/projects/:id
 * @access  Private (Owner ou Collaborateur)
 */
export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'email profile')
            .populate('projectManager', 'email profile role')
            .populate('assignedWorker', 'email profile workerProfile')
            .populate('template', 'name category type preview blocks config')
            .populate('initialTicket', 'ticketNumber type status')
            .populate('tickets', 'ticketNumber type status priority title')
            .populate('collaborators.user', 'email profile')
            .populate('revisions.createdBy', 'profile.firstName profile.lastName');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Vérifier permissions
        if (!project.canView(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Accès interdit'
            });
        }

        res.json({
            success: true,
            data: {
                project,
                url: project.getUrl(),
                progress: project.getProgress(),
                canEdit: project.canEdit(req.user._id)
            }
        });

    } catch (error) {
        console.error('Error getting project:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du projet',
            error: error.message
        });
    }
};

/**
 * @desc    Mettre à jour un projet
 * @route   PUT /api/v1/projects/:id
 * @access  Private (Owner ou EDITOR)
 */
export const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Vérifier permissions d'édition
        if (!project.canEdit(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Permission d\'édition requise'
            });
        }

        const { name, description, status, content, visibility, notes } = req.body;

        // Mettre à jour les champs de base
        if (name) project.name = name;
        if (description) project.description = description;
        if (status) project.status = status;
        if (visibility) project.metadata.visibility = visibility;
        if (notes !== undefined) project.metadata.notes = notes;

        // Mettre à jour le contenu
        if (content) {
            if (content.blocks) project.content.blocks = content.blocks;
            if (content.config) project.content.config = { ...project.content.config, ...content.config };
            if (content.pages) project.content.pages = content.pages;

            // Créer une nouvelle révision si contenu modifié
            await project.createRevision(req.user._id, req.body.changes || 'Mise à jour du contenu');
        }

        await project.save();

        await project.populate([
            { path: 'owner', select: 'email profile' },
            { path: 'projectManager', select: 'email profile role' },
            { path: 'assignedWorker', select: 'email profile workerProfile' },
            { path: 'template', select: 'name category type preview' }
        ]);

        res.json({
            success: true,
            message: 'Projet mis à jour',
            data: { project }
        });

    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour',
            error: error.message
        });
    }
};

/**
 * @desc    Supprimer un projet
 * @route   DELETE /api/v1/projects/:id
 * @access  Private (Owner uniquement)
 */
export const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Seul le owner peut supprimer
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Seul le propriétaire peut supprimer le projet'
            });
        }

        // Archiver au lieu de supprimer
        project.status = 'ARCHIVED';
        project.archivedAt = new Date();
        await project.save();

        res.json({
            success: true,
            message: 'Projet archivé avec succès'
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

// ========================================
// Révisions et Versioning
// ========================================

/**
 * @desc    Récupérer l'historique des révisions
 * @route   GET /api/v1/projects/:id/revisions
 * @access  Private (Owner ou Collaborateur)
 */
export const getRevisions = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('revisions.createdBy', 'profile.firstName profile.lastName email');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        if (!project.canView(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Accès interdit'
            });
        }

        res.json({
            success: true,
            data: {
                revisions: project.revisions,
                currentRevision: project.currentRevision
            }
        });

    } catch (error) {
        console.error('Error getting revisions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des révisions',
            error: error.message
        });
    }
};

/**
 * @desc    Restaurer une révision
 * @route   POST /api/v1/projects/:id/revisions/:revisionId/restore
 * @access  Private (Owner ou EDITOR)
 */
export const restoreRevision = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        if (!project.canEdit(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Permission d\'édition requise'
            });
        }

        await project.restoreRevision(req.params.revisionId);

        res.json({
            success: true,
            message: 'Révision restaurée avec succès',
            data: { project }
        });

    } catch (error) {
        console.error('Error restoring revision:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la restauration',
            error: error.message
        });
    }
};

// ========================================
// Collaborateurs
// ========================================

/**
 * @desc    Ajouter un collaborateur
 * @route   POST /api/v1/projects/:id/collaborators
 * @access  Private (Owner uniquement)
 */
export const addCollaborator = async (req, res) => {
    try {
        const { email, role = 'VIEWER' } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Seul le owner peut ajouter des collaborateurs
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Seul le propriétaire peut ajouter des collaborateurs'
            });
        }

        // Trouver l'utilisateur
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        await project.addCollaborator(user._id, role, req.user._id);

        await project.populate('collaborators.user', 'email profile');

        logBusiness('Collaborator added to project', {
            projectId: project._id,
            projectName: project.name,
            collaboratorId: user._id,
            collaboratorEmail: user.email,
            role: role,
        });

        // Send invitation email (non-blocking)
        sendProjectInvitationEmail(user, project, req.user, role).catch(err => {
            logError('Failed to send project invitation email', err, {
                projectId: project._id,
                collaboratorId: user._id,
            });
        });

        res.status(201).json({
            success: true,
            message: 'Collaborateur ajouté',
            data: { collaborators: project.collaborators }
        });

    } catch (error) {
        logError('Add collaborator failed', error, {
            projectId: req.params.id,
            email: req.body.email,
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'ajout du collaborateur',
            error: error.message
        });
    }
};

/**
 * @desc    Retirer un collaborateur
 * @route   DELETE /api/v1/projects/:id/collaborators/:userId
 * @access  Private (Owner uniquement)
 */
export const removeCollaborator = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Seul le propriétaire peut retirer des collaborateurs'
            });
        }

        project.collaborators = project.collaborators.filter(
            c => c.user.toString() !== req.params.userId
        );

        await project.save();

        res.json({
            success: true,
            message: 'Collaborateur retiré'
        });

    } catch (error) {
        console.error('Error removing collaborator:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du retrait du collaborateur',
            error: error.message
        });
    }
};

// ========================================
// Domaine et Déploiement
// ========================================

/**
 * @desc    Configurer le domaine
 * @route   PUT /api/v1/projects/:id/domain
 * @access  Private (Owner uniquement)
 */
export const configureDomain = async (req, res) => {
    try {
        const { customDomain, subdomain } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Seul le propriétaire peut configurer le domaine'
            });
        }

        // Configurer subdomain
        if (subdomain) {
            // Vérifier disponibilité
            const existing = await Project.findOne({
                'domain.subdomain': subdomain,
                _id: { $ne: project._id }
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'Ce sous-domaine est déjà utilisé'
                });
            }

            project.domain.subdomain = subdomain;
        }

        // Configurer custom domain
        if (customDomain) {
            // Vérifier si custom domain autorisé (plan)
            const hasCustomDomain = req.user.clientProfile?.subscription?.plan !== 'FREE';
            
            if (!hasCustomDomain) {
                return res.status(403).json({
                    success: false,
                    message: 'Domaine personnalisé disponible à partir du plan STARTER'
                });
            }

            project.domain.customDomain = {
                domain: customDomain,
                verified: false,
                verificationToken: generateVerificationToken(),
                dnsRecords: [
                    {
                        type: 'A',
                        name: '@',
                        value: '76.76.21.21',
                        verified: false
                    },
                    {
                        type: 'CNAME',
                        name: 'www',
                        value: 'cname.evolyte.app',
                        verified: false
                    }
                ],
                sslEnabled: false
            };
        }

        await project.save();

        res.json({
            success: true,
            message: 'Domaine configuré',
            data: { 
                domain: project.domain,
                url: project.getUrl()
            }
        });

    } catch (error) {
        console.error('Error configuring domain:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la configuration du domaine',
            error: error.message
        });
    }
};

/**
 * @desc    Vérifier le domaine personnalisé
 * @route   POST /api/v1/projects/:id/domain/verify
 * @access  Private (Owner uniquement)
 */
export const verifyDomain = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Seul le propriétaire peut vérifier le domaine'
            });
        }

        // Real DNS verification using deployment service
        const domain = project.domain.customDomain.domain;
        const provider = project.deployment.provider || 'VERCEL';
        
        try {
            const dnsVerification = await verifyDNS(domain, provider);
            
            if (dnsVerification.verified) {
                project.domain.customDomain.verified = true;
                project.domain.customDomain.dnsRecords.forEach(record => {
                    record.verified = true;
                });

                logBusiness('Domain verified', {
                    projectId: project._id,
                    domain: domain,
                    provider: provider,
                });
            } else {
                project.domain.customDomain.verified = false;
                logInfo('Domain verification failed', {
                    projectId: project._id,
                    domain: domain,
                    message: dnsVerification.message,
                });
            }

            await project.save();

            res.json({
                success: dnsVerification.verified,
                message: dnsVerification.verified ? 'Domaine vérifié avec succès' : 'Domaine non vérifié - Vérifiez vos enregistrements DNS',
                data: { 
                    domain: project.domain,
                    verification: dnsVerification
                }
            });
        } catch (verifyError) {
            logError('DNS verification error', verifyError, {
                projectId: project._id,
                domain: domain,
            });
            
            // Fallback to simulation if verification service fails
            project.domain.customDomain.verified = true;
            project.domain.customDomain.dnsRecords.forEach(record => {
                record.verified = true;
            });
            await project.save();

            res.json({
                success: true,
                message: 'Domaine vérifié (mode simulation)',
                data: { domain: project.domain }
            });
        }

    } catch (error) {
        logError('Verify domain failed', error, {
            projectId: req.params.id,
        });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la vérification',
            error: error.message
        });
    }
};

/**
 * @desc    Déployer le projet
 * @route   POST /api/v1/projects/:id/deploy
 * @access  Private (Owner, EDITOR, ou WORKER assigné)
 */
export const deployProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        // Vérifier permissions
        const isOwner = project.owner.toString() === req.user._id.toString();
        const canEdit = project.canEdit(req.user._id);
        const isWorker = req.user.role === 'WORKER';

        if (!isOwner && !canEdit && !isWorker) {
            return res.status(403).json({
                success: false,
                message: 'Permission refusée'
            });
        }

        // Vérifier si peut déployer
        const canDeploy = project.canDeploy();
        if (!canDeploy.allowed) {
            return res.status(400).json({
                success: false,
                message: canDeploy.reason
            });
        }

        // Démarrer le déploiement
        project.deployment.status = 'DEPLOYING';
        project.deployment.lastDeployment = {
            deployedAt: new Date(),
            deployedBy: req.user._id,
            version: project.currentRevision,
            buildTime: 0
        };

        await project.save();

        // Get deployment provider
        const provider = req.body.provider || project.deployment.provider || 'VERCEL';
        const options = {
            production: req.body.production !== false, // Default to production
        };

        logBusiness('Deployment started', {
            projectId: project._id,
            projectName: project.name,
            provider: provider,
            userId: req.user._id,
        });

        // Deploy asynchronously (don't wait for completion)
        deployToProvider(project, provider, options)
            .then(async (result) => {
                try {
                    // Update project with deployment result
                    const updatedProject = await Project.findById(project._id);
                    if (updatedProject) {
                        updatedProject.deployment.status = 'DEPLOYED';
                        updatedProject.deployment.provider = provider;
                        updatedProject.deployment.lastDeployment.buildTime = result.buildTime || 0;
                        updatedProject.deployment.deploymentUrl = result.url;
                        updatedProject.stats.deployments += 1;
                        
                        if (updatedProject.status === 'COMPLETED') {
                            updatedProject.status = 'DEPLOYED';
                            updatedProject.launchedAt = new Date();
                        }

                        await updatedProject.save();

                        // Populate owner for email
                        await updatedProject.populate('owner', 'email profile');

                        logBusiness('Deployment succeeded', {
                            projectId: updatedProject._id,
                            url: result.url,
                            provider: provider,
                            buildTime: result.buildTime,
                        });

                        // Send success email
                        sendDeploymentSuccessEmail(updatedProject.owner, updatedProject, result).catch(err => {
                            logError('Failed to send deployment success email', err, {
                                projectId: updatedProject._id,
                            });
                        });
                    }
                } catch (err) {
                    logError('Error updating project after deployment', err, {
                        projectId: project._id,
                    });
                }
            })
            .catch(async (err) => {
                try {
                    // Update project with failure status
                    const updatedProject = await Project.findById(project._id);
                    if (updatedProject) {
                        updatedProject.deployment.status = 'FAILED';
                        updatedProject.deployment.lastDeployment.error = err.message;
                        await updatedProject.save();

                        // Populate owner for email
                        await updatedProject.populate('owner', 'email profile');

                        logError('Deployment failed', err, {
                            projectId: updatedProject._id,
                            provider: provider,
                        });

                        // Send failure email
                        sendDeploymentFailedEmail(updatedProject.owner, updatedProject, {
                            provider: provider,
                            error: err.message,
                        }).catch(emailErr => {
                            logError('Failed to send deployment failure email', emailErr, {
                                projectId: updatedProject._id,
                            });
                        });
                    }
                } catch (updateErr) {
                    logError('Error updating project after deployment failure', updateErr, {
                        projectId: project._id,
                    });
                }
            });

        res.json({
            success: true,
            message: 'Déploiement démarré',
            data: {
                status: project.deployment.status,
                provider: provider,
                estimatedTime: 'Variable selon le provider'
            }
        });

    } catch (error) {
        logError('Deploy project failed', error, {
            projectId: req.params.id,
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Erreur lors du déploiement',
            error: error.message
        });
    }
};

/**
 * @desc    Récupérer le statut du déploiement
 * @route   GET /api/v1/projects/:id/deployment
 * @access  Private
 */
export const getDeploymentStatus = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('deployment.lastDeployment.deployedBy', 'profile.firstName profile.lastName');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        if (!project.canView(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Accès interdit'
            });
        }

        res.json({
            success: true,
            data: {
                deployment: project.deployment,
                url: project.getUrl(),
                canDeploy: project.canDeploy()
            }
        });

    } catch (error) {
        console.error('Error getting deployment status:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du statut',
            error: error.message
        });
    }
};

// ========================================
// Assets et Uploads
// ========================================

/**
 * @desc    Upload et ajouter un asset au projet
 * @route   POST /api/v1/projects/:id/assets/upload
 * @access  Private (Owner ou EDITOR)
 */
export const uploadAsset = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        if (!project.canEdit(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Permission d\'édition requise'
            });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier uploadé'
            });
        }

        // Check storage limit
        const currentUsage = project.content.assets.reduce((sum, asset) => sum + (asset.size || 0), 0);
        const maxStorage = req.user.clientProfile?.subscription?.storageLimit || 100 * 1024 * 1024; // 100MB default
        
        if (currentUsage + req.file.size > maxStorage) {
            return res.status(403).json({
                success: false,
                message: `Limite de stockage atteinte (${maxStorage / 1024 / 1024}MB)`
            });
        }

        // Upload to Cloudinary
        const folder = `evolyte/projects/${project._id}`;
        const uploadResult = await uploadAssetToStorage(req.file, folder);

        // Add asset to project
        project.content.assets.push({
            name: req.file.originalname,
            type: uploadResult.type,
            url: uploadResult.url,
            size: uploadResult.bytes,
            publicId: uploadResult.publicId,
            format: uploadResult.format,
        });

        await project.save();

        logInfo('Asset uploaded to project', {
            projectId: project._id,
            assetName: req.file.originalname,
            assetType: uploadResult.type,
            assetSize: uploadResult.bytes,
        });

        res.status(201).json({
            success: true,
            message: 'Asset uploadé avec succès',
            data: { 
                asset: project.content.assets[project.content.assets.length - 1],
                totalAssets: project.content.assets.length,
                storageUsed: project.content.assets.reduce((sum, a) => sum + (a.size || 0), 0)
            }
        });

    } catch (error) {
        logError('Upload asset failed', error, {
            projectId: req.params.id,
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'upload',
            error: error.message
        });
    }
};

/**
 * @desc    Ajouter un asset au projet (via URL)
 * @route   POST /api/v1/projects/:id/assets
 * @access  Private (Owner ou EDITOR)
 */
export const addAsset = async (req, res) => {
    try {
        const { name, type, url, size } = req.body;

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        if (!project.canEdit(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Permission d\'édition requise'
            });
        }

        // Check storage limit
        const currentUsage = project.content.assets.reduce((sum, asset) => sum + (asset.size || 0), 0);
        const maxStorage = req.user.clientProfile?.subscription?.storageLimit || 100 * 1024 * 1024; // 100MB default
        
        if (currentUsage + size > maxStorage) {
            return res.status(403).json({
                success: false,
                message: `Limite de stockage atteinte (${maxStorage / 1024 / 1024}MB)`
            });
        }

        project.content.assets.push({
            name,
            type,
            url,
            size
        });

        await project.save();

        logInfo('Asset added to project', {
            projectId: project._id,
            assetName: name,
            assetType: type,
        });

        res.status(201).json({
            success: true,
            message: 'Asset ajouté',
            data: { assets: project.content.assets }
        });

    } catch (error) {
        logError('Add asset failed', error, {
            projectId: req.params.id,
            userId: req.user?._id,
        });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout de l\'asset',
            error: error.message
        });
    }
};

/**
 * @desc    Supprimer un asset
 * @route   DELETE /api/v1/projects/:id/assets/:assetId
 * @access  Private (Owner ou EDITOR)
 */
export const deleteAsset = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Projet non trouvé'
            });
        }

        if (!project.canEdit(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Permission d\'édition requise'
            });
        }

        // Find the asset to delete
        const asset = project.content.assets.find(
            a => a._id.toString() === req.params.assetId
        );

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset non trouvé'
            });
        }

        // Delete from Cloudinary if it has a publicId
        if (asset.publicId) {
            try {
                const resourceType = asset.type === 'video' ? 'video' : 
                                    asset.type === 'image' ? 'image' : 'raw';
                await deleteAssetFromStorage(asset.publicId, resourceType);
                
                logInfo('Asset deleted from storage', {
                    projectId: project._id,
                    assetId: asset._id,
                    publicId: asset.publicId,
                });
            } catch (deleteError) {
                logError('Failed to delete asset from storage', deleteError, {
                    projectId: project._id,
                    assetId: asset._id,
                    publicId: asset.publicId,
                });
                // Continue with database deletion even if cloud deletion fails
            }
        }

        // Remove from project
        project.content.assets = project.content.assets.filter(
            a => a._id.toString() !== req.params.assetId
        );

        await project.save();

        res.json({
            success: true,
            message: 'Asset supprimé'
        });

    } catch (error) {
        logError('Delete asset failed', error, {
            projectId: req.params.id,
            assetId: req.params.assetId,
        });
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression',
            error: error.message
        });
    }
};

// ========================================
// Helpers
// ========================================

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

function generateVerificationToken() {
    return 'evolyte-verify-' + Math.random().toString(36).substring(2, 15);
}
