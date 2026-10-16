const crypto = require('crypto');
const User = require('../models/User');
const Customer = require('../models/Customer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerificationOTP } = require('../services/mailService');
const { 
  asyncHandler, 
  ValidationError, 
  NotFoundError, 
  AuthenticationError, 
  ConflictError 
} = require('../utils/errorHandler');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Validate password strength
  if (password.length < 6) {
    const remaining = 6 - password.length;
    throw new ValidationError(`Password must be at least 6 characters long. Please add ${remaining} more character${remaining > 1 ? 's' : ''}.`);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate 6-digit OTP and 10-minute expiry
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  // Create user with unverified email state and OTP token
  const user = await User.create({ 
    name, 
    email, 
    password: hashedPassword, 
    role,
    isEmailVerified: false,
    emailVerificationToken: otp,
    emailVerificationExpires: otpExpires
  });

  // Create associated records based on role
  try {
    if (role === 'customer') {
      await Customer.create({ 
        name, 
        email, 
        phone: phone || 'N/A', 
        address: '', 
        id: user.id 
      });
    } else if (role === 'agent') {
      if (!phone) {
        throw new ValidationError('Phone number is required for agent registration');
      }
      const Agent = require('../models/Agent');
      await Agent.create({ 
        name, 
        email, 
        phone, 
        id: user.id 
      });
    }
  } catch (error) {
    // If creating associated record fails, delete the user
    await User.destroy({ where: { id: user.id } });
    throw error;
  }

  // Dispatch OTP email (asynchronous / non-blocking)
  sendVerificationOTP(email, otp, name).catch(err => {
    console.error('Background OTP send error:', err);
  });

  // Generate provisional JWT token
  const token = jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully. A 6-digit verification code has been dispatched to your email.',
    data: {
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isEmailVerified: false
      },
      token,
      emailVerificationRequired: true
    }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AuthenticationError('Please enter correct email/password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Please enter correct email/password');
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        isEmailVerified: Boolean(user.isEmailVerified)
      },
      token
    }
  });
});

// Verify 6-digit Email OTP
exports.verifyEmailOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ValidationError('Email address and 6-digit verification code are required');
  }

  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    throw new NotFoundError('No account found with this email address');
  }

  if (user.isEmailVerified) {
    return res.json({
      success: true,
      message: 'Email address is already verified',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: true
        }
      }
    });
  }

  if (!user.emailVerificationToken || user.emailVerificationToken !== otp.toString().trim()) {
    throw new ValidationError('Invalid verification code. Please check your email and try again.');
  }

  if (new Date() > new Date(user.emailVerificationExpires)) {
    throw new ValidationError('Verification code has expired. Please click Resend Code to receive a fresh OTP.');
  }

  // Mark verified and clear temporary token
  await user.update({
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null
  });

  const token = jwt.sign(
    { id: user.id, role: user.role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'Email verified successfully!',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: true
      },
      token
    }
  });
});

// Resend 6-digit Email OTP
exports.resendEmailOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError('Email address is required');
  }

  const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    throw new NotFoundError('No account found with this email address');
  }

  if (user.isEmailVerified) {
    return res.json({
      success: true,
      message: 'This email is already verified. You can log in directly.'
    });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await user.update({
    emailVerificationToken: otp,
    emailVerificationExpires: otpExpires
  });

  await sendVerificationOTP(user.email, otp, user.name);

  res.json({
    success: true,
    message: 'A fresh 6-digit verification code has been dispatched to your email.'
  });
});

// Get current user profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: { user }
  });
});

// Update user profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const userId = req.user.id;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }
  }

  // Update user
  await user.update({ name: name || user.name, email: email || user.email });

  // Update associated records
  if (user.role === 'customer') {
    const customer = await Customer.findByPk(userId);
    if (customer) {
      await customer.update({ 
        name: name || customer.name, 
        email: email || customer.email,
        phone: phone || customer.phone 
      });
    }
  } else if (user.role === 'agent') {
    const Agent = require('../models/Agent');
    const agent = await Agent.findByPk(userId);
    if (agent) {
      await agent.update({ 
        name: name || agent.name, 
        email: email || agent.email,
        phone: phone || agent.phone 
      });
    }
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    }
  });
});
