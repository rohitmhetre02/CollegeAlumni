import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, enrollmentNumber, graduationYear, phone, staffId } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const userData = {
      name,
      email,
      password,
      role,
      department,
      phone
    };

    // Add role-specific fields
    if (role === 'student') {
      userData.enrollmentNumber = enrollmentNumber;
      userData.graduationYear = graduationYear;
    } else if (role === 'coordinator' || role === 'admin') {
      userData.staffId = staffId;
    }

    user = new User(userData);

    await user.save();

    // Ensure approvalStatus is set after save (in case default wasn't applied)
    if (!user.approvalStatus && (user.role === 'student' || user.role === 'alumni')) {
      user.approvalStatus = 'pending';
      await user.save();
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role, department: user.department },
      process.env.JWT_SECRET || 'alumni-portal-secret-key-2024-very-secure-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const userResponse = await User.findById(user._id).select('-password');
    
    // Ensure all user data is included
    const fullUserData = {
      id: userResponse._id,
      _id: userResponse._id,
      name: userResponse.name,
      email: userResponse.email,
      role: userResponse.role,
      department: userResponse.department,
      approvalStatus: userResponse.approvalStatus || (userResponse.role === 'student' || userResponse.role === 'alumni' ? 'pending' : 'approved'),
      enrollmentNumber: userResponse.enrollmentNumber,
      graduationYear: userResponse.graduationYear,
      phone: userResponse.phone,
      ...userResponse.toObject()
    };
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: fullUserData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role, department: user.department },
      process.env.JWT_SECRET || 'alumni-portal-secret-key-2024-very-secure-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const userData = await User.findById(user._id).select('-password');
    
    // Ensure all user data is included
    const fullUserData = {
      id: userData._id,
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      approvalStatus: userData.approvalStatus || (userData.role === 'student' || userData.role === 'alumni' ? 'pending' : 'approved'),
      enrollmentNumber: userData.enrollmentNumber,
      graduationYear: userData.graduationYear,
      phone: userData.phone,
      ...userData.toObject()
    };
    
    res.json({
      message: 'Login successful',
      token,
      user: fullUserData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

