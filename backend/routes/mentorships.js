import express from 'express';
import mongoose from 'mongoose';
import Mentorship from '../models/Mentorship.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all mentorships
router.get('/', auth, async (req, res) => {
  try {
    const { department, status } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;

    const mentorships = await Mentorship.find(filter)
      .populate('mentor', 'name email department currentPosition company bio profilePicture headline graduationYear degree experience linkedinUrl githubUrl portfolioUrl')
      .populate('mentees.student', 'name email enrollmentNumber department')
      .populate('reviews.student', 'name profilePicture')
      .sort({ createdAt: -1 });
    
    res.json(mentorships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get mentorship by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id)
      .populate('mentor', 'name email department currentPosition company bio')
      .populate('mentees.student', 'name email enrollmentNumber department');
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }
    
    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create mentorship program (Alumni only)
router.post('/', auth, authorize('alumni'), async (req, res) => {
  try {
    const mentorship = new Mentorship({
      ...req.body,
      mentor: req.user.userId
    });
    
    await mentorship.save();
    await mentorship.populate('mentor', 'name email department currentPosition company bio');
    
    res.status(201).json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Request mentorship (Student only)
router.post('/:id/request', auth, authorize('student'), async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if already requested
    const alreadyRequested = mentorship.mentees.some(
      mentee => mentee.student.toString() === req.user.userId
    );

    if (alreadyRequested) {
      return res.status(400).json({ message: 'Already requested this mentorship' });
    }

    // Check if mentorship is full
    if (mentorship.status === 'full') {
      return res.status(400).json({ message: 'Mentorship program is full' });
    }

    mentorship.mentees.push({
      student: req.user.userId,
      status: 'pending'
    });

    // Check if reached max
    if (mentorship.maxMentees && mentorship.mentees.length >= mentorship.maxMentees) {
      mentorship.status = 'full';
    }

    await mentorship.save();
    await mentorship.populate('mentees.student', 'name email enrollmentNumber');

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update mentorship request status (Mentor / Coordinator / Admin)
router.put('/:mentorshipId/requests/:requestId', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.mentorshipId);
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    const canUpdate = 
      mentorship.mentor.toString() === req.user.userId ||
      req.user.role === 'admin' ||
      (req.user.role === 'coordinator' && mentorship.department === req.user.department);

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const request = mentorship.mentees.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (req.body.status) {
      request.status = req.body.status;
    }

    // Update mentorship status if accepting/rejecting
    if (req.body.status === 'accepted' || req.body.status === 'rejected') {
      const acceptedCount = mentorship.mentees.filter(m => m.status === 'accepted').length;
      if (mentorship.maxMentees && acceptedCount >= mentorship.maxMentees) {
        mentorship.status = 'full';
      } else if (mentorship.status === 'full') {
        mentorship.status = 'active';
      }
    }

    await mentorship.save();

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update mentorship (Owner / Admin / Coordinator)
router.put('/:id', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    const canUpdate = 
      mentorship.mentor.toString() === req.user.userId ||
      req.user.role === 'admin' ||
      (req.user.role === 'coordinator' && mentorship.department === req.user.department);

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(mentorship, req.body);
    await mentorship.save();
    await mentorship.populate('mentor', 'name email department');

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete mentorship (Owner / Admin / Coordinator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    const canDelete = 
      mentorship.mentor.toString() === req.user.userId ||
      req.user.role === 'admin' ||
      (req.user.role === 'coordinator' && mentorship.department === req.user.department);

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Mentorship.findByIdAndDelete(req.params.id);

    res.json({ message: 'Mentorship deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get mentor profile with full details (including reviews and resources)
router.get('/mentor/:mentorId', auth, async (req, res) => {
  try {
    // Convert mentorId to ObjectId if it's a valid ObjectId string
    let mentorObjectId;
    try {
      mentorObjectId = new mongoose.Types.ObjectId(req.params.mentorId);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid mentor ID format' });
    }

    const mentorship = await Mentorship.findOne({ mentor: mentorObjectId })
      .populate('mentor', 'name email department currentPosition company bio profilePicture headline graduationYear phone location linkedinUrl githubUrl portfolioUrl degree college experience education')
      .populate('reviews.student', 'name profilePicture')
      .populate('mentees.student', 'name email enrollmentNumber department');
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentor profile not found' });
    }
    
    res.json(mentorship);
  } catch (error) {
    console.error('Error fetching mentor profile:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add resource to mentorship (Mentor only)
router.post('/:id/resources', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. Only mentor can add resources.' });
    }

    const resource = {
      title: req.body.title,
      description: req.body.description,
      type: req.body.type || 'resource',
      fileUrl: req.body.fileUrl,
      price: req.body.price || 0,
      duration: req.body.duration,
      isFree: req.body.isFree || false,
      isBestSeller: req.body.isBestSeller || false
    };

    mentorship.resources.push(resource);
    await mentorship.save();

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update resource (Mentor only)
router.put('/:id/resources/:resourceId', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const resource = mentorship.resources.id(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    Object.assign(resource, req.body);
    await mentorship.save();

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete resource (Mentor only)
router.delete('/:id/resources/:resourceId', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    mentorship.resources.id(req.params.resourceId).remove();
    await mentorship.save();

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add review (Student only)
router.post('/:id/reviews', auth, authorize('student'), async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    // Check if student has been mentored by this mentor
    const isMentee = mentorship.mentees.some(
      mentee => mentee.student.toString() === req.user.userId && mentee.status === 'accepted'
    );

    if (!isMentee) {
      return res.status(403).json({ message: 'Only accepted mentees can review' });
    }

    // Check if already reviewed
    const alreadyReviewed = mentorship.reviews.some(
      review => review.student.toString() === req.user.userId
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this mentor' });
    }

    const review = {
      student: req.user.userId,
      rating: req.body.rating,
      comment: req.body.comment
    };

    mentorship.reviews.push(review);
    await mentorship.save();
    await mentorship.populate('reviews.student', 'name profilePicture');

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update mentorship profile details (Mentor only)
router.put('/:id/profile', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({ message: 'Mentorship not found' });
    }

    if (mentorship.mentor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowedFields = ['about', 'topics', 'skills', 'fluentIn', 'achievements', 'isAvailable', 'isTopMentor'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        mentorship[field] = req.body[field];
      }
    });

    await mentorship.save();
    await mentorship.populate('mentor', 'name email department currentPosition company bio profilePicture');

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

