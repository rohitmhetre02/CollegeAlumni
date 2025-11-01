import express from 'express';
import Event from '../models/Event.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const { department, status } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;

    const events = await Event.find(filter)
      .populate('organizer', 'name email department')
      .populate('attendees.user', 'name email role')
      .sort({ date: 1 });
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get event by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email department')
      .populate('attendees.user', 'name email role department');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event (Alumni, Admin, Coordinator)
router.post('/', auth, authorize('alumni', 'admin', 'coordinator'), async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      organizer: req.user.userId
    });
    
    await event.save();
    await event.populate('organizer', 'name email department');
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Register for event (Student/Alumni)
router.post('/:id/register', auth, authorize('student', 'alumni'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already registered
    const alreadyRegistered = event.attendees.some(
      attendee => attendee.user.toString() === req.user.userId
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check if event is full
    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ message: 'Event is full' });
    }

    event.attendees.push({
      user: req.user.userId
    });

    await event.save();
    await event.populate('attendees.user', 'name email role');

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update event (Owner / Admin / Coordinator)
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const canUpdate = 
      event.organizer.toString() === req.user.userId ||
      req.user.role === 'admin' ||
      (req.user.role === 'coordinator' && event.department === req.user.department);

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(event, req.body);
    await event.save();
    await event.populate('organizer', 'name email department');

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete event (Owner / Admin / Coordinator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const canDelete = 
      event.organizer.toString() === req.user.userId ||
      req.user.role === 'admin' ||
      (req.user.role === 'coordinator' && event.department === req.user.department);

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

