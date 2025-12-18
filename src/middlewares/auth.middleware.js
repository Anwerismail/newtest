import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.model.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Middleware pour protéger les routes (authentification requise)
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        // Récupérer le token depuis le header Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Vérifier si le token existe
        if (!token) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        // Vérifier le token
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // Récupérer l'utilisateur
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier le statut de l'utilisateur
        if (user.status !== 'ACTIVE') {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Compte inactif ou suspendu'
            });
        }

        // Mettre à jour lastActive
        user.lastActive = new Date();
        await user.save({ validateBeforeSave: false });

        // Attacher l'utilisateur à la requête
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.TOKEN_EXPIRED
            });
        }

        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: ERROR_MESSAGES.INVALID_TOKEN
        });
    }
};

/**
 * Middleware pour restreindre l'accès par rôle
 * Usage: authorize('ADMIN', 'SUPER_ADMIN')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: ERROR_MESSAGES.FORBIDDEN
            });
        }
        next();
    };
};

/**
 * Middleware optionnel pour récupérer l'utilisateur si authentifié
 * (n'échoue pas si non authentifié)
 */
export const optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (user && user.status === 'ACTIVE') {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Si erreur, continuer sans utilisateur
        next();
    }
};