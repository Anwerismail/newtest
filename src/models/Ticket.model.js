import mongoose from 'mongoose';
import { TICKET_TYPES, TICKET_STATUS, PRIORITY } from '../utils/constants.js';

const TicketSchema = new mongoose.Schema({
    // Numéro de ticket unique
    ticketNumber: {
        type: String,
        unique: true,
        required: true
        // Format: EVO-2025-0001
    },

    // Type et Catégorie
    type: {
        type: String,
        enum: Object.values(TICKET_TYPES),
        required: true
    },

    category: {
        type: String,
        enum: ['FRONTEND', 'BACKEND', 'DESIGN', 'CONTENT', 'INFRASTRUCTURE', 'OTHER'],
        default: 'OTHER'
    },

    // Priorité et Urgence
    priority: {
        type: String,
        enum: Object.values(PRIORITY),
        default: 'MEDIUM'
    },

    urgency: {
        type: String,
        enum: ['URGENT', 'NORMAL', 'FLEXIBLE'],
        default: 'NORMAL'
    },

    // Statut et Workflow
    status: {
        type: String,
        enum: Object.values(TICKET_STATUS),
        required: true,
        default: 'PENDING'
    },

    workflow: [{
        status: String,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        comment: String
    }],

    // Projet associé
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },

    // Personnes impliquées
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    watchers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Description
    title: {
        type: String,
        required: [true, 'Titre requis'],
        maxlength: 200
    },

    description: {
        type: String,
        required: [true, 'Description requise']
    },

    // Détails spécifiques selon le type
    details: {
        // Pour NEW_PROJECT
        templateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Template'
        },
        siteName: String,
        domain: String,
        deadline: Date,

        // Pour BUG_FIX
        bugDescription: String,
        stepsToReproduce: [String],
        expectedBehavior: String,
        actualBehavior: String,
        browserInfo: String,
        severity: {
            type: String,
            enum: ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL']
        },

        // Pour MODIFICATION
        requestedChanges: [String],
        affectedPages: [String],

        // Pour CONTENT_UPDATE
        contentType: String,
        pages: [String]
    },

    // Fichiers attachés
    attachments: [{
        name: String,
        url: String,
        type: String, // image, document, video
        size: Number,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Commentaires et Discussion
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        edited: {
            type: Boolean,
            default: false
        },
        editedAt: Date,
        attachments: [{
            name: String,
            url: String
        }]
    }],

    // Estimations
    estimation: {
        time: Number, // en heures
        complexity: {
            type: String,
            enum: ['SIMPLE', 'MEDIUM', 'COMPLEX']
        },
        estimatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        estimatedAt: Date
    },

    // Temps réel passé
    timeTracking: [{
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        startTime: Date,
        endTime: Date,
        duration: Number, // en minutes
        description: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Dates importantes
    dueDate: Date,
    startDate: Date,
    completedDate: Date,

    // Tags pour recherche
    tags: [String],

    // Relations entre tickets
    parentTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },

    subTickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],

    relatedTickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],

    blockedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],

    blocks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }],

    // Validation (pour modifications)
    validation: {
        required: {
            type: Boolean,
            default: false
        },
        validatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        validatedAt: Date,
        approved: Boolean,
        feedback: String
    },

    // Métriques
    metrics: {
        responseTime: Number, // Temps avant première réponse (minutes)
        resolutionTime: Number, // Temps total de résolution (minutes)
        reopenCount: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Index pour recherche rapide
// Note: ticketNumber already has unique: true, no need for separate index
TicketSchema.index({ project: 1, status: 1 });
TicketSchema.index({ assignedTo: 1, status: 1 });
TicketSchema.index({ reporter: 1 });
TicketSchema.index({ priority: 1, status: 1 });
TicketSchema.index({ type: 1, status: 1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ dueDate: 1 });
TicketSchema.index({ title: 'text', description: 'text' });

// Générer le numéro de ticket avant sauvegarde
TicketSchema.pre('save', async function(next) {
    if (!this.ticketNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Ticket').countDocuments();
        this.ticketNumber = `EVO-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

// Ajouter une entrée au workflow lors du changement de statut
TicketSchema.methods.changeStatus = async function(newStatus, userId, comment) {
    this.workflow.push({
        status: newStatus,
        changedBy: userId,
        changedAt: new Date(),
        comment
    });

    this.status = newStatus;

    // Mettre à jour les dates selon le statut
    if (newStatus === 'IN_PROGRESS' && !this.startDate) {
        this.startDate = new Date();
    }

    if (['COMPLETED', 'DEPLOYED', 'CLOSED'].includes(newStatus) && !this.completedDate) {
        this.completedDate = new Date();

        // Calculer le temps de résolution
        if (this.createdAt) {
            this.metrics.resolutionTime = Math.floor(
                (this.completedDate - this.createdAt) / (1000 * 60)
            );
        }
    }

    await this.save();
};

// Assigner le ticket à un worker
TicketSchema.methods.assignTo = async function(workerId, managerId) {
    this.assignedTo = workerId;
    this.assignedBy = managerId;
    this.status = 'ASSIGNED';

    this.workflow.push({
        status: 'ASSIGNED',
        changedBy: managerId,
        changedAt: new Date(),
        comment: 'Ticket assigné'
    });

    // Calculer le temps de réponse
    if (this.createdAt && !this.metrics.responseTime) {
        this.metrics.responseTime = Math.floor(
            (new Date() - this.createdAt) / (1000 * 60)
        );
    }

    await this.save();
};

// Ajouter un commentaire
TicketSchema.methods.addComment = async function(userId, content, attachments = []) {
    this.comments.push({
        author: userId,
        content,
        attachments
    });

    await this.save();
};

// Tracker le temps
TicketSchema.methods.trackTime = async function(workerId, duration, description) {
    this.timeTracking.push({
        worker: workerId,
        duration,
        description
    });

    await this.save();
};

// Calculer le temps total passé
TicketSchema.methods.getTotalTime = function() {
    return this.timeTracking.reduce((total, entry) => total + (entry.duration || 0), 0);
};

// Vérifier si l'utilisateur peut modifier ce ticket
TicketSchema.methods.canModify = function(user) {
    // Reporter peut toujours modifier
    if (this.reporter.toString() === user._id.toString()) return true;

    // Assigné peut modifier
    if (this.assignedTo && this.assignedTo.toString() === user._id.toString()) return true;

    // Managers et admins peuvent modifier
    if (['PROJECT_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) return true;

    return false;
};

export default mongoose.model('Ticket', TicketSchema);