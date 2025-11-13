import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
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
  try {
    const currentUser = req.user;
    if (!currentUser || !currentUser.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const otherId = req.params.userId;
    const otherUser = await User.findById(otherId);
    if (!otherUser) return res.status(404).json({ message: 'User not found' });
    
    if (!canSend(currentUser, otherUser) && !canSend(otherUser, currentUser)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    const roomId = getRoomId(currentUser.userId.toString(), otherId);
    const messages = await Message.find({ roomId })
      .populate('sender', 'name email role profilePicture')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: error.message });
  }
});

// List potential chat partners (for user search/selection)
router.get('/', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser || !currentUser.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get users currentUser can message, or who can message currentUser
    const users = await User.find({ _id: { $ne: currentUser.userId } }).select('name role department profilePicture');
    const filtered = users.filter(u => canSend(currentUser, u) || canSend(u, currentUser));
    
    // Get conversation metadata for each user
    const usersWithMetadata = await Promise.all(filtered.map(async (u) => {
      const roomId = getRoomId(currentUser.userId.toString(), u._id.toString());
      const conversation = await Conversation.findOne({ roomId });
      
      // Check if pinned by current user
      const isPinned = conversation?.pinnedBy?.some(
        p => p.user?.toString() === currentUser.userId.toString()
      ) || false;
      
      // Check if deleted by current user
      const isDeleted = conversation?.deletedBy?.some(
        d => d.user?.toString() === currentUser.userId.toString()
      ) || false;
      
      // Get last message
      const lastMessage = await Message.findOne({ roomId })
        .sort({ createdAt: -1 })
        .limit(1)
        .populate('sender', 'name');
      
      return {
        ...u.toObject(),
        pinned: isPinned,
        deleted: isDeleted,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          sender: lastMessage.sender
        } : null
      };
    }));
    
    // Filter out deleted conversations and sort (pinned first, then by last message time)
    const activeUsers = usersWithMetadata
      .filter(u => !u.deleted)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const aTime = a.lastMessage?.createdAt || 0;
        const bTime = b.lastMessage?.createdAt || 0;
        return bTime - aTime;
      });
    
    res.json(activeUsers);
  } catch (error) {
    console.error('Error fetching chat partners:', error);
    res.status(500).json({ message: error.message });
  }
});

// Pin/Unpin conversation
router.post('/:userId/pin', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser || !currentUser.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const otherUserId = req.params.userId;
    if (!otherUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const roomId = getRoomId(currentUser.userId.toString(), otherUserId);
    
    let conversation = await Conversation.findOne({ roomId });
    
    if (!conversation) {
      // Create conversation if it doesn't exist
      conversation = await Conversation.create({
        roomId,
        participants: [currentUser.userId, otherUserId]
      });
    }
    
    const isPinned = conversation.pinnedBy?.some(
      p => p.user?.toString() === currentUser.userId.toString()
    ) || false;
    
    if (isPinned) {
      // Unpin
      conversation.pinnedBy = (conversation.pinnedBy || []).filter(
        p => p.user?.toString() !== currentUser.userId.toString()
      );
    } else {
      // Pin
      if (!conversation.pinnedBy) {
        conversation.pinnedBy = [];
      }
      // Check if already pinned
      const alreadyPinned = conversation.pinnedBy.some(
        p => p.user?.toString() === currentUser.userId.toString()
      );
      if (!alreadyPinned) {
        conversation.pinnedBy.push({ user: currentUser.userId });
      }
    }
    
    await conversation.save();
    res.json({ 
      success: true,
      pinned: !isPinned, 
      message: !isPinned ? 'Conversation pinned' : 'Conversation unpinned' 
    });
  } catch (error) {
    console.error('Error pinning conversation:', error);
    res.status(500).json({ message: error.message || 'Failed to pin/unpin conversation' });
  }
});

// Delete/Remove conversation
router.post('/:userId/delete', auth, async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser || !currentUser.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const otherUserId = req.params.userId;
    if (!otherUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const roomId = getRoomId(currentUser.userId.toString(), otherUserId);
    
    let conversation = await Conversation.findOne({ roomId });
    
    if (!conversation) {
      conversation = await Conversation.create({
        roomId,
        participants: [currentUser.userId, otherUserId]
      });
    }
    
    // Check if already deleted
    const isDeleted = conversation.deletedBy?.some(
      d => d.user?.toString() === currentUser.userId.toString()
    ) || false;
    
    if (!isDeleted) {
      // Mark as deleted
      if (!conversation.deletedBy) {
        conversation.deletedBy = [];
      }
      conversation.deletedBy.push({
        user: currentUser.userId,
        deletedAt: new Date()
      });
      await conversation.save();
    }
    
    res.json({ 
      success: true,
      deleted: true, 
      message: 'Conversation removed' 
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: error.message || 'Failed to remove conversation' });
  }
});

export default router;
