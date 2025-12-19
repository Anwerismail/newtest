import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.model.js';
import { HTTP_STATUS, ERROR_MESSAGES, ROLES } from '../utils/constants.js';
import { logInfo, logError, logAuth } from '../services/logger.service.js';
import { sendWelcomeEmail } from '../services/email.service.js';

/**
 * Génère un JWT token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRE
    });
};

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: ERROR_MESSAGES.EMAIL_EXISTS
            });
        }

        // Créer l'utilisateur
        const user = await User.create({
            email,
            password,
            profile: {
                firstName,
                lastName
            },
            role: role || ROLES.CLIENT
        });

        // Initialiser les profils selon le rôle
        if (user.role === ROLES.CLIENT) {
            user.clientProfile = {
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
            await user.save();
        } else if (user.role === ROLES.WORKER) {
            user.workerProfile = {
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
            await user.save();
        }

        // Générer le token
        const token = generateToken(user._id);

        // Log successful registration
        logAuth('REGISTER', user._id, true, {
            email: user.email,
            role: user.role,
        });

        // Send welcome email (non-blocking)
        sendWelcomeEmail(user).catch(err => {
            logError('Failed to send welcome email', err, { userId: user._id });
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Inscription réussie',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        logError('Registration failed', error, { email: req.body.email });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: error.message || ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Connexion
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Email et mot de passe requis'
            });
        }

        // Vérifier l'utilisateur (inclure le password pour la comparaison)
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.INVALID_CREDENTIALS
            });
        }

        // Vérifier le mot de passe
        const isPasswordCorrect = await user.comparePassword(password);

        if (!isPasswordCorrect) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: ERROR_MESSAGES.INVALID_CREDENTIALS
            });
        }

        // Vérifier le statut du compte
        if (user.status !== 'ACTIVE') {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Votre compte est inactif ou suspendu'
            });
        }

        // Mettre à jour lastLogin
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Générer le token
        const token = generateToken(user._id);

        // Log successful login
        logAuth('LOGIN', user._id, true, {
            email: user.email,
            role: user.role,
            ip: req.ip,
        });

        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        // Log failed login attempt
        logAuth('LOGIN', null, false, {
            email: req.body.email,
            ip: req.ip,
            error: error.message,
        });
        logError('Login failed', error, { email: req.body.email });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Récupérer l'utilisateur connecté
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        logError('GetMe failed', error, { userId: req.user?._id });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Mettre à jour le profil
 * @route   PUT /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone, bio, avatar, timezone, language } = req.body;

        const user = await User.findById(req.user._id);

        // Mettre à jour le profil
        if (firstName) user.profile.firstName = firstName;
        if (lastName) user.profile.lastName = lastName;
        if (phone !== undefined) user.profile.phone = phone;
        if (bio !== undefined) user.profile.bio = bio;
        if (avatar) user.profile.avatar = avatar;
        if (timezone) user.profile.timezone = timezone;
        if (language) user.profile.language = language;

        await user.save();

        logInfo('Profile updated', { userId: user._id });

        res.json({
            success: true,
            message: 'Profil mis à jour',
            data: { user }
        });

    } catch (error) {
        logError('Update profile failed', error, { userId: req.user?._id });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Changer le mot de passe
 * @route   PUT /api/v1/auth/password
 * @access  Private
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Mot de passe actuel et nouveau mot de passe requis'
            });
        }

        // Récupérer l'utilisateur avec le mot de passe
        const user = await User.findById(req.user._id).select('+password');

        // Vérifier le mot de passe actuel
        const isPasswordCorrect = await user.comparePassword(currentPassword);

        if (!isPasswordCorrect) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Mettre à jour le mot de passe
        user.password = newPassword;
        await user.save();

        logAuth('PASSWORD_CHANGE', user._id, true, { email: user.email });

        res.json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });

    } catch (error) {
        logError('Password change failed', error, { userId: req.user?._id });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};

/**
 * @desc    Déconnexion
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
    try {
        // Dans une vraie application, on invaliderait le token ici
        // (par exemple en l'ajoutant à une blacklist Redis)

        logAuth('LOGOUT', req.user._id, true, { email: req.user.email });

        res.json({
            success: true,
            message: 'Déconnexion réussie'
        });

    } catch (error) {
        logError('Logout failed', error, { userId: req.user?._id });
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR
        });
    }
};