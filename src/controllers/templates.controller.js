import Template from '../models/Template.model.js';
import { HTTP_STATUS, ERROR_MESSAGES, TEMPLATE_CATEGORIES } from '../utils/constants.js';

/**
 * @desc    Récupérer tous les templates (avec filtres)
 * @route   GET /api/v1/templates
 * @access  Public
 */
export const getAllTemplates = async (req, res) => {
    try {
        const {
            category,
            type,
            complexity,
            search,
            tags,
            pricing, // 'free' ou 'premium'
            sortBy = 'metadata.downloads',
            order = 'desc',
            page = 1,
            limit = 12
        } = req.query;

        // Construction de la query
        const query = { status: 'published' };

        // Filtrer par catégorie
        if (category) {
            query.category = category;
        }

        // Filtrer par type
        if (type) {
            query.type = type;
        }

        // Filtrer par complexité
        if (complexity) {
            query.complexity = complexity;
        }

        // Filtrer par pricing
        if (pricing === 'free') {
            query['pricing.free'] = true;
        } else if (pricing === 'premium') {
            query['pricing.premium'] = true;
        }

        // Filtrer par tags
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }

        // Recherche textuelle
        if (search) {
            query.$text = { $search: search };
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sortOrder = order === 'desc' ? -1 : 1;

        // Exécuter la requête
        const [templates, total] = await Promise.all([
            Template.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-structure.html -structure.css -structure.js'), // Ne pas renvoyer le code complet
            Template.countDocuments(query)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                templates,
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
        console.error('Get all templates error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer un template par ID ou slug
 * @route   GET /api/v1/templates/:idOrSlug
 * @access  Public
 */
export const getTemplateById = async (req, res) => {
    try {
        const { idOrSlug } = req.params;

        // Chercher par ID ou slug
        const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
            ? { _id: idOrSlug }
            : { slug: idOrSlug };

        const template = await Template.findOne(query);

        if (!template) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Template non trouvé'
            });
        }

        // Vérifier l'accès (si premium et utilisateur non premium)
        if (req.user) {
            const hasAccess = template.isAccessibleBy(req.user);
            if (!hasAccess) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    message: 'Abonnement premium requis'
                });
            }
        } else if (template.visibility === 'premium') {
            // Non connecté et template premium
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Connexion requise pour accéder à ce template'
            });
        }

        res.json({
            success: true,
            data: { template }
        });

    } catch (error) {
        console.error('Get template by ID error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer les catégories avec compteurs
 * @route   GET /api/v1/templates/categories
 * @access  Public
 */
export const getCategories = async (req, res) => {
    try {
        const categories = await Template.aggregate([
            { $match: { status: 'published' } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    templates: { $push: '$$ROOT' }
                }
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    topTemplates: { $slice: ['$templates', 3] }
                }
            }
        ]);

        res.json({
            success: true,
            data: { categories }
        });

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer les templates populaires
 * @route   GET /api/v1/templates/popular
 * @access  Public
 */
export const getPopularTemplates = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;

        const templates = await Template.find({ status: 'published' })
            .sort({ 'metadata.downloads': -1, 'metadata.rating': -1 })
            .limit(limit)
            .select('-structure.html -structure.css -structure.js');

        res.json({
            success: true,
            data: { templates }
        });

    } catch (error) {
        console.error('Get popular templates error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer les templates recommandés
 * @route   GET /api/v1/templates/recommended
 * @access  Private
 */
export const getRecommendedTemplates = async (req, res) => {
    try {
        // TODO: Implémenter un système de recommandation basé sur l'historique
        // Pour l'instant, on retourne les mieux notés

        const templates = await Template.find({ status: 'published' })
            .sort({ 'metadata.rating': -1 })
            .limit(6)
            .select('-structure.html -structure.css -structure.js');

        res.json({
            success: true,
            data: { templates }
        });

    } catch (error) {
        console.error('Get recommended templates error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Cloner un template (pour créer un projet)
 * @route   POST /api/v1/templates/:id/clone
 * @access  Private
 */
export const cloneTemplate = async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Template non trouvé'
            });
        }

        // Vérifier l'accès
        const hasAccess = template.isAccessibleBy(req.user);
        if (!hasAccess) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Abonnement premium requis'
            });
        }

        // Incrémenter les téléchargements
        await template.incrementDownloads();

        // Retourner le template complet (avec le code)
        res.json({
            success: true,
            message: 'Template cloné avec succès',
            data: { template }
        });

    } catch (error) {
        console.error('Clone template error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Ajouter une review à un template
 * @route   POST /api/v1/templates/:id/review
 * @access  Private
 */
export const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Note invalide (1-5)'
            });
        }

        const template = await Template.findById(req.params.id);

        if (!template) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Template non trouvé'
            });
        }

        // Vérifier si l'utilisateur a déjà reviewé
        const existingReview = template.metadata.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        );

        if (existingReview) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Vous avez déjà noté ce template'
            });
        }

        await template.addReview(req.user._id, rating, comment);

        res.json({
            success: true,
            message: 'Review ajoutée avec succès',
            data: { template }
        });

    } catch (error) {
        console.error('Add review error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

// ========================================
// ROUTES ADMIN
// ========================================

/**
 * @desc    Créer un nouveau template
 * @route   POST /api/v1/admin/templates
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const createTemplate = async (req, res) => {
    try {
        const templateData = req.body;

        const template = await Template.create(templateData);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Template créé avec succès',
            data: { template }
        });

    } catch (error) {
        console.error('Create template error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: error.message || ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Modifier un template
 * @route   PUT /api/v1/admin/templates/:id
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const updateTemplate = async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!template) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Template non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Template mis à jour',
            data: { template }
        });

    } catch (error) {
        console.error('Update template error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Supprimer un template
 * @route   DELETE /api/v1/admin/templates/:id
 * @access  Private (SUPER_ADMIN)
 */
export const deleteTemplate = async (req, res) => {
    try {
        const template = await Template.findByIdAndDelete(req.params.id);

        if (!template) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Template non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Template supprimé avec succès'
        });

    } catch (error) {
        console.error('Delete template error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer les statistiques des templates
 * @route   GET /api/v1/admin/templates/stats
 * @access  Private (ADMIN, SUPER_ADMIN)
 */
export const getTemplateStats = async (req, res) => {
    try {
        const [
            totalTemplates,
            publishedTemplates,
            draftTemplates,
            totalDownloads,
            byCategory,
            topTemplates
        ] = await Promise.all([
            Template.countDocuments(),
            Template.countDocuments({ status: 'published' }),
            Template.countDocuments({ status: 'draft' }),
            Template.aggregate([
                { $group: { _id: null, total: { $sum: '$metadata.downloads' } } }
            ]),
            Template.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            Template.find({ status: 'published' })
                .sort({ 'metadata.downloads': -1 })
                .limit(5)
                .select('name metadata.downloads')
        ]);

        res.json({
            success: true,
            data: {
                totalTemplates,
                publishedTemplates,
                draftTemplates,
                totalDownloads: totalDownloads[0]?.total || 0,
                byCategory: byCategory.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                topTemplates
            }
        });

    } catch (error) {
        console.error('Get template stats error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};