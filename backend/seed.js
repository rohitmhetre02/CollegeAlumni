import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import User from './models/User.js';
import Job from './models/Job.js';
import Event from './models/Event.js';
import Faculty from './models/Faculty.js';
import News from './models/News.js';
import Activity from './models/Activity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohitmhetre2004:MrRoya02@alumniportal.cnjugkh.mongodb.net/?appName=AlumniPortal';

async function connect() {
  await mongoose.connect(MONGODB_URI);
}

async function seedUsers() {
  const departments = ['CSE', 'ECE', 'ME', 'CE'];
  const createUser = async (idx, role) => {
    const email = `${role}${idx}@example.com`;
    const exists = await User.findOne({ email });
    if (exists) return exists;
    const user = new User({
      name: `${role} User ${idx}`,
      email,
      password: 'password123',
      role,
      department: departments[idx % departments.length],
      enrollmentNumber: role === 'student' ? `ENR${idx}2025` : undefined,
      graduationYear: role === 'alumni' ? 2018 + idx : undefined,
      currentPosition: role === 'alumni' ? 'Software Engineer' : undefined,
      company: role === 'alumni' ? 'TechCorp' : undefined
    });
    await user.save();
    return user;
  };

  const students = await Promise.all([1,2,3,4,5].map(i => createUser(i, 'student')));
  const alumni = await Promise.all([1,2,3,4,5].map(i => createUser(i, 'alumni')));
  // Ensure an admin and coordinator exist for ownership fields
  const admin = await User.findOneAndUpdate(
    { email: 'admin@example.com' },
    { name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin', department: 'CSE' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const coordinator = await User.findOneAndUpdate(
    { email: 'coordinator@example.com' },
    { name: 'Coordinator', email: 'coordinator@example.com', password: 'password123', role: 'coordinator', department: 'CSE' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { students, alumni, admin, coordinator };
}

async function seedFaculty() {
  const base = [1,2,3,4,5];
  for (const i of base) {
    const email = `faculty${i}@example.com`;
    const exists = await Faculty.findOne({ email });
    if (exists) continue;
    await Faculty.create({
      name: `Faculty Member ${i}`,
      email,
      department: ['CSE','ECE','ME','CE'][i % 4],
      designation: ['Professor','Associate Professor','Assistant Professor'][i % 3],
      phone: `99900000${i}${i}`,
      bio: 'Experienced faculty member with a passion for teaching.',
      profilePicture: ''
    });
  }
}

async function seedJobs(ownerId) {
  const base = [1,2,3,4,5];
  for (const i of base) {
    const title = `Software Engineer ${i}`;
    const exists = await Job.findOne({ title, company: 'TechCorp' });
    if (exists) continue;
    await Job.create({
      title,
      description: 'Work on modern web applications and services.',
      company: 'TechCorp',
      location: 'Pune',
      type: ['full-time','part-time','contract','internship'][i % 4],
      department: ['CSE','ECE','ME','CE'][i % 4],
      requirements: ['JS', 'React', 'Node'],
      salary: { min: 600000, max: 1200000, currency: 'INR' },
      postedBy: ownerId,
      status: 'active'
    });
  }
}

async function seedEvents(ownerId) {
  const base = [1,2,3,4,5];
  for (const i of base) {
    const title = `Alumni Meetup ${i}`;
    const exists = await Event.findOne({ title });
    if (exists) continue;
    await Event.create({
      title,
      description: 'Networking and knowledge sharing.',
      date: new Date(Date.now() + i * 86400000),
      time: '10:00 AM',
      location: 'Auditorium',
      department: ['CSE','ECE','ME','CE'][i % 4],
      organizer: ownerId,
      maxAttendees: 100,
      category: 'networking',
      status: 'upcoming'
    });
  }
}

async function seedNews() {
  const base = [1,2,3,4,5];
  for (const i of base) {
    const title = `Department News ${i}`;
    const exists = await News.findOne({ title });
    if (exists) continue;
    await News.create({
      title,
      summary: 'Short summary of the news update.',
      content: 'Detailed content of the news post for the alumni portal.',
      image: '',
      publishedAt: new Date(),
      author: 'Editorial Team',
      department: ['CSE','ECE','ME','CE'][i % 4]
    });
  }
}

async function run() {
  try {
    await connect();
    const { alumni } = await seedUsers();
    const owner = alumni[0];
    await seedFaculty();
    await seedJobs(owner._id);
    await seedEvents(owner._id);
    await seedNews();
    // Seed activities for admin/coordinator/alumni
    const admin = await User.findOne({ role: 'admin' });
    const coordinator = await User.findOne({ role: 'coordinator' });
    const actExists = await Activity.findOne();
    if (!actExists) {
      await Activity.insertMany([
        { user: admin._id, role: 'admin', type: 'news_post', title: 'Published campus update', description: 'Shared important notice for all users.' },
        { user: coordinator._id, role: 'coordinator', type: 'event_create', title: 'Created Tech Talk', description: 'Scheduled a talk in department.' },
        { user: owner._id, role: 'alumni', type: 'job_post', title: 'Posted job at TechCorp', description: 'Opened 3 positions for freshers.' },
        { user: owner._id, role: 'alumni', type: 'event_register', title: 'Registered for Alumni Meetup', description: 'Will attend upcoming meetup.' },
        { user: owner._id, role: 'alumni', type: 'profile_update', title: 'Updated profile', description: 'Changed current position details.' }
      ]);
    }
    console.log('✅ Seed completed');
  } catch (e) {
    console.error('❌ Seed error', e);
  } finally {
    await mongoose.disconnect();
  }
}

run();


