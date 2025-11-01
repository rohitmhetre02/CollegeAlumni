import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'coordinator', 'student', 'alumni'],
    required: true
  },
  department: {
    type: String,
    required: true
  },
  enrollmentNumber: {
    type: String,
    sparse: true
  },
  graduationYear: {
    type: Number
  },
  staffId: {
    type: String,
    sparse: true
  },
  phone: {
    type: String
  },
  location: {
    type: String
  },
  headline: {
    type: String
  },
  degree: {
    type: String
  },
  college: {
    type: String
  },
  birthDate: {
    type: String
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Transgender', 'Intersex', 'Non-binary', 'Others', 'Other', 'Prefer not to say', '']
  },
  industry: {
    type: String
  },
  workExperience: {
    type: Number,
    default: 0
  },
  profileLink: {
    type: String,
    unique: true,
    sparse: true
  },
  youtubeUrl: {
    type: String
  },
  instagramUrl: {
    type: String
  },
  currentPosition: {
    type: String
  },
  company: {
    type: String
  },
  // Social links
  linkedinUrl: { type: String },
  facebookUrl: { type: String },
  portfolioUrl: { type: String },
  githubUrl: { type: String },
  skills: {
    type: [String],
    default: []
  },
  projects: [{
    title: { type: String, required: true },
    githubLink: { type: String },
    projectLink: { type: String },
    description: { type: String },
    skills: { type: [String], default: [] },
    year: { type: Number }
  }],
  bio: {
    type: String
  },
  profilePicture: {
    type: String
  },
  resumeUrl: {
    type: String
  },
  languages: [{
    language: { type: String },
    proficiency: { type: String }
  }],
  experience: [{
    title: { type: String },
    company: { type: String },
    duration: { type: String },
    description: { type: String }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      // Students and alumni start as pending, others are approved
      return (this.role === 'student' || this.role === 'alumni') ? 'pending' : 'approved';
    }
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

