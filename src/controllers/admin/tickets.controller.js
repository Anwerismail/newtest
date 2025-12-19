import Ticket from '../../models/Ticket.model.js';
import { HTTP_STATUS, ERROR_MESSAGES, TICKET_STATUS } from '../../utils/constants.js';

/**
 * @desc    Récupérer les statistiques des tickets
 * @route   GET /api/v1/admin/tickets/stats
 * @access  Private (ADMIN, SUPER_ADMIN, PROJECT_MANAGER)
 */
export const getTicketStats = async (req, res) => {
    try {
        const [
            totalTickets,
            ticketsByStatus,
            ticketsByType,
            ticketsByPriority,
            averageResolutionTime,
            averageResponseTime,
            ticketsThisMonth,
            completedThisMonth,
            overdueTickets
        ] = await Promise.all([
            // Total tickets
            Ticket.countDocuments(),

            // Par statut
            Ticket.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),

            // Par type
            Ticket.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]),

            // Par priorité
            Ticket.aggregate([
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ]),

            // Temps de résolution moyen
            Ticket.aggregate([
                { $match: { 'metrics.resolutionTime': { $exists: true } } },
                { $group: { _id: null, avg: { $avg: '$metrics.resolutionTime' } } }
            ]),

            // Temps de réponse moyen
            Ticket.aggregate([
                { $match: { 'metrics.responseTime': { $exists: true } } },
                { $group: { _id: null, avg: { $avg: '$metrics.responseTime' } } }
            ]),

            // Tickets ce mois
            Ticket.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }),

            // Complétés ce mois
            Ticket.countDocuments({
                completedDate: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                }
            }),

            // En retard
            Ticket.countDocuments({
                dueDate: { $lt: new Date() },
                status: { $nin: ['COMPLETED', 'DEPLOYED', 'CLOSED', 'CANCELLED'] }
            })
        ]);

        res.json({
            success: true,
            data: {
                totalTickets,
                ticketsThisMonth,
                completedThisMonth,
                overdueTickets,
                averageResolutionTime: averageResolutionTime[0]?.avg || 0,
                averageResponseTime: averageResponseTime[0]?.avg || 0,
                byStatus: ticketsByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byType: ticketsByType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byPriority: ticketsByPriority.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Get ticket stats error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer le board Kanban
 * @route   GET /api/v1/admin/tickets/board
 * @access  Private (ADMIN, SUPER_ADMIN, PROJECT_MANAGER)
 */
export const getKanbanBoard = async (req, res) => {
    try {
        const { type, priority } = req.query;

        const query = {
            status: { $nin: ['CLOSED', 'CANCELLED'] }
        };

        if (type) query.type = type;
        if (priority) query.priority = priority;

        // Grouper par statut
        const board = {
            backlog: [],
            todo: [],
            inProgress: [],
            review: [],
            done: []
        };

        const tickets = await Ticket.find(query)
            .populate('assignedTo', 'profile email')
            .populate('reporter', 'profile email')
            .sort({ priority: 1, createdAt: -1 });

        // Répartir dans les colonnes
        tickets.forEach(ticket => {
            if (ticket.status === 'PENDING') {
                board.backlog.push(ticket);
            } else if (ticket.status === 'ASSIGNED') {
                board.todo.push(ticket);
            } else if (['IN_PROGRESS', 'WAITING'].includes(ticket.status)) {
                board.inProgress.push(ticket);
            } else if (['REVIEW', 'TESTING'].includes(ticket.status)) {
                board.review.push(ticket);
            } else if (['COMPLETED', 'DEPLOYED'].includes(ticket.status)) {
                board.done.push(ticket);
            }
        });

        res.json({
            success: true,
            data: {
                board,
                counts: {
                    backlog: board.backlog.length,
                    todo: board.todo.length,
                    inProgress: board.inProgress.length,
                    review: board.review.length,
                    done: board.done.length
                }
            }
        });

    } catch (error) {
        console.error('Get kanban board error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer les métriques de performance
 * @route   GET /api/v1/admin/tickets/metrics
 * @access  Private (ADMIN, SUPER_ADMIN, PROJECT_MANAGER)
 */
export const getTicketMetrics = async (req, res) => {
    try {
        const { period = '30' } = req.query; // Période en jours

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        const [
            ticketsCreated,
            ticketsCompleted,
            ticketsByWorker,
            averageTimeByType,
            completionRate
        ] = await Promise.all([
            // Tickets créés par jour
            Ticket.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
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
            ]),

            // Tickets complétés par jour
            Ticket.aggregate([
                {
                    $match: {
                        completedDate: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$completedDate' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Tickets par worker
            Ticket.aggregate([
                {
                    $match: {
                        assignedTo: { $exists: true },
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: '$assignedTo',
                        total: { $sum: 1 },
                        completed: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['COMPLETED', 'DEPLOYED']] },
                                    1,
                                    0
                                ]
                            }
                        },
                        averageTime: { $avg: '$metrics.resolutionTime' }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'worker'
                    }
                },
                { $unwind: '$worker' }
            ]),

            // Temps moyen par type
            Ticket.aggregate([
                {
                    $match: {
                        'metrics.resolutionTime': { $exists: true },
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        averageTime: { $avg: '$metrics.resolutionTime' },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Taux de complétion
            Ticket.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        completed: {
                            $sum: {
                                $cond: [
                                    { $in: ['$status', ['COMPLETED', 'DEPLOYED']] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ])
        ]);

        const completionRateValue = completionRate[0]
            ? (completionRate[0].completed / completionRate[0].total) * 100
            : 0;

        res.json({
            success: true,
            data: {
                ticketsCreated,
                ticketsCompleted,
                ticketsByWorker: ticketsByWorker.map(item => ({
                    worker: {
                        id: item.worker._id,
                        name: `${item.worker.profile.firstName} ${item.worker.profile.lastName}`
                    },
                    total: item.total,
                    completed: item.completed,
                    averageTime: Math.round(item.averageTime || 0)
                })),
                averageTimeByType: averageTimeByType.map(item => ({
                    type: item._id,
                    averageTime: Math.round(item.averageTime),
                    count: item.count
                })),
                completionRate: Math.round(completionRateValue)
            }
        });

    } catch (error) {
        console.error('Get ticket metrics error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer les tickets en retard
 * @route   GET /api/v1/admin/tickets/overdue
 * @access  Private (ADMIN, SUPER_ADMIN, PROJECT_MANAGER)
 */
export const getOverdueTickets = async (req, res) => {
    try {
        const tickets = await Ticket.find({
            dueDate: { $lt: new Date() },
            status: { $nin: ['COMPLETED', 'DEPLOYED', 'CLOSED', 'CANCELLED'] }
        })
            .populate('assignedTo', 'profile email')
            .populate('reporter', 'profile email')
            .populate('project', 'name')
            .sort({ dueDate: 1 });

        res.json({
            success: true,
            data: {
                tickets,
                count: tickets.length
            }
        });

    } catch (error) {
        console.error('Get overdue tickets error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};