import Ticket from '../models/Ticket.model.js';
import User from '../models/User.model.js';
import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from '../utils/constants.js';
import { logInfo, logError, logBusiness } from '../services/logger.service.js';
import { sendTicketAssignedEmail } from '../services/email.service.js';

/**
 * @desc    Récupérer tous les tickets (selon rôle)
 * @route   GET /api/v1/tickets
 * @access  Private
 */
export const getAllTickets = async (req, res) => {
    try {
        const {
            type,
            status,
            priority,
            category,
            assignedTo,
            search,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Construction de la query selon le rôle
        const query = {};

        // CLIENT : voit uniquement ses tickets
        if (req.user.role === ROLES.CLIENT) {
            query.reporter = req.user._id;
        }

        // WORKER : voit ses tickets assignés + tous les tickets (lecture seule)
        // (On filtrera dans la logique métier si besoin)

        // Filtres
        if (type) query.type = type;
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (assignedTo) query.assignedTo = assignedTo;

        // Recherche textuelle
        if (search) {
            query.$text = { $search: search };
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sortOrder = order === 'desc' ? -1 : 1;

        // Exécuter la requête
        const [tickets, total] = await Promise.all([
            Ticket.find(query)
                .populate('reporter', 'profile.firstName profile.lastName email')
                .populate('assignedTo', 'profile.firstName profile.lastName email workerProfile')
                .populate('assignedBy', 'profile.firstName profile.lastName')
                .populate('project', 'name slug')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit)),
            Ticket.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                tickets,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer les tickets de l'utilisateur connecté
 * @route   GET /api/v1/tickets/my
 * @access  Private
 */
export const getMyTickets = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};

        // CLIENT : ses tickets créés
        if (req.user.role === ROLES.CLIENT) {
            query.reporter = req.user._id;
        }

        // WORKER : ses tickets assignés
        else if (req.user.role === ROLES.WORKER) {
            query.assignedTo = req.user._id;
        }

        // MANAGER : tickets dont il est responsable
        else if (req.user.role === ROLES.PROJECT_MANAGER) {
            query.$or = [
                { assignedBy: req.user._id },
                { reporter: req.user._id }
            ];
        }

        if (status) query.status = status;

        const skip = (page - 1) * limit;

        const [tickets, total] = await Promise.all([
            Ticket.find(query)
                .populate('reporter', 'profile email')
                .populate('assignedTo', 'profile email')
                .populate('project', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Ticket.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                tickets,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get my tickets error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer un ticket par ID
 * @route   GET /api/v1/tickets/:id
 * @access  Private
 */
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('reporter', 'profile email')
            .populate('assignedTo', 'profile email workerProfile')
            .populate('assignedBy', 'profile email')
            .populate('watchers', 'profile email')
            .populate('project', 'name slug')
            .populate('comments.author', 'profile email')
            .populate('timeTracking.worker', 'profile email')
            .populate('workflow.changedBy', 'profile email')
            .populate('details.templateId', 'name slug preview');

        if (!ticket) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Ticket non trouvé'
            });
        }

        // Vérifier les permissions
        // CLIENT peut voir uniquement ses tickets
        if (req.user.role === ROLES.CLIENT) {
            if (ticket.reporter.toString() !== req.user._id.toString()) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Accès non autorisé à ce ticket'
                });
            }
        }

        res.json({
            success: true,
            data: { ticket }
        });

    } catch (error) {
        console.error('Get ticket by ID error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Créer un nouveau ticket
 * @route   POST /api/v1/tickets
 * @access  Private
 */
export const createTicket = async (req, res) => {
    try {
        const {
            type,
            category,
            priority,
            urgency,
            title,
            description,
            details,
            dueDate,
            tags,
            projectId
        } = req.body;

        // Vérifier que le CLIENT ne peut créer que certains types
        if (req.user.role === ROLES.CLIENT) {
            const allowedTypes = ['NEW_PROJECT', 'SUPPORT', 'CONTENT_UPDATE'];
            if (!allowedTypes.includes(type)) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Vous ne pouvez créer que des tickets NEW_PROJECT, SUPPORT ou CONTENT_UPDATE'
                });
            }
        }

        // Créer le ticket
        const ticket = await Ticket.create({
            type,
            category,
            priority,
            urgency,
            title,
            description,
            details,
            dueDate,
            tags,
            project: projectId,
            reporter: req.user._id,
            status: 'PENDING'
        });

        // Ajouter l'entrée workflow initiale
        ticket.workflow.push({
            status: 'PENDING',
            changedBy: req.user._id,
            changedAt: new Date(),
            comment: 'Ticket créé'
        });

        await ticket.save();

        // Populate pour retourner les infos complètes
        await ticket.populate('reporter', 'profile email');

        logBusiness('Ticket created', {
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            type: ticket.type,
            priority: ticket.priority,
            reporterId: req.user._id,
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Ticket créé avec succès',
            data: { ticket }
        });

    } catch (error) {
        logError('Create ticket failed', error, {
            userId: req.user?._id,
            type: req.body.type,
        });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: error.message || ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Modifier un ticket
 * @route   PUT /api/v1/tickets/:id
 * @access  Private
 */
export const updateTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Ticket non trouvé'
            });
        }

        // Vérifier les permissions
        if (!ticket.canModify(req.user)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Vous ne pouvez pas modifier ce ticket'
            });
        }

        const {
            title,
            description,
            priority,
            urgency,
            category,
            dueDate,
            tags,
            details
        } = req.body;

        // Mettre à jour les champs
        if (title) ticket.title = title;
        if (description) ticket.description = description;
        if (priority) ticket.priority = priority;
        if (urgency) ticket.urgency = urgency;
        if (category) ticket.category = category;
        if (dueDate) ticket.dueDate = dueDate;
        if (tags) ticket.tags = tags;
        if (details) ticket.details = { ...ticket.details, ...details };

        await ticket.save();

        res.json({
            success: true,
            message: 'Ticket mis à jour',
            data: { ticket }
        });

    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Changer le statut d'un ticket
 * @route   PUT /api/v1/tickets/:id/status
 * @access  Private
 */
