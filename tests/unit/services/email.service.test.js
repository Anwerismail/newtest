import { jest } from '@jest/globals';

describe('Email Service', () => {
  let emailService;
  let mockTransporter;

  beforeAll(async () => {
    // Mock nodemailer
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'test-message-id',
        accepted: ['test@example.com'],
        rejected: [],
      }),
      verify: jest.fn((callback) => callback(null, true)),
    };

    jest.unstable_mockModule('nodemailer', () => ({
      default: {
        createTransport: jest.fn(() => mockTransporter),
      },
    }));

    emailService = await import('../../../src/services/email.service.js');
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const html = '<p>Test email</p>';
      const text = 'Test email';

      const result = await emailService.sendEmail(to, subject, html, text);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
    });

    it('should handle email sending errors', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const to = 'test@example.com';
      const subject = 'Test Subject';
      const html = '<p>Test email</p>';
      const text = 'Test email';

      await expect(emailService.sendEmail(to, subject, html, text)).rejects.toThrow('SMTP error');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const user = {
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
      };

      const result = await emailService.sendWelcomeEmail(user);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      
      const call = mockTransporter.sendMail.mock.calls[mockTransporter.sendMail.mock.calls.length - 1];
      expect(call[0].to).toBe(user.email);
      expect(call[0].subject).toContain('Bienvenue');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      const user = {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      const resetToken = 'reset-token-123';

      const result = await emailService.sendPasswordResetEmail(user, resetToken);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      
      const call = mockTransporter.sendMail.mock.calls[mockTransporter.sendMail.mock.calls.length - 1];
      expect(call[0].to).toBe(user.email);
      expect(call[0].subject).toContain('Réinitialisation');
      expect(call[0].html).toContain(resetToken);
    });
  });

  describe('sendTicketAssignedEmail', () => {
    it('should send ticket assigned email', async () => {
      const user = {
        email: 'worker@example.com',
        firstName: 'Jane',
      };
      const ticket = {
        _id: 'ticket123',
        ticketNumber: 'EVO-2025-0001',
        title: 'Test Ticket',
        type: 'BUG_FIX',
        priority: 'HIGH',
        description: 'Test ticket description',
      };

      const result = await emailService.sendTicketAssignedEmail(user, ticket);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      
      const call = mockTransporter.sendMail.mock.calls[mockTransporter.sendMail.mock.calls.length - 1];
      expect(call[0].to).toBe(user.email);
      expect(call[0].subject).toContain('Nouveau ticket');
      expect(call[0].html).toContain(ticket.ticketNumber);
    });
  });

  describe('sendProjectInvitationEmail', () => {
    it('should send project invitation email', async () => {
      const user = {
        email: 'collaborator@example.com',
        firstName: 'Bob',
      };
      const project = {
        _id: 'project123',
        name: 'Test Project',
        description: 'Test project description',
      };
      const invitedBy = {
        firstName: 'Alice',
        lastName: 'Smith',
      };
      const role = 'EDITOR';

      const result = await emailService.sendProjectInvitationEmail(user, project, invitedBy, role);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      
      const call = mockTransporter.sendMail.mock.calls[mockTransporter.sendMail.mock.calls.length - 1];
      expect(call[0].to).toBe(user.email);
      expect(call[0].subject).toContain('Invitation');
      expect(call[0].html).toContain(project.name);
    });
  });

  describe('sendDeploymentSuccessEmail', () => {
    it('should send deployment success email', async () => {
      const user = {
        email: 'owner@example.com',
        firstName: 'Charlie',
      };
      const project = {
        name: 'Test Project',
      };
      const deployment = {
        provider: 'VERCEL',
        url: 'https://test-project.vercel.app',
        buildTime: 45000,
      };

      const result = await emailService.sendDeploymentSuccessEmail(user, project, deployment);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      
      const call = mockTransporter.sendMail.mock.calls[mockTransporter.sendMail.mock.calls.length - 1];
      expect(call[0].to).toBe(user.email);
      expect(call[0].subject).toContain('Déploiement réussi');
      expect(call[0].html).toContain(deployment.url);
    });
  });

  describe('sendDeploymentFailedEmail', () => {
    it('should send deployment failed email', async () => {
      const user = {
        email: 'owner@example.com',
        firstName: 'Charlie',
      };
      const project = {
        _id: 'project123',
        name: 'Test Project',
      };
      const deployment = {
        provider: 'VERCEL',
        error: 'Build failed',
      };

      const result = await emailService.sendDeploymentFailedEmail(user, project, deployment);

      expect(result.success).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalled();
      
      const call = mockTransporter.sendMail.mock.calls[mockTransporter.sendMail.mock.calls.length - 1];
      expect(call[0].to).toBe(user.email);
      expect(call[0].subject).toContain('Échec');
      expect(call[0].html).toContain(deployment.error);
    });
  });
});
