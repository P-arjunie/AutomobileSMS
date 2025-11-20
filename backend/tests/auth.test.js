import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

const validateName = (name) => {
  return name && name.trim().length > 0;
};

const validatePhoneNumber = (phone) => {
  return phone && phone.length >= 9;
};

// Mock user registration logic
const registerUser = async (userData) => {
  const { firstName, lastName, email, password, phoneNumber } = userData;

  // Validate inputs
  if (!validateName(firstName)) throw new Error('Invalid first name');
  if (!validateName(lastName)) throw new Error('Invalid last name');
  if (!validateEmail(email)) throw new Error('Invalid email');
  if (!validatePassword(password)) throw new Error('Password must be at least 8 characters');
  if (!validatePhoneNumber(phoneNumber)) throw new Error('Invalid phone number');

  // Hash password
  const hashedPassword = await bcryptjs.hash(password, 10);

  return {
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phoneNumber,
    role: 'customer',
  };
};

// Mock login logic
const loginUser = async (credentials, storedUser) => {
  const { email, password } = credentials;

  if (!validateEmail(email)) throw new Error('Invalid email');
  if (!password) throw new Error('Password required');

  if (storedUser.email !== email) throw new Error('User not found');

  const passwordMatch = await bcryptjs.compare(password, storedUser.password);
  if (!passwordMatch) throw new Error('Invalid password');

  const token = jwt.sign(
    { userId: storedUser._id, email: storedUser.email, role: storedUser.role },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '7d' }
  );

  return { token, user: { email: storedUser.email, role: storedUser.role } };
};

describe('User Registration', () => {
  it('should register a user with valid data', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'SecurePass123',
      phoneNumber: '0712345678',
    };

    const result = await registerUser(userData);

    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.role).toBe('customer');
    expect(result.password).not.toBe('SecurePass123'); // Password should be hashed
  });

  it('should reject registration with invalid email', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      password: 'SecurePass123',
      phoneNumber: '0712345678',
    };

    await expect(registerUser(userData)).rejects.toThrow('Invalid email');
  });

  it('should reject registration with short password', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'short',
      phoneNumber: '0712345678',
    };

    await expect(registerUser(userData)).rejects.toThrow('Password must be at least 8 characters');
  });

  it('should reject registration with missing first name', async () => {
    const userData = {
      firstName: '',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'SecurePass123',
      phoneNumber: '0712345678',
    };

    await expect(registerUser(userData)).rejects.toThrow('Invalid first name');
  });

  it('should reject registration with invalid phone number', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'SecurePass123',
      phoneNumber: '123',
    };

    await expect(registerUser(userData)).rejects.toThrow('Invalid phone number');
  });
});

describe('User Login', () => {
  let mockUser;

  beforeEach(async () => {
    // Create a mock user for login tests
    const hashedPassword = await bcryptjs.hash('Password123', 10);
    mockUser = {
      _id: '123456',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'customer',
    };
  });

  it('should login successfully with correct credentials', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const result = await loginUser(credentials, mockUser);

    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('user');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.role).toBe('customer');
  });

  it('should generate valid JWT token on login', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Password123',
    };

    const result = await loginUser(credentials, mockUser);
    const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'test-secret-key');

    expect(decoded.email).toBe('test@example.com');
    expect(decoded.userId).toBe('123456');
    expect(decoded.role).toBe('customer');
  });

  it('should reject login with incorrect password', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'WrongPassword123',
    };

    await expect(loginUser(credentials, mockUser)).rejects.toThrow('Invalid password');
  });

  it('should reject login with invalid email', async () => {
    const credentials = {
      email: 'invalid-email',
      password: 'Password123',
    };

    await expect(loginUser(credentials, mockUser)).rejects.toThrow('Invalid email');
  });

  it('should reject login with non-existent user', async () => {
    const credentials = {
      email: 'different@example.com',
      password: 'Password123',
    };

    await expect(loginUser(credentials, mockUser)).rejects.toThrow('User not found');
  });

  it('should reject login with missing password', async () => {
    const credentials = {
      email: 'test@example.com',
      password: '',
    };

    await expect(loginUser(credentials, mockUser)).rejects.toThrow('Password required');
  });
});

describe('Validation Functions', () => {
  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@company.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should accept passwords with 8+ characters', () => {
      expect(validatePassword('Password123')).toBe(true);
      expect(validatePassword('12345678')).toBe(true);
    });

    it('should reject short passwords', () => {
      expect(validatePassword('Pass123')).toBe(false);
      expect(validatePassword('123')).toBe(false);
    });
  });

  describe('Name Validation', () => {
    it('should accept valid names', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('Mary Ann')).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(validateName('')).toBeFalsy();
      expect(validateName('   ')).toBeFalsy();
    });
  });

  describe('Phone Number Validation', () => {
    it('should accept valid phone numbers', () => {
      expect(validatePhoneNumber('0712345678')).toBe(true);
      expect(validatePhoneNumber('94712345678')).toBe(true);
    });

    it('should reject short phone numbers', () => {
      expect(validatePhoneNumber('123')).toBeFalsy();
      expect(validatePhoneNumber('')).toBeFalsy();
    });
  });
});
