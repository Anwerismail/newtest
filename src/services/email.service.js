import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';
import { logInfo, logError } from './logger.service.js';

// Email templates
const templates = {
  welcome: (user) => ({
    subject: '🎉 Bienvenue sur Evolyte !',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Bienvenue sur Evolyte !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${user.firstName} ${user.lastName}</strong>,</p>
            <p>Merci de rejoindre Evolyte ! Votre compte a été créé avec succès.</p>
            <p><strong>Votre rôle :</strong> ${user.role}</p>
            <p>Vous pouvez maintenant commencer à créer des sites web professionnels en quelques clics.</p>
            <a href="${ENV.FRONTEND_URL}/dashboard" class="button">Accéder à mon tableau de bord</a>
            <p style="margin-top: 30px;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            <p>L'équipe Evolyte 💜</p>
          </div>
          <div class="footer">
            <p>© 2025 Evolyte. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Bienvenue ${user.firstName} ${user.lastName} !\n\nVotre compte Evolyte a été créé avec succès.\nRôle: ${user.role}\n\nAccédez à votre tableau de bord: ${ENV.FRONTEND_URL}/dashboard\n\nL'équipe Evolyte`,
  }),

  passwordReset: (user, resetToken) => ({
    subject: '🔒 Réinitialisation de votre mot de passe',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .token { background: #fff; padding: 15px; border: 2px dashed #667eea; border-radius: 5px; font-size: 18px; font-family: monospace; text-align: center; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Réinitialisation du mot de passe</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${user.firstName} ${user.lastName}</strong>,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :</p>
            <a href="${ENV.FRONTEND_URL}/reset-password?token=${resetToken}" class="button">Réinitialiser mon mot de passe</a>
            <p style="margin-top: 20px;">Ou copiez ce code :</p>
            <div class="token">${resetToken}</div>
            <div class="warning">
              ⚠️ <strong>Important :</strong> Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.
            </div>
            <p>L'équipe Evolyte 💜</p>
          </div>
          <div class="footer">
            <p>© 2025 Evolyte. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Réinitialisation du mot de passe\n\nBonjour ${user.firstName},\n\nUtilisez ce lien: ${ENV.FRONTEND_URL}/reset-password?token=${resetToken}\n\nOu ce code: ${resetToken}\n\nCe lien expire dans 1 heure.\n\nL'équipe Evolyte`,
  }),

  ticketAssigned: (user, ticket) => ({
    subject: `🎫 Nouveau ticket assigné: ${ticket.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .ticket-info p { margin: 10px 0; }
          .badge { display: inline-block; padding: 5px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .badge-priority { background: #ffc107; color: #000; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Nouveau Ticket Assigné</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${user.firstName}</strong>,</p>
            <p>Un nouveau ticket vous a été assigné :</p>
            <div class="ticket-info">
              <p><strong>Numéro :</strong> ${ticket.ticketNumber}</p>
              <p><strong>Titre :</strong> ${ticket.title}</p>
              <p><strong>Type :</strong> ${ticket.type}</p>
              <p><strong>Priorité :</strong> <span class="badge badge-priority">${ticket.priority}</span></p>
              <p><strong>Description :</strong></p>
              <p>${ticket.description}</p>
            </div>
            <a href="${ENV.FRONTEND_URL}/tickets/${ticket._id}" class="button">Voir le ticket</a>
            <p style="margin-top: 20px;">Bonne journée !</p>
            <p>L'équipe Evolyte 💜</p>
          </div>
          <div class="footer">
            <p>© 2025 Evolyte. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Nouveau ticket assigné\n\nBonjour ${user.firstName},\n\nTicket: ${ticket.ticketNumber}\nTitre: ${ticket.title}\nType: ${ticket.type}\nPriorité: ${ticket.priority}\n\nVoir: ${ENV.FRONTEND_URL}/tickets/${ticket._id}\n\nL'équipe Evolyte`,
  }),

  projectInvitation: (user, project, invitedBy, role) => ({
    subject: `🤝 Invitation à collaborer sur "${project.name}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .project-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Invitation à Collaborer</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${user.firstName}</strong>,</p>
            <p><strong>${invitedBy.firstName} ${invitedBy.lastName}</strong> vous invite à collaborer sur un projet :</p>
            <div class="project-info">
              <p><strong>Projet :</strong> ${project.name}</p>
              <p><strong>Description :</strong> ${project.description || 'Aucune description'}</p>
              <p><strong>Votre rôle :</strong> ${role === 'EDITOR' ? 'Éditeur (modification autorisée)' : 'Lecteur (lecture seule)'}</p>
            </div>
            <a href="${ENV.FRONTEND_URL}/projects/${project._id}" class="button">Voir le projet</a>
            <p style="margin-top: 20px;">Bonne collaboration !</p>
            <p>L'équipe Evolyte 💜</p>
          </div>
          <div class="footer">
            <p>© 2025 Evolyte. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Invitation à collaborer\n\nBonjour ${user.firstName},\n\n${invitedBy.firstName} ${invitedBy.lastName} vous invite sur: ${project.name}\nRôle: ${role}\n\nVoir: ${ENV.FRONTEND_URL}/projects/${project._id}\n\nL'équipe Evolyte`,
  }),

  deploymentSuccess: (user, project, deployment) => ({
    subject: `✅ Déploiement réussi: ${project.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .deployment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Déploiement Réussi !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${user.firstName}</strong>,</p>
            <div class="success-box">
              <p>🎉 <strong>Votre projet a été déployé avec succès !</strong></p>
            </div>
            <div class="deployment-info">
              <p><strong>Projet :</strong> ${project.name}</p>
              <p><strong>Provider :</strong> ${deployment.provider}</p>
              <p><strong>URL :</strong> <a href="${deployment.url}">${deployment.url}</a></p>
              <p><strong>Build Time :</strong> ${deployment.buildTime || 'N/A'}</p>
            </div>
            <a href="${deployment.url}" class="button">Voir le site en ligne</a>
            <p style="margin-top: 20px;">Félicitations ! 🎊</p>
            <p>L'équipe Evolyte 💜</p>
          </div>
          <div class="footer">
            <p>© 2025 Evolyte. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Déploiement réussi!\n\n${project.name} est maintenant en ligne.\n\nURL: ${deployment.url}\nProvider: ${deployment.provider}\n\nL'équipe Evolyte`,
  }),

  deploymentFailed: (user, project, deployment) => ({
    subject: `❌ Échec du déploiement: ${project.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .deployment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Échec du Déploiement</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${user.firstName}</strong>,</p>
            <div class="error-box">
              <p>⚠️ <strong>Le déploiement de votre projet a échoué.</strong></p>
            </div>
            <div class="deployment-info">
              <p><strong>Projet :</strong> ${project.name}</p>
              <p><strong>Provider :</strong> ${deployment.provider}</p>
              <p><strong>Erreur :</strong> ${deployment.error || 'Erreur inconnue'}</p>
            </div>
            <a href="${ENV.FRONTEND_URL}/projects/${project._id}" class="button">Voir les détails</a>
            <p style="margin-top: 20px;">Notre équipe est là pour vous aider si besoin.</p>
            <p>L'équipe Evolyte 💜</p>
          </div>
          <div class="footer">
            <p>© 2025 Evolyte. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Échec du déploiement\n\n${project.name} n'a pas pu être déployé.\n\nErreur: ${deployment.error || 'Erreur inconnue'}\n\nVoir: ${ENV.FRONTEND_URL}/projects/${project._id}\n\nL'équipe Evolyte`,
  }),
};

// Create transporter
let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  const config = {
    host: ENV.EMAIL.HOST,
    port: ENV.EMAIL.PORT,
    secure: ENV.EMAIL.SECURE,
    auth: {
      user: ENV.EMAIL.USER,
      pass: ENV.EMAIL.PASSWORD,
    },
  };

  transporter = nodemailer.createTransport(config);

  // Verify connection
  transporter.verify((error) => {
    if (error) {
      logError('Email service connection failed', error);
    } else {
      logInfo('Email service ready');
    }
  });

  return transporter;
};

// Send email function
export const sendEmail = async (to, subject, html, text) => {
  try {
    const transport = createTransporter();

    const mailOptions = {
      from: `${ENV.EMAIL.FROM_NAME} <${ENV.EMAIL.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transport.sendMail(mailOptions);

    logInfo('Email sent successfully', {
      to,
      subject,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logError('Failed to send email', error, { to, subject });
    throw error;
  }
};

// Template-based email functions
export const sendWelcomeEmail = async (user) => {
  const { subject, html, text } = templates.welcome(user);
  return sendEmail(user.email, subject, html, text);
};

export const sendPasswordResetEmail = async (user, resetToken) => {
  const { subject, html, text } = templates.passwordReset(user, resetToken);
  return sendEmail(user.email, subject, html, text);
};

export const sendTicketAssignedEmail = async (user, ticket) => {
  const { subject, html, text } = templates.ticketAssigned(user, ticket);
  return sendEmail(user.email, subject, html, text);
};

export const sendProjectInvitationEmail = async (user, project, invitedBy, role) => {
  const { subject, html, text } = templates.projectInvitation(user, project, invitedBy, role);
  return sendEmail(user.email, subject, html, text);
};

export const sendDeploymentSuccessEmail = async (user, project, deployment) => {
  const { subject, html, text } = templates.deploymentSuccess(user, project, deployment);
  return sendEmail(user.email, subject, html, text);
};

export const sendDeploymentFailedEmail = async (user, project, deployment) => {
  const { subject, html, text } = templates.deploymentFailed(user, project, deployment);
  return sendEmail(user.email, subject, html, text);
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTicketAssignedEmail,
  sendProjectInvitationEmail,
  sendDeploymentSuccessEmail,
  sendDeploymentFailedEmail,
};