export const changeTicketStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Ticket non trouvé'
            });
        }

        // Vérifier les permissions
        if (!ticket.canModify(req.user)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Vous ne pouvez pas modifier ce ticket'
            });
        }

        await ticket.changeStatus(status, req.user._id, comment);

        await ticket.populate('reporter assignedTo assignedBy');

        res.json({
            success: true,
            message: 'Statut mis à jour',
            data: { ticket }
        });

    } catch (error) {
        console.error('Change ticket status error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Assigner un ticket à un worker
 * @route   POST /api/v1/tickets/:id/assign
 * @access  Private (PROJECT_MANAGER, ADMIN)
 */
export const assignTicket = async (req, res) => {
    try {
        const { workerId } = req.body;

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Ticket non trouvé'
            });
        }

        // Vérifier que le worker existe et est disponible
        const worker = await User.findById(workerId);

        if (!worker || worker.role !== ROLES.WORKER) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Worker invalide'
            });
        }

        await ticket.assignTo(workerId, req.user._id);

        await ticket.populate('reporter assignedTo assignedBy');

        // Log ticket assignment
        logBusiness('Ticket assigned', {
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            workerId: worker._id,
            workerName: worker.getFullName(),
            assignedBy: req.user._id,
        });

        // Send email notification to worker (non-blocking)
        sendTicketAssignedEmail(worker, ticket).catch(err => {
            logError('Failed to send ticket assignment email', err, {
                ticketId: ticket._id,
                workerId: worker._id,
            });
        });

        res.json({
            success: true,
            message: 'Ticket assigné avec succès',
            data: { ticket }
        });

    } catch (error) {
        logError('Assign ticket failed', error, {
            ticketId: req.params.id,
            workerId: req.body.workerId,
        });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Ajouter un commentaire
 * @route   POST /api/v1/tickets/:id/comments
 * @access  Private
 */
export const addComment = async (req, res) => {
    try {
        const { content, attachments } = req.body;

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Ticket non trouvé'
            });
        }

        // Vérifier l'accès
        if (req.user.role === ROLES.CLIENT) {
            if (ticket.reporter.toString() !== req.user._id.toString()) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Accès non autorisé'
                });
            }
        }

        await ticket.addComment(req.user._id, content, attachments);

        await ticket.populate('comments.author', 'profile email');

        logInfo('Comment added to ticket', {
            ticketId: ticket._id,
            ticketNumber: ticket.ticketNumber,
            authorId: req.user._id,
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Commentaire ajouté',
            data: {
                ticket,
                comment: ticket.comments[ticket.comments.length - 1]
            }
        });

    } catch (error) {
        logError('Add comment failed', error, {
            ticketId: req.params.id,
            userId: req.user?._id,
        });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Tracker le temps de travail
 * @route   POST /api/v1/tickets/:id/time
 * @access  Private (WORKER)
 */
export const trackTime = async (req, res) => {
    try {
        const { duration, description } = req.body;

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Ticket non trouvé'
            });
        }

        // Seul le worker assigné peut tracker son temps
        if (ticket.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Vous ne pouvez tracker le temps que sur vos tickets assignés'
            });
        }

        await ticket.trackTime(req.user._id, duration, description);

        const totalTime = ticket.getTotalTime();

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Temps enregistré',
            data: {
                timeEntry: ticket.timeTracking[ticket.timeTracking.length - 1],
                totalTime
            }
        });

    } catch (error) {
        console.error('Track time error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer l'historique d'un ticket
 * @route   GET /api/v1/tickets/:id/history
 * @access  Private
 */
export const getTicketHistory = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .select('workflow')
            .populate('workflow.changedBy', 'profile email');

        if (!ticket) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Ticket non trouvé'
            });
        }

        res.json({
            success: true,
            data: {
                history: ticket.workflow
            }
        });

    } catch (error) {
        console.error('Get ticket history error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Supprimer un ticket
 * @route   DELETE /api/v1/tickets/:id
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const deleteTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);

        if (!ticket) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Ticket non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Ticket supprimé avec succès'
        });

    } catch (error) {
        console.error('Delete ticket error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};