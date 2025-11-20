import { sendEmail } from '../utils/mailer.js';

describe('Mailer Utility', () => {
  // Save original env vars
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendEmail', () => {
    it('should return mocked response when email credentials are missing', async () => {
      // Clear email credentials
      delete process.env.EMAIL_USERNAME;
      delete process.env.EMAIL_PASSWORD;

      const mailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'Test message',
      };

      const result = await sendEmail(mailOptions);

      expect(result).toHaveProperty('mocked', true);
    });

    it('should accept valid email parameters', async () => {
      delete process.env.EMAIL_USERNAME;
      delete process.env.EMAIL_PASSWORD;

      const mailOptions = {
        to: 'user@example.com',
        subject: 'Password Reset',
        html: '<p>Click <a href="link">here</a> to reset</p>',
      };

      const result = await sendEmail(mailOptions);

      expect(result).toBeDefined();
      expect(result.mocked).toBe(true);
    });

    it('should handle multiple recipients', async () => {
      delete process.env.EMAIL_USERNAME;
      delete process.env.EMAIL_PASSWORD;

      const mailOptions = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Notification',
        text: 'You have a new appointment',
      };

      const result = await sendEmail(mailOptions);

      expect(result.mocked).toBe(true);
    });
  });
});
