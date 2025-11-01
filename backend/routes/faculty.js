import express from 'express';
import Faculty from '../models/Faculty.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// List faculty
router.get('/', auth, async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {};
    if (department) filter.department = department;
    const list = await Faculty.find(filter).sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create (admin/coordinator)
router.post('/', auth, async (req, res) => {
  try {
    const doc = new Faculty(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;


