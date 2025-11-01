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
  socket.on('sendMessage', async ({ to, content }) => {
    // Find target user, enforce rules
    const toUser = await User.findById(to);
    if (!canSend(user, toUser)) return;
    const roomId = getRoomId(user._id.toString(), toUser._id.toString());
    const msg = await Message.create({
      sender: user._id,
      recipient: toUser._id,
      content,
      roomId
    });
    io.to(roomId).emit('newMessage', {
      _id: msg._id,
      sender: user._id,
      recipient: toUser._id,
      content: msg.content,
      createdAt: msg.createdAt,
      roomId
    });
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

