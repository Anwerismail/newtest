import { validationResult } from 'express-validator';
import { HTTP_STATUS } from '../utils/constants.js';

/**
 * Middleware pour valider les données avec express-validator
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
            success: false,
            message: 'Erreur de validation',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
};

/**
 * Middleware pour valider l'ID MongoDB
 */
export const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];

        // Pattern MongoDB ObjectId (24 caractères hexadécimaux)
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;

        if (!objectIdPattern.test(id)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: `ID invalide : ${paramName}`
            });
        }

        next();
    };
};

/**
 * Sanitize user input (protection XSS basique)
 */
export const sanitizeInput = (req, res, next) => {
    // Nettoyer les champs de texte
    const cleanString = (str) => {
        if (typeof str !== 'string') return str;
        return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    };

    // Parcourir body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = cleanString(req.body[key]);
            }
        });
    }

    next();
};