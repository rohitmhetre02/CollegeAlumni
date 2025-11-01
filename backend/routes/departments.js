import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Event from '../models/Event.js';
import Mentorship from '../models/Mentorship.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all departments
router.get('/', auth, async (req, res) => {
  try {
    const departments = await User.distinct('department');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get department statistics (Coordinator / Admin)
router.get('/stats', auth, authorize('admin', 'coordinator'), async (req, res) => {
  try {
    const { department } = req.query;
    
    let filter = {};
    if (department) {
      filter.department = department;
    } else if (req.user.role === 'coordinator') {
      filter.department = req.user.department;
    }

    const [users, jobs, events, mentorships] = await Promise.all([
      User.countDocuments(filter),
      Job.countDocuments(filter),
      Event.countDocuments(filter),
      Mentorship.countDocuments(filter)
    ]);

    res.json({
      department: filter.department || 'All Departments',
      users,
      jobs,
      events,
      mentorships
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get users by department
router.get('/:department/users', auth, async (req, res) => {
  try {
    const { department } = req.params;
    const { role } = req.query;

    const filter = { department };
    if (role) filter.role = role;

    const users = await User.find(filter).select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

