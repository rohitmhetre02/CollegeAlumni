import express from 'express';
import Activity from '../models/Activity.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get current user's activities
router.get('/mine', auth, async (req, res) => {
  try {
    const list = await Activity.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;


