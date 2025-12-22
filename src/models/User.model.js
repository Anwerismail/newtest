import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../utils/constants.js';

const UserSchema = new mongoose.Schema({
    // Authentification
    email: {
        type: String,
        required: [true, 'Email est requis'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email invalide']
    },

    password: {
        type: String,
        required: [true, 'Mot de passe requis'],
        minlength: [6, 'Minimum 6 caractères'],
        select: false
    },

    // Informations personnelles
    profile: {
        firstName: {
            type: String,
            required: [true, 'Prénom requis'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Nom requis'],
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        avatar: {
            type: String,
            default: 'https://via.placeholder.com/150'
        },
        bio: String,
        timezone: {
            type: String,
            default: 'UTC'
        },
        language: {
            type: String,
            default: 'fr',
            enum: ['fr', 'en']
        }
    },

    // Rôle
    role: {
        type: String,
        enum: Object.values(ROLES),
        required: true,
        default: ROLES.CLIENT
    },

    // Profil WORKER
    workerProfile: {
        skills: [String],
        specialization: {
            type: String,
            enum: ['frontend', 'backend', 'fullstack', 'design']
        },
        level: {
            type: String,
            enum: ['JUNIOR', 'INTERMEDIATE', 'SENIOR']
        },
        hourlyRate: Number,
        availability: {
            status: {
                type: String,
                enum: ['AVAILABLE', 'BUSY', 'OFFLINE'],
                default: 'AVAILABLE'
            },
            hoursPerWeek: {
                type: Number,
                default: 40
            },
            workingDays: {
                type: [String],
                default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }
        },
        portfolio: String,
        stats: {
            totalTickets: {
                type: Number,
                default: 0
            },
            completedTickets: {
                type: Number,
                default: 0
            },
            averageCompletionTime: Number,
            rating: {
                type: Number,
                default: 5,
                min: 0,
                max: 5
            }
        }
    },

    // Team Management (Hybrid Model)
    primaryManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Profil CLIENT
    clientProfile: {
        company: String,
        industry: String,
        website: String,
        address: {
            street: String,
            city: String,
            postalCode: String,
            country: String
        },
        subscription: {
            plan: {
                type: String,
                enum: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
                default: 'FREE'
            },
            status: {
                type: String,
                enum: ['ACTIVE', 'CANCELLED', 'SUSPENDED'],
                default: 'ACTIVE'
            },
            startDate: Date,
            endDate: Date,
            maxProjects: {
                type: Number,
                default: 1
            }
        },
        stats: {
            totalProjects: {
                type: Number,
                default: 0
            },
            activeProjects: {
                type: Number,
                default: 0
            },
            totalSpent: {
                type: Number,
                default: 0
            }
        }
    },

    // Notifications
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        },
        preferences: {
            ticketUpdates: {
                type: Boolean,
                default: true
            },
            projectMilestones: {
                type: Boolean,
                default: true
            },
            systemUpdates: {
                type: Boolean,
                default: true
            },
            marketing: {
                type: Boolean,
                default: false
            }
        }
    },

    // Sécurité
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: String,

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // Activité
    lastLogin: Date,
    lastActive: Date,

    // Statut
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

// Index pour recherche rapide
// Note: email already has unique: true, no need for separate index
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ 'profile.firstName': 'text', 'profile.lastName': 'text' });

// Hash password avant sauvegarde
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir le nom complet
UserSchema.methods.getFullName = function() {
    return `${this.profile.firstName} ${this.profile.lastName}`;
};

// Méthode pour vérifier si l'utilisateur peut créer des projets
UserSchema.methods.canCreateProject = function() {
    if (this.role === ROLES.CLIENT) {
        const { activeProjects, subscription } = this.clientProfile.stats;
        const maxProjects = subscription.maxProjects;

        if (maxProjects === -1) return true; // Illimité
        return activeProjects < maxProjects;
    }
    return true;
};

// Nettoyer les données sensibles avant JSON
UserSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.twoFactorSecret;
    delete obj.resetPasswordToken;
    return obj;
};

export default mongoose.model('User', UserSchema);