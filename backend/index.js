import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from './models/Message.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohitmhetre2004:MrRoya02@alumniportal.cnjugkh.mongodb.net/?appName=AlumniPortal';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import jobRoutes from './routes/jobs.js';
import eventRoutes from './routes/events.js';
import mentorshipRoutes from './routes/mentorships.js';
import departmentRoutes from './routes/departments.js';
import facultyRoutes from './routes/faculty.js';
import newsRoutes from './routes/news.js';
import activityRoutes from './routes/activities.js';
import galleryRoutes from './routes/gallery.js';
import uploadRoutes from './routes/upload.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/mentorships', mentorshipRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/upload', uploadRoutes);

const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: { origin: '*', methods: ["GET", "POST"] }
});

// Role-based communication rules (returns true if sender can chat with recipient user doc)
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

const getRoomId = (id1, id2) => ([id1, id2].sort().join('_'));

// Socket.IO middleware for JWT authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shhhhh');
    const user = await User.findById(decoded.userId || decoded.id);
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  // Join a room for each chat a user starts
  socket.on('joinRoom', ({ targetUserId }) => {
    const roomId = getRoomId(user._id.toString(), targetUserId);
    socket.join(roomId);
  });

  // Send message event
  socket.on('sendMessage', async ({ to, content }, callback) => {
    try {
      // Validate input
      if (!to || !content || !content.trim()) {
        if (callback) callback({ error: 'Invalid message data' });
        return;
      }

      // Find target user, enforce rules
      const toUser = await User.findById(to);
      if (!toUser) {
        if (callback) callback({ error: 'Recipient not found' });
        return;
      }

      if (!canSend(user, toUser)) {
        if (callback) callback({ error: 'Not allowed to send message to this user' });
        return;
      }

      const roomId = getRoomId(user._id.toString(), toUser._id.toString());
      
      // Create message in database
      const msg = await Message.create({
        sender: user._id,
        recipient: toUser._id,
        content: content.trim(),
        roomId
      });

      // Populate sender info for frontend
      await msg.populate('sender', 'name email role');
      
      // Emit to both users in the room
      const messageData = {
        _id: msg._id,
        sender: user._id.toString(),
        recipient: toUser._id.toString(),
        content: msg.content,
        createdAt: msg.createdAt,
        roomId,
        read: false
      };

      io.to(roomId).emit('newMessage', messageData);
      
      // Send callback confirmation
      if (callback) callback({ success: true, message: messageData });
      
      console.log(`✅ Message sent from ${user._id} to ${toUser._id} in room ${roomId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      if (callback) callback({ error: 'Failed to send message' });
    }
  });

  // Mark as read (optional: implement as needed)
  socket.on('markRead', async ({ roomId }) => {
    await Message.updateMany({ roomId, recipient: user._id }, { read: true });
    io.to(roomId).emit('messagesRead', { roomId, by: user._id });
  });
});

// REST API for chat history
import messagesRouter from './routes/messages.js';
app.use('/api/messages', messagesRouter);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Alumni Portal API is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server+Socket.IO running on port ${PORT}`));

