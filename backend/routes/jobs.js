import express from 'express';
import Job from '../models/Job.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all jobs
router.get('/', auth, async (req, res) => {
  try {
    const { department, type, status } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (type) filter.type = type;
    if (status) filter.status = status;

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name email department')
      .populate('applications.student', 'name email enrollmentNumber')
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get job by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email department profilePicture')
      .populate('applications.student', 'name email enrollmentNumber department')
      .populate('referralRequests.requestedBy', 'name email profilePicture role enrollmentNumber department')
      .populate('reviews.user', 'name profilePicture')
      .populate('faqs.askedBy', 'name')
      .populate('faqs.answeredBy', 'name')
      .populate('discussions.user', 'name profilePicture')
      .populate('discussions.replies.user', 'name profilePicture');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create job (Alumni, Admin, Coordinator)
router.post('/', auth, authorize('alumni', 'admin', 'coordinator'), async (req, res) => {
  try {
    const job = new Job({
      ...req.body,
      postedBy: req.user.userId
    });
    
    await job.save();
    await job.populate('postedBy', 'name email department');
    
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apply for job (Student only)
router.post('/:id/apply', auth, authorize('student'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const alreadyApplied = job.applications.some(
      app => app.student.toString() === req.user.userId
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    job.applications.push({
      student: req.user.userId,
      status: 'pending',
      resumeUrl: req.body.resumeUrl || '',
      coverLetter: req.body.coverLetter || ''
    });

    await job.save();
    await job.populate('applications.student', 'name email enrollmentNumber');

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add review for job
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.reviews.push({
      user: req.user.userId,
      rating: req.body.rating,
      comment: req.body.comment
    });

    await job.save();
    await job.populate('reviews.user', 'name profilePicture');
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add FAQ
router.post('/:id/faqs', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.faqs.push({
      question: req.body.question,
      answer: req.body.answer || '',
      askedBy: req.user.userId,
      answeredBy: req.body.answer ? req.user.userId : null
    });

    await job.save();
    await job.populate('faqs.askedBy', 'name');
    await job.populate('faqs.answeredBy', 'name');
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add discussion
router.post('/:id/discussions', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.discussions.push({
      user: req.user.userId,
      message: req.body.message
    });

    await job.save();
    await job.populate('discussions.user', 'name profilePicture');
    await job.populate('discussions.replies.user', 'name profilePicture');
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reply to discussion
router.post('/:id/discussions/:discussionId/replies', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const discussion = job.discussions.id(req.params.discussionId);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    discussion.replies.push({
      user: req.user.userId,
      message: req.body.message
    });

    await job.save();
    await job.populate('discussions.user', 'name profilePicture');
    await job.populate('discussions.replies.user', 'name profilePicture');
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save/Unsave job
router.post('/:id/save', auth, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const jobId = job._id;
    const jobIndex = user.savedJobs.findIndex(savedJobId => savedJobId.toString() === jobId.toString());

    if (jobIndex > -1) {
      // Unsave
      user.savedJobs.splice(jobIndex, 1);
      await user.save();
      res.json({ message: 'Job unsaved', saved: false });
    } else {
      // Save
      user.savedJobs.push(jobId);
      await user.save();
      res.json({ message: 'Job saved', saved: true });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit referral request
router.post('/:id/referral', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already requested
    const alreadyRequested = job.referralRequests.some(
      req => req.requestedBy.toString() === req.user.userId
    );

    if (alreadyRequested) {
      return res.status(400).json({ message: 'You have already sent a referral request for this job' });
    }

    job.referralRequests.push({
      requestedBy: req.user.userId,
      resumeUrl: req.body.resumeUrl,
      coverLetter: req.body.coverLetter || '',
      status: 'pending'
    });

    await job.save();
    await job.populate('referralRequests.requestedBy', 'name email profilePicture role enrollmentNumber department');

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get related jobs
router.get('/:id/related', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const relatedJobs = await Job.find({
      _id: { $ne: job._id },
      $or: [
        { department: job.department },
        { company: job.company },
        { type: job.type }
      ],
      status: 'active'
    })
      .populate('postedBy', 'name email')
      .limit(6)
      .sort({ createdAt: -1 });

    res.json(relatedJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update application status (Alumni who posted / Coordinator / Admin)
router.put('/:jobId/applications/:appId', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check permissions
    const canUpdate = 
      job.postedBy.toString() === req.user.userId ||
      req.user.role === 'admin' ||
      (req.user.role === 'coordinator' && job.department === req.user.department);

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const application = job.applications.id(req.params.appId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (req.body.status) {
      application.status = req.body.status;
    }

    await job.save();

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update job (Owner / Admin / Coordinator)
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const canUpdate = 
      job.postedBy.toString() === req.user.userId ||
      req.user.role === 'admin' ||
      (req.user.role === 'coordinator' && job.department === req.user.department);

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(job, req.body);
    await job.save();
    await job.populate('postedBy', 'name email department');

    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete job (Owner / Admin / Coordinator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const canDelete = 
      job.postedBy.toString() === req.user.userId ||
      req.user.role === 'admin' ||
      (req.user.role === 'coordinator' && job.department === req.user.department);

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

