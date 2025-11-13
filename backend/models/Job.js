import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  companyLogo: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  department: {
    type: String,
    required: true
  },
  requirements: [{
    type: String
  }],
  responsibilities: [{
    type: String
  }],
  eligibility: {
    minEducation: String,
    minExperience: String,
    skills: [String],
    other: String
  },
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  experience: {
    min: Number,
    max: Number,
    unit: { type: String, default: 'years' }
  },
  workMode: {
    type: String,
    enum: ['remote', 'hybrid', 'onsite'],
    default: 'onsite'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected'],
      default: 'pending'
    },
    resumeUrl: {
      type: String
    },
    coverLetter: {
      type: String
    }
  }],
  referralRequests: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    resumeUrl: {
      type: String,
      required: true
    },
    coverLetter: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  importantDates: {
    applicationDeadline: Date,
    startDate: Date,
    endDate: Date
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  faqs: [{
    question: String,
    answer: String,
    askedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  discussions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    replies: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  referAndWin: {
    enabled: Boolean,
    reward: String,
    description: String,
    title: String,
    image: String
  },
  importantNote: {
    type: String
  },
  shortSummary: {
    type: String
  },
  workDays: {
    type: String,
    default: 'Working Days: 5 Days'
  },
  bannerImage: {
    type: String
  },
  featuredItems: [{
    title: String,
    subtitle: String,
    image: String
  }],
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Job', jobSchema);

