import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const getRoomId = (id1, id2) => ([id1, id2].sort().join('_'));

// Backend duplicate of canSend logic
const canSend = (from, to) => {
  if (!from || !to) return false;
  if ((from.role === 'student' || from.role === 'alumni') && (to.role === 'student' || to.role === 'alumni' || to.role === 'coordinator'))
    return true;
  if ((from.role === 'coordinator') && (to.role === 'student' || to.role === 'alumni' || to.role === 'admin'))
    return true;
  if (from.role === 'admin' && to.role === 'coordinator')
    return true;
  return false;
};

// Get chat history with another user
router.get('/:userId', auth, async (req, res) => {
  const currentUser = req.user;
  const otherId = req.params.userId;
  const otherUser = await User.findById(otherId);
  if (!otherUser) return res.status(404).json({ message: 'User not found' });
  if (!canSend(currentUser, otherUser) && !canSend(otherUser, currentUser)) return res.status(403).json({ message: 'Forbidden' });
  const roomId = getRoomId(currentUser._id.toString(), otherId);
  const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
  res.json(messages);
});

// List potential chat partners (for user search/selection)
router.get('/', auth, async (req, res) => {
  const currentUser = req.user;
  // Get users currentUser can message, or who can message currentUser
  const users = await User.find({ _id: { $ne: currentUser._id } }).select('name role department');
  const filtered = users.filter(u => canSend(currentUser, u) || canSend(u, currentUser));
  res.json(filtered);
});

export default router;
