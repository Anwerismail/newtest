import mongoose from 'mongoose';
import { TEMPLATE_TYPES, TEMPLATE_CATEGORIES } from '../utils/constants.js';

const TemplateSchema = new mongoose.Schema({
    // Identification
    name: {
        type: String,
        required: [true, 'Nom du template requis'],
        trim: true
    },

    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    description: {
        type: String,
        required: [true, 'Description requise']
    },

    // Type et Catégorie
    type: {
        type: String,
        enum: Object.values(TEMPLATE_TYPES),
        required: true,
        default: TEMPLATE_TYPES.STATIC
    },

    category: {
        type: String,
        enum: Object.values(TEMPLATE_CATEGORIES),
        required: true
    },

    // Niveau de complexité
    complexity: {
        type: String,
        enum: ['simple', 'medium', 'advanced'],
        default: 'simple'
    },

    // Structure du template (pour templates statiques)
    structure: {
        // Code HTML/CSS/JS stocké directement
        html: String,
        css: String,
        js: String,

        // Assets (images, fonts)
        assets: {
            images: [{
                name: String,
                url: String,
                alt: String
            }],
            fonts: [String]
        }
    },

    // Blocs éditables (sections du template)
    blocks: [{
        id: String,
        name: String,
        description: String,
        editable: {
            type: Boolean,
            default: true
        },
        html: String,

        // Champs personnalisables
        fields: [{
            name: String,
            type: {
                type: String,
                enum: ['text', 'textarea', 'image', 'color', 'number', 'select']
            },
            label: String,
            default: mongoose.Schema.Types.Mixed,
            options: [String] // Pour les select
        }]
    }],

    // Configuration par défaut
    config: {
        colors: {
            primary: { type: String, default: '#3B82F6' },
            secondary: { type: String, default: '#10B981' },
            accent: { type: String, default: '#F59E0B' },
            background: { type: String, default: '#FFFFFF' },
            text: { type: String, default: '#1F2937' }
        },

        fonts: {
            heading: { type: String, default: 'Poppins' },
            body: { type: String, default: 'Inter' }
        },

        responsive: {
            type: Boolean,
            default: true
        },

        // SEO par défaut
        seo: {
            titleTemplate: String, // Ex: "{{siteName}} - Portfolio"
            descriptionTemplate: String,
            keywords: [String]
        }
    },

    // Repository Git (pour templates avancés)
    repository: {
        provider: {
            type: String,
            enum: ['github', 'gitlab', null],
            default: null
        },
        url: String,
        branch: { type: String, default: 'main' },

        // Structure technique
        framework: String, // Next.js, React, Vue
        language: String, // TypeScript, JavaScript
        styling: String, // TailwindCSS, Styled Components

        // Build config
        buildCommand: String,
        outputDir: String
    },

    // Variables d'environnement requises (pour templates avancés)
    envVariables: [{
        key: String,
        required: Boolean,
        description: String,
        default: String
    }],

    // Preview et Demo
    preview: {
        thumbnail: {
            type: String,
            required: true
        },
        screenshots: [String],
        demoUrl: String,
        videoUrl: String
    },

    // Pricing
    pricing: {
        free: {
            type: Boolean,
            default: true
        },
        premium: {
            type: Boolean,
            default: false
        },
        price: {
            type: Number,
            default: 0
        }
    },

    // Features
    features: [String],

    // Technologies utilisées
    technologies: [String],

    // Tags pour recherche
    tags: [String],

    // Métadonnées
    metadata: {
        downloads: {
            type: Number,
            default: 0
        },
        rating: {
            type: Number,
            default: 5,
            min: 0,
            max: 5
        },
        reviews: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: Number,
            comment: String,
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        author: {
            type: String,
            default: 'SiteForge Team'
        },
        version: {
            type: String,
            default: '1.0.0'
        },
        lastUpdated: Date
    },

    // Statut
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },

    // Qui peut utiliser ce template
    visibility: {
        type: String,
        enum: ['public', 'premium', 'private'],
        default: 'public'
    }
}, {
    timestamps: true
});

// Index pour recherche rapide
TemplateSchema.index({ name: 'text', description: 'text', tags: 'text' });
TemplateSchema.index({ category: 1, status: 1 });
TemplateSchema.index({ type: 1, complexity: 1 });
TemplateSchema.index({ slug: 1 });
TemplateSchema.index({ 'metadata.downloads': -1 });
TemplateSchema.index({ 'metadata.rating': -1 });

// Générer le slug avant sauvegarde
TemplateSchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    this.metadata.lastUpdated = new Date();
    next();
});

// Méthode pour incrémenter les téléchargements
TemplateSchema.methods.incrementDownloads = async function() {
    this.metadata.downloads += 1;
    await this.save();
};

// Méthode pour ajouter une review
TemplateSchema.methods.addReview = async function(userId, rating, comment) {
    this.metadata.reviews.push({
        user: userId,
        rating,
        comment
    });

    // Recalculer la note moyenne
    const totalRating = this.metadata.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.metadata.rating = totalRating / this.metadata.reviews.length;

    await this.save();
};

// Méthode pour vérifier si accessible par un utilisateur
TemplateSchema.methods.isAccessibleBy = function(user) {
    if (this.visibility === 'public') return true;
    if (this.visibility === 'private') return false;

    // Premium : vérifier l'abonnement de l'utilisateur
    if (this.visibility === 'premium') {
        return user?.clientProfile?.subscription?.plan !== 'FREE';
    }

    return false;
};

export default mongoose.model('Template', TemplateSchema);