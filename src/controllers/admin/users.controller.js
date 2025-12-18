import User from '../../models/User.model.js';
import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from '../../utils/constants.js';

/**
 * @desc    Récupérer tous les utilisateurs avec filtres
 * @route   GET /api/v1/admin/users
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const getAllUsers = async (req, res) => {
    try {
        const {
            role,
            status,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Construction de la query
        const query = {};

        // Filtrer par rôle
        if (role) {
            query.role = role;
        }

        // Filtrer par statut
        if (status) {
            query.status = status;
        }

        // Recherche par nom ou email
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sortOrder = order === 'desc' ? -1 : 1;

        // Exécuter la requête
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -twoFactorSecret -resetPasswordToken')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        // Calculer les métadonnées de pagination
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages,
                    hasNextPage,
                    hasPrevPage
                }
            }
        });

    } catch (error) {
        console.error('Get all users error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer un utilisateur par ID
 * @route   GET /api/v1/admin/users/:id
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -twoFactorSecret -resetPasswordToken');

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Créer un nouvel utilisateur (par admin)
 * @route   POST /api/v1/admin/users
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const createUser = async (req, res) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            role,
            phone,
            company,
            skills,
            specialization,
            level
        } = req.body;

        // Vérifier si l'email existe déjà
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: ERROR_MESSAGES.EMAIL_EXISTS
            });
        }

        // Vérifier les permissions
        // Seul SUPER_ADMIN peut créer d'autres SUPER_ADMIN
        if (role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Vous ne pouvez pas créer un Super Admin'
            });
        }

        // Créer l'utilisateur
        const user = await User.create({
            email,
            password,
            profile: {
                firstName,
                lastName,
                phone
            },
            role: role || ROLES.CLIENT,
            status: 'ACTIVE'
        });

        // Initialiser les profils selon le rôle
        if (role === ROLES.CLIENT) {
            user.clientProfile = {
                company,
                subscription: {
                    plan: 'FREE',
                    status: 'ACTIVE',
                    startDate: new Date(),
                    maxProjects: 1
                },
                stats: {
                    totalProjects: 0,
                    activeProjects: 0,
                    totalSpent: 0
                }
            };
        } else if (role === ROLES.WORKER) {
            user.workerProfile = {
                skills: skills || [],
                specialization,
                level,
                availability: {
                    status: 'AVAILABLE',
                    hoursPerWeek: 40,
                    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
                },
                stats: {
                    totalTickets: 0,
                    completedTickets: 0,
                    rating: 5
                }
            };
        }

        await user.save();

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: { user: user.toJSON() }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: error.message || ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Modifier un utilisateur
 * @route   PUT /api/v1/admin/users/:id
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const updateUser = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            phone,
            role,
            status,
            company,
            skills,
            specialization,
            level,
            subscriptionPlan
        } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Protection : ne peut pas modifier un SUPER_ADMIN si on n'est pas SUPER_ADMIN
        if (user.role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Vous ne pouvez pas modifier un Super Admin'
            });
        }

        // Protection : ne peut pas se désactiver soi-même
        if (user._id.toString() === req.user._id.toString() && status === 'INACTIVE') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Vous ne pouvez pas vous désactiver vous-même'
            });
        }

        // Mettre à jour les champs basiques
        if (firstName) user.profile.firstName = firstName;
        if (lastName) user.profile.lastName = lastName;
        if (phone !== undefined) user.profile.phone = phone;
        if (status) user.status = status;

        // Changer le rôle (avec précautions)
        if (role && role !== user.role) {
            // Seul SUPER_ADMIN peut assigner le rôle SUPER_ADMIN
            if (role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Vous ne pouvez pas assigner le rôle Super Admin'
                });
            }
            user.role = role;
        }

        // Mettre à jour profil CLIENT
        if (user.role === ROLES.CLIENT) {
            if (company) user.clientProfile.company = company;
            if (subscriptionPlan) user.clientProfile.subscription.plan = subscriptionPlan;
        }

        // Mettre à jour profil WORKER
        if (user.role === ROLES.WORKER) {
            if (skills) user.workerProfile.skills = skills;
            if (specialization) user.workerProfile.specialization = specialization;
            if (level) user.workerProfile.level = level;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Utilisateur mis à jour',
            data: { user: user.toJSON() }
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Supprimer un utilisateur (soft delete)
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (SUPER_ADMIN)
 */
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Protection : ne peut pas supprimer un SUPER_ADMIN
        if (user.role === ROLES.SUPER_ADMIN) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Vous ne pouvez pas supprimer un Super Admin'
            });
        }

        // Protection : ne peut pas se supprimer soi-même
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Vous ne pouvez pas vous supprimer vous-même'
            });
        }

        // Soft delete (marquer comme DELETED au lieu de supprimer)
        user.status = 'DELETED';
        await user.save();

        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer les statistiques des utilisateurs
 * @route   GET /api/v1/admin/users/stats
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const getUserStats = async (req, res) => {
    try {
        // Total utilisateurs par rôle
        const usersByRole = await User.aggregate([
            { $match: { status: { $ne: 'DELETED' } } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        // Total utilisateurs par statut
        const usersByStatus = await User.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Utilisateurs actifs (connectés dans les 7 derniers jours)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activeUsers = await User.countDocuments({
            lastActive: { $gte: sevenDaysAgo },
            status: 'ACTIVE'
        });

        // Nouveaux utilisateurs ce mois
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const newUsersThisMonth = await User.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        // Workers disponibles
        const availableWorkers = await User.countDocuments({
            role: ROLES.WORKER,
            'workerProfile.availability.status': 'AVAILABLE',
            status: 'ACTIVE'
        });

        // Total utilisateurs
        const totalUsers = await User.countDocuments({ status: { $ne: 'DELETED' } });

        res.json({
            success: true,
            data: {
                totalUsers,
                activeUsers,
                newUsersThisMonth,
                availableWorkers,
                byRole: usersByRole.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byStatus: usersByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer tous les workers disponibles
 * @route   GET /api/v1/admin/users/workers/available
 * @access  Private (PROJECT_MANAGER, ADMIN, SUPER_ADMIN)
 */
export const getAvailableWorkers = async (req, res) => {
    try {
        const workers = await User.find({
            role: ROLES.WORKER,
            status: 'ACTIVE',
            'workerProfile.availability.status': 'AVAILABLE'
        })
            .select('profile workerProfile')
            .sort({ 'workerProfile.stats.rating': -1 });

        res.json({
            success: true,
            data: { workers }
        });

    } catch (error) {
        console.error('Get available workers error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};