import express from 'express';
import News from '../models/News.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// List news
router.get('/', auth, async (req, res) => {
  try {
    const { department } = req.query;
    const filter = {};
    if (department) filter.department = department;
    const list = await News.find(filter).sort({ publishedAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Create (admin/coordinator/alumni)
router.post('/', auth, async (req, res) => {
  try {
    const doc = new News(req.body);
    await doc.save();
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;


