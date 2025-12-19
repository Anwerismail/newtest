import mongoose from 'mongoose';
import { PROJECT_STATUS, DEPLOYMENT_STATUS } from '../utils/constants.js';

const ProjectSchema = new mongoose.Schema({
    // Identification
    name: {
        type: String,
        required: [true, 'Nom du projet requis'],
        trim: true,
        maxlength: 100
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    description: {
        type: String,
        maxlength: 500
    },

    // Propriétaire
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Template utilisé
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },

    // Ticket initial (NEW_PROJECT)
    initialTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },

    // Statut du projet
    status: {
        type: String,
        enum: Object.values(PROJECT_STATUS),
        default: 'PENDING'
    },

    // Contenu personnalisé
    content: {
        // Données des blocs éditables
        blocks: [{
            blockId: String, // Correspond à template.blocks[].id
            fields: mongoose.Schema.Types.Mixed // Valeurs personnalisées
        }],

        // Configuration personnalisée
        config: {
            colors: {
                primary: String,
                secondary: String,
                accent: String,
                background: String,
                text: String
            },
            fonts: {
                heading: String,
                body: String
            },
            seo: {
                title: String,
                description: String,
                keywords: [String],
                ogImage: String
            }
        },

        // Pages supplémentaires (si applicable)
        pages: [{
            name: String,
            slug: String,
            title: String,
            content: mongoose.Schema.Types.Mixed,
            isPublished: {
                type: Boolean,
                default: false
            }
        }],

        // Assets personnalisés
        assets: [{
            name: String,
            type: {
                type: String,
                enum: ['image', 'video', 'document', 'font']
            },
            url: String,
            size: Number, // bytes
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }]
    },

    // Domaine et déploiement
    domain: {
        // Sous-domaine gratuit (ex: monsite.evolyte.app)
        subdomain: {
            type: String,
            lowercase: true,
            trim: true
        },

        // Domaine personnalisé
        customDomain: {
            domain: String, // ex: monsite.com
            verified: {
                type: Boolean,
                default: false
            },
            verificationToken: String,
            dnsRecords: [{
                type: {
                    type: String,
                    enum: ['A', 'CNAME', 'TXT']
                },
                name: String,
                value: String,
                verified: Boolean
            }],
            sslEnabled: {
                type: Boolean,
                default: false
            }
        },

        // URL de déploiement
        deploymentUrl: String
    },

    // Déploiement
    deployment: {
        status: {
            type: String,
            enum: Object.values(DEPLOYMENT_STATUS),
            default: 'NOT_DEPLOYED'
        },

        provider: {
            type: String,
            enum: ['vercel', 'netlify', 'aws', 'internal', null],
            default: null
        },

        lastDeployment: {
            deployedAt: Date,
            deployedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            version: String,
            buildTime: Number, // milliseconds
            buildLogs: String,
            error: String
        },

        autoDeployEnabled: {
            type: Boolean,
            default: false
        },

        // Variables d'environnement (pour templates avancés)
        envVariables: [{
            key: String,
            value: String,
            encrypted: {
                type: Boolean,
                default: true
            }
        }]
    },

    // Versioning et révisions
    revisions: [{
        version: String, // Ex: 1.0, 1.1, 2.0
        createdAt: {
            type: Date,
            default: Date.now
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changes: String, // Description des changements
        snapshot: mongoose.Schema.Types.Mixed, // Sauvegarde complète du contenu
        isActive: {
            type: Boolean,
            default: false
        }
    }],

    currentRevision: {
        type: String,
        default: '1.0'
    },

    // Collaborateurs (qui peut éditer)
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['EDITOR', 'VIEWER'],
            default: 'VIEWER'
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    // Tickets associés au projet
    tickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],

    // Statistiques
    stats: {
        totalVisits: {
            type: Number,
            default: 0
        },
        uniqueVisitors: {
            type: Number,
            default: 0
        },
        lastVisit: Date,
        totalEdits: {
            type: Number,
            default: 0
        },
        deployments: {
            type: Number,
            default: 0
        }
    },

    // Analytics (si activé)
    analytics: {
        enabled: {
            type: Boolean,
            default: false
        },
        provider: {
            type: String,
            enum: ['google', 'plausible', 'internal', null],
            default: null
        },
        trackingId: String
    },

    // SEO et indexation
    seo: {
        indexed: {
            type: Boolean,
            default: true
        },
        sitemap: {
            enabled: {
                type: Boolean,
                default: true
            },
            lastGenerated: Date
        },
        robotsTxt: String
    },

    // Métadonnées
    metadata: {
        visibility: {
            type: String,
            enum: ['public', 'private', 'password_protected'],
            default: 'public'
        },
        password: String, // Pour password_protected
        
        estimatedCompletionDate: Date,
        actualCompletionDate: Date,

        tags: [String],

        // Budget et coûts
        budget: {
            estimated: Number,
            actual: Number,
            currency: {
                type: String,
                default: 'EUR'
            }
        },

        // Notes internes
        notes: String
    },

    // Dates importantes
    launchedAt: Date,
    archivedAt: Date

}, {
    timestamps: true
});

// Index pour recherche et performance
ProjectSchema.index({ name: 'text', description: 'text' });
ProjectSchema.index({ owner: 1, status: 1 });
ProjectSchema.index({ slug: 1 });
ProjectSchema.index({ 'domain.subdomain': 1 });
ProjectSchema.index({ 'domain.customDomain.domain': 1 });
ProjectSchema.index({ status: 1, createdAt: -1 });

// Générer le slug avant sauvegarde
ProjectSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        // Générer slug unique
        const baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        this.slug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    // Générer subdomain si pas encore défini
    if (!this.domain.subdomain && this.slug) {
        this.domain.subdomain = this.slug;
    }

    next();
});

// Méthode pour créer une nouvelle révision
ProjectSchema.methods.createRevision = async function(userId, changes) {
    const version = this.revisions.length + 1;
    
    // Désactiver l'ancienne révision active
    this.revisions.forEach(rev => rev.isActive = false);

    // Créer snapshot du contenu actuel
    const snapshot = {
        content: this.content,
        config: this.content.config,
        blocks: this.content.blocks
    };

    this.revisions.push({
        version: `${Math.floor(version / 10)}.${version % 10}`,
        createdBy: userId,
        changes,
        snapshot,
        isActive: true
    });

    this.currentRevision = `${Math.floor(version / 10)}.${version % 10}`;
    this.stats.totalEdits += 1;

    await this.save();
    return this.revisions[this.revisions.length - 1];
};

// Méthode pour restaurer une révision
ProjectSchema.methods.restoreRevision = async function(revisionId) {
    const revision = this.revisions.id(revisionId);
    if (!revision) {
        throw new Error('Révision non trouvée');
    }

    // Restaurer le contenu
    this.content = revision.snapshot.content;
    this.content.config = revision.snapshot.config;
    this.content.blocks = revision.snapshot.blocks;

    // Marquer comme active
    this.revisions.forEach(rev => rev.isActive = false);
    revision.isActive = true;
    this.currentRevision = revision.version;

    await this.save();
};

// Méthode pour vérifier les permissions
ProjectSchema.methods.canEdit = function(userId) {
    // Owner peut toujours éditer
    if (this.owner.toString() === userId.toString()) {
        return true;
    }

    // Vérifier les collaborateurs
    const collaborator = this.collaborators.find(
        c => c.user.toString() === userId.toString()
    );

    return collaborator && collaborator.role === 'EDITOR';
};

// Méthode pour vérifier les permissions de lecture
ProjectSchema.methods.canView = function(userId) {
    // Public
    if (this.metadata.visibility === 'public') {
        return true;
    }

    // Owner peut toujours voir
    if (this.owner.toString() === userId.toString()) {
        return true;
    }

    // Collaborateurs peuvent voir
    return this.collaborators.some(
        c => c.user.toString() === userId.toString()
    );
};

// Méthode pour ajouter un collaborateur
ProjectSchema.methods.addCollaborator = async function(userId, role, addedBy) {
    // Vérifier si déjà collaborateur
    const exists = this.collaborators.some(
        c => c.user.toString() === userId.toString()
    );

    if (exists) {
        throw new Error('Utilisateur déjà collaborateur');
    }

    this.collaborators.push({
        user: userId,
        role,
        addedBy
    });

    await this.save();
};

// Méthode pour mettre à jour les stats de visite
ProjectSchema.methods.incrementVisit = async function(isUnique = false) {
    this.stats.totalVisits += 1;
    if (isUnique) {
        this.stats.uniqueVisitors += 1;
    }
    this.stats.lastVisit = new Date();
    await this.save();
};

// Méthode pour calculer la progression
ProjectSchema.methods.getProgress = function() {
    const statusOrder = {
        'PENDING': 0,
        'IN_PROGRESS': 40,
        'REVIEW': 70,
        'COMPLETED': 90,
        'DEPLOYED': 100,
        'MAINTENANCE': 100,
        'ARCHIVED': 100
    };

    return statusOrder[this.status] || 0;
};

// Méthode pour générer l'URL complète
ProjectSchema.methods.getUrl = function() {
    if (this.domain.customDomain?.domain && this.domain.customDomain.verified) {
        return `https://${this.domain.customDomain.domain}`;
    }
    
    if (this.domain.subdomain) {
        return `https://${this.domain.subdomain}.evolyte.app`;
    }

    return null;
};

// Méthode pour vérifier si peut déployer
ProjectSchema.methods.canDeploy = function() {
    // Doit avoir au moins une révision
    if (this.revisions.length === 0) {
        return { allowed: false, reason: 'Aucune révision disponible' };
    }

    // Doit avoir un domaine configuré
    if (!this.domain.subdomain && !this.domain.customDomain?.domain) {
        return { allowed: false, reason: 'Aucun domaine configuré' };
    }

    // Ne peut pas déployer si déjà en cours
    if (this.deployment.status === 'DEPLOYING') {
        return { allowed: false, reason: 'Déploiement en cours' };
    }

    return { allowed: true };
};

export default mongoose.model('Project', ProjectSchema);
