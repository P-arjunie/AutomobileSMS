import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendEmail } from '../utils/mailer.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role, employeeId, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // If creating an employee and no employeeId provided, generate one.
    let resolvedEmployeeId = employeeId;
    if (role === 'employee') {
      // If provided, ensure uniqueness
      if (resolvedEmployeeId) {
        const existingEmployee = await User.findOne({ employeeId: resolvedEmployeeId });
        if (existingEmployee) {
          return res.status(400).json({ 
            message: 'Employee ID already exists' 
          });
        }
      } else {
  // Generate a reasonably short unique employee id like EMP-XXXXXX
        const maxAttempts = 5;
        let attempt = 0;
        let candidate;

        while (attempt < maxAttempts) {
          // 6 hex chars gives 16^6 ~ 16M combinations; prefix keeps it obvious
          candidate = `EMP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
          // check uniqueness
          // eslint-disable-next-line no-await-in-loop
          const exists = await User.findOne({ employeeId: candidate });
          if (!exists) {
            resolvedEmployeeId = candidate;
            break;
          }
          attempt++;
        }

        // Fallback: deterministic if all attempts collided (extremely unlikely)
        if (!resolvedEmployeeId) {
          resolvedEmployeeId = `EMP-${Date.now().toString().slice(-8)}`;
        }
      }
    }

    // Create user
    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      role: role || 'customer',
      employeeId: resolvedEmployeeId,
      department
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    // Create a refresh token and session
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const session = new Session({
      userId: user._id,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    await session.save();

    // Create email verification token
    try {
      const verifyToken = crypto.randomBytes(32).toString('hex');
      const verifyTokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
      user.verifyEmailToken = verifyTokenHash;
      user.verifyEmailExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      await user.save();

      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verifyToken}`;
      const message = `Please verify your email by visiting the following link: ${verifyUrl}`;
      await sendEmail({ to: user.email, subject: 'Verify your email', text: message });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: messages 
      });
    }

    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is deactivated. Please contact support.' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    // Create session with refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const session = new Session({
      userId: user._id,
      token,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    await session.save();

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    // avatar can be a data URL or an URL string. Store as-is for now.
    if (avatar) user.avatar = avatar;

    await user.save();

    // Return sanitized user
    const sanitized = await User.findById(user._id).select('-password -resetPasswordToken -resetPasswordExpire');

    res.json({
      message: 'Profile updated successfully',
      user: sanitized
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: messages 
      });
    }

    res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
});

// Refresh token
// Refresh access token using refresh token
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const session = await Session.findOne({ refreshToken }).populate('userId');

    if (!session) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (session.expiresAt < new Date()) {
      // remove expired session
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    const user = session.userId;

    const newToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '24h' }
    );

    // Update session token and extend expiry
    session.token = newToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    res.json({ message: 'Token refreshed successfully', token: newToken });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout (client-side mainly, but can be used for logging)
// Logout - invalidate session by refresh token or current token
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (refreshToken) {
      await Session.deleteOne({ refreshToken });
      return res.json({ message: 'Logout successful' });
    }

    if (token) {
      await Session.deleteOne({ token });
      return res.json({ message: 'Logout successful' });
    }

    // nothing to do
    res.json({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // Invalidate existing sessions (optional) - remove all sessions for user
    await Session.deleteMany({ userId: user._id });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Forgot password - send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const message = `You requested a password reset. Use the link below to reset your password (valid for 1 hour):\n\n${resetUrl}`;

    await sendEmail({ to: user.email, subject: 'Password reset', text: message });

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password are required' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpire: { $gt: Date.now() } }).select('+password');

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Invalidate sessions
    await Session.deleteMany({ userId: user._id });

    res.json({ message: 'Password has been reset. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Send verification email (resend) - authenticated
router.post('/send-verification', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
    user.verifyEmailToken = verifyTokenHash;
    user.verifyEmailExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verifyToken}`;
    const message = `Please verify your email by visiting the following link: ${verifyUrl}`;
    await sendEmail({ to: user.email, subject: 'Verify your email', text: message });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ verifyEmailToken: tokenHash, verifyEmailExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.isVerified = true;
    user.verifyEmailToken = undefined;
    user.verifyEmailExpire = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
