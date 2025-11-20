import { sendEmail } from '../utils/mailer.js';

describe('Utility Functions', () => {
  describe('Mailer - sendEmail()', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return mocked response when email credentials are missing', async () => {
      delete process.env.EMAIL_USERNAME;
      delete process.env.EMAIL_PASSWORD;

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test message'
      });

      expect(result).toBeDefined();
      expect(result.mocked).toBe(true);
    });

    it('should accept email with html content', async () => {
      delete process.env.EMAIL_USERNAME;
      delete process.env.EMAIL_PASSWORD;

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Password Reset',
        html: '<p>Click <a href="link">here</a> to reset</p>'
      });

      expect(result.mocked).toBe(true);
    });
  });

  describe('Form Validation Helpers', () => {
    it('should validate email format', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'name+tag@company.org'
      ];

      const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example'
      ];

      const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should validate password strength', () => {
      const isStrongPassword = (pwd) => pwd && pwd.length >= 6;

      expect(isStrongPassword('password123')).toBe(true);
      expect(isStrongPassword('pass')).toBe(false);
      expect(isStrongPassword('')).toBe(false);
    });

    it('should validate phone number format', () => {
      const isValidPhone = (phone) => /^\+?[\d\s-()]+$/.test(phone);

      expect(isValidPhone('0712345678')).toBe(true);
      expect(isValidPhone('+1-555-0123')).toBe(true);
      expect(isValidPhone('(555) 012-3456')).toBe(true);
      expect(isValidPhone('invalid phone!')).toBe(false);
    });

    it('should validate passwords match', () => {
      const passwordsMatch = (pwd1, pwd2) => pwd1 === pwd2;

      expect(passwordsMatch('password123', 'password123')).toBe(true);
      expect(passwordsMatch('password123', 'password124')).toBe(false);
      expect(passwordsMatch('', '')).toBe(true);
    });
  });

  describe('User Role Validation', () => {
    it('should validate user roles', () => {
      const validRoles = ['customer', 'employee', 'admin'];
      const isValidRole = (role) => validRoles.includes(role);

      expect(isValidRole('customer')).toBe(true);
      expect(isValidRole('employee')).toBe(true);
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('user')).toBe(false);
    });

    it('should validate employee department', () => {
      const validDepts = ['mechanical', 'electrical', 'bodywork', 'painting', 'inspection', 'management'];
      const isValidDept = (dept) => validDepts.includes(dept);

      expect(isValidDept('mechanical')).toBe(true);
      expect(isValidDept('electrical')).toBe(true);
      expect(isValidDept('invalid')).toBe(false);
    });
  });

  describe('Service Type Validation', () => {
    it('should validate appointment service types', () => {
      const validServices = [
        'General Service',
        'Oil Change',
        'Tire Replacement',
        'Battery Replacement',
        'Brake Service',
        'Engine Diagnostics'
      ];

      const isValidService = (service) => validServices.includes(service);

      expect(isValidService('General Service')).toBe(true);
      expect(isValidService('Oil Change')).toBe(true);
      expect(isValidService('Unknown Service')).toBe(false);
    });
  });

  describe('Date & Time Validation', () => {
    it('should validate appointment date is in future', () => {
      const isFutureDate = (date) => new Date(date) > new Date();

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const pastDate = new Date(Date.now() - 1000);

      expect(isFutureDate(futureDate)).toBe(true);
      expect(isFutureDate(pastDate)).toBe(false);
    });

    it('should validate time slot format', () => {
      const isValidTimeSlot = (slot) => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(slot);

      expect(isValidTimeSlot('09:00-10:00')).toBe(true);
      expect(isValidTimeSlot('14:30-15:30')).toBe(true);
      expect(isValidTimeSlot('9:00-10:00')).toBe(false);
      expect(isValidTimeSlot('invalid')).toBe(false);
    });
  });

  describe('Form Data Sanitization', () => {
    it('should trim whitespace from strings', () => {
      const trimField = (value) => String(value).trim();

      expect(trimField('  hello  ')).toBe('hello');
      expect(trimField('world')).toBe('world');
      expect(trimField('   ')).toBe('');
    });

    it('should convert email to lowercase', () => {
      const normalizeEmail = (email) => email.toLowerCase();

      expect(normalizeEmail('Test@Example.Com')).toBe('test@example.com');
      expect(normalizeEmail('USER@DOMAIN.ORG')).toBe('user@domain.org');
    });

    it('should handle required field validation', () => {
      const isRequired = (value) => {
        if (typeof value === 'string') return value.trim() !== '';
        if (typeof value === 'number') return value !== 0;
        return value !== null && value !== undefined;
      };

      expect(isRequired('text')).toBe(true);
      expect(isRequired('  ')).toBe(false);
      expect(isRequired('')).toBe(false);
      expect(isRequired(5)).toBe(true);
      expect(isRequired(0)).toBe(false);
    });
  });
});
