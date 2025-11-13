import express from 'express';
import Gallery from '../models/Gallery.js';
import Event from '../models/Event.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get unique filter values for dropdowns
// This route MUST be placed before /:id to avoid route conflicts
router.get('/filters/values', auth, async (req, res) => {
  try {
    const categories = await Gallery.distinct('category');
    const batches = await Gallery.distinct('batch').filter(b => b);
    const departments = await Gallery.distinct('department').filter(d => d);
    const graduationYears = await Gallery.distinct('graduationYear').filter(y => y).sort((a, b) => b - a);
    
    // Get events (limited to recent ones)
    const events = await Event.find({})
      .select('_id title date')
      .sort({ date: -1 })
      .limit(50);
    
    res.json({
      categories: categories.filter(Boolean).sort(),
      batches: batches.sort(),
      departments: departments.sort(),
      graduationYears: graduationYears,
      events: events.map(e => ({ id: e._id, title: e.title, date: e.date }))
    });
  } catch (error) {
    console.error('Error fetching filter values:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all gallery photos with filters
router.get('/', auth, async (req, res) => {
  try {
    const { category, batch, event, department, uploadedBy, days, graduationYear } = req.query;
    
    let filter = {};
    
    // Filter by category
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    // Filter by batch
    if (batch && batch !== 'all') {
      filter.batch = batch;
    }
    
    // Filter by event
    if (event && event !== 'all') {
      filter.event = event;
    }
    
    // Filter by department
    if (department && department !== 'all') {
      filter.department = department;
    }
    
    // Filter by uploader
    if (uploadedBy && uploadedBy !== 'all') {
      filter.uploadedBy = uploadedBy;
    }
    
    // Filter by graduation year
    if (graduationYear && graduationYear !== 'all') {
      filter.graduationYear = parseInt(graduationYear);
    }
    
    // Filter by days (last N days)
    if (days && days !== 'all') {
      const daysNum = parseInt(days);
      if (!isNaN(daysNum) && daysNum > 0) {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - daysNum);
        filter.createdAt = { $gte: dateLimit };
      }
    }
    
    const photos = await Gallery.find(filter)
      .populate('uploadedBy', 'name email role profilePicture')
      .populate('event', 'title date')
      .sort({ uploadedAt: -1 });
    
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get photo by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id)
      .populate('uploadedBy', 'name email role profilePicture')
      .populate('event', 'title date');
    
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    res.json(photo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload a new photo (All authenticated users)
router.post('/', auth, async (req, res) => {
  try {
    const { imageUrl, category, title, description, project, batch, event, department, tags, graduationYear } = req.body;
    
    // Validate required fields
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }
    
    if (!category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    
    // Get user's department if not provided
    const userDepartment = req.user.department || department;
    
    const galleryPhoto = new Gallery({
      imageUrl,
      category,
      title: title || '',
      description: description || '',
      project: project || '',
      batch: batch || '',
      event: event || null,
      department: userDepartment,
      tags: tags || [],
      graduationYear: graduationYear ? parseInt(graduationYear) : null,
      uploadedBy: req.user.userId
    });
    
    await galleryPhoto.save();
    await galleryPhoto.populate('uploadedBy', 'name email role profilePicture');
    if (event) {
      await galleryPhoto.populate('event', 'title date');
    }
    
    res.status(201).json(galleryPhoto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update photo (Owner or Admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    // Check if user is owner or admin
    if (photo.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only edit your own photos.' });
    }
    
    const { category, title, description, project, batch, event, tags, graduationYear } = req.body;
    
    if (category) photo.category = category;
    if (title !== undefined) photo.title = title;
    if (description !== undefined) photo.description = description;
    if (project !== undefined) photo.project = project;
    if (batch !== undefined) photo.batch = batch;
    if (event !== undefined) photo.event = event;
    if (tags !== undefined) photo.tags = tags;
    if (graduationYear !== undefined) photo.graduationYear = graduationYear ? parseInt(graduationYear) : null;
    
    await photo.save();
    await photo.populate('uploadedBy', 'name email role profilePicture');
    if (photo.event) {
      await photo.populate('event', 'title date');
    }
    
    res.json(photo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete photo (Owner or Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    // Check if user is owner or admin
    if (photo.uploadedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. You can only delete your own photos.' });
    }
    
    await Gallery.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

