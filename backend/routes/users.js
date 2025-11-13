import express from 'express';
import User from '../models/User.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (all roles)
router.get('/', auth, async (req, res) => {
  try {
    const { role, department } = req.query;
    const user = req.user;

    let filter = {};

    // Department coordinator can only see their department
    if (user.role === 'coordinator') {
      filter.department = user.department;
    }

    // Filter by role if provided
    if (role) {
      filter.role = role;
    }

    // Filter by department if provided (admin can see all)
    if (department && user.role === 'admin') {
      filter.department = department;
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('savedJobs', 'title company location');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedFields = [
      'name', 'phone', 'email', 'location', 'gender', 'headline', 'degree', 'college', 'birthDate', 'currentPosition', 'company', 'bio', 'profilePicture',
      'graduationYear', 'enrollmentNumber', 'skills', 'projects', 'resumeUrl',
      'linkedinUrl', 'facebookUrl', 'portfolioUrl', 'githubUrl', 'languages', 'experience',
      'industry', 'workExperience', 'profileLink', 'youtubeUrl', 'instagramUrl',
      'department', 'staffId', 'role'
    ];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Check if email is being updated and if it's already taken by another user
    if (updates.email) {
      const existingUser = await User.findOne({ 
        email: updates.email.toLowerCase(),
        _id: { $ne: req.user.userId } // Exclude current user
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email address is already in use by another user' });
      }
      
      // Normalize email
      updates.email = updates.email.toLowerCase().trim();
    }

    if (req.body.facultyId !== undefined) {
      updates.staffId = req.body.facultyId;
    }

    if (updates.role && !['admin', 'coordinator', 'student', 'alumni'].includes(updates.role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    // Handle duplicate key error (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email address is already in use' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Update user (Admin/Coordinator)
router.put('/:id', auth, authorize('admin', 'coordinator'), async (req, res) => {
  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Coordinator can only update users in their department
    if (req.user.role === 'coordinator' && userToUpdate.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowedFields = ['name', 'role', 'department', 'isActive'];
    const updates = {};
    
    // Only admin can change role
    if (req.body.role && req.user.role === 'admin') {
      updates.role = req.body.role;
    }

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && field !== 'role') {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pending approvals (Coordinator/Admin)
router.get('/approvals/pending', auth, authorize('coordinator', 'admin'), async (req, res) => {
  try {
    const filter = { approvalStatus: 'pending', role: { $in: ['student', 'alumni'] } };
    
    // Coordinator can only see their department
    if (req.user.role === 'coordinator') {
      filter.department = req.user.department;
    }

    const pendingUsers = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'name email');
    
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get coordinator for a department
router.get('/coordinator/:department', auth, async (req, res) => {
  try {
    const coordinator = await User.findOne({
      role: 'coordinator',
      department: req.params.department
    }).select('name email phone department');
    
    if (!coordinator) {
      return res.status(404).json({ message: 'Coordinator not found for this department' });
    }
    
    res.json(coordinator);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve/Reject user (Coordinator/Admin)
router.put('/:id/approval', auth, authorize('coordinator', 'admin'), async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    
    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Invalid approval status' });
    }

    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Coordinator can only approve users in their department
    if (req.user.role === 'coordinator' && userToUpdate.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied' });
    }

    userToUpdate.approvalStatus = approvalStatus;
    userToUpdate.approvedBy = req.user.userId;
    userToUpdate.approvedAt = new Date();
    
    await userToUpdate.save();
    
    const updatedUser = await User.findById(req.params.id)
      .select('-password')
      .populate('approvedBy', 'name email phone');
    
    // If approved, include coordinator details in response
    if (approvalStatus === 'approved') {
      const coordinatorInfo = await User.findById(req.user.userId)
        .select('name email phone department');
      
      const responseData = {
        ...updatedUser.toObject(),
        coordinator: coordinatorInfo ? {
          name: coordinatorInfo.name,
          email: coordinatorInfo.email,
          phone: coordinatorInfo.phone || coordinatorInfo.mobileNumber,
          department: coordinatorInfo.department
        } : null
      };
      
      return res.json(responseData);
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

