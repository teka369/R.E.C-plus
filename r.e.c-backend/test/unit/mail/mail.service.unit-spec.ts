import { MailService } from '../../../src/mail/mail.service';

// Mock Resend before importing
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'msg_123' }),
    },
  })),
}));

describe('MailService', () => {
  let service: MailService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test_key';
    process.env.RESEND_FROM = 'Test <test@recedu.co>';
    service = new MailService();
    // Access the mocked send function
    mockSend = (service as any).resend.emails.send;
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
  });

  describe('sendPasswordReset', () => {
    it('sends email with correct parameters', async () => {
      await service.sendPasswordReset(
        'user@test.co',
        'https://app.co/reset-password',
        'secret-token-hex',
      );
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Test <test@recedu.co>',
          to: 'user@test.co',
          subject: expect.stringContaining('Restablecer contraseña'),
          html: expect.stringContaining('https://app.co/reset-password'),
        }),
      );
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('secret-token-hex'),
        }),
      );
    });

    it('throws when send fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('API error'));
      await expect(
        service.sendPasswordReset(
          'user@test.co',
          'https://app.co/reset-password',
          'tok',
        ),
      ).rejects.toThrow('API error');
    });
  });

  describe('constructor', () => {
    it('uses default from when RESEND_FROM is not set', () => {
      delete process.env.RESEND_FROM;
      const svc = new MailService();
      expect((svc as any).from).toBe('R.E.C <noreply@recedu.co>');
    });
  });
});
