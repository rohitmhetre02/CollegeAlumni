import mongoose from 'mongoose';

const mentorshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  domain: {
    type: String
  },
  expertise: [{
    type: String
  }],
  topics: [{
    type: String
  }],
  skills: [{
    type: String
  }],
  fluentIn: [{
    language: String,
    proficiency: String
  }],
  about: {
    type: String
  },
  mentees: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  maxMentees: {
    type: Number,
    default: 5
  },
  status: {
    type: String,
    enum: ['active', 'full', 'closed'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  reviews: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resources: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    type: {
      type: String,
      enum: ['resource', '1:1_call'],
      required: true
    },
    fileUrl: {
      type: String
    },
    price: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number // in minutes for 1:1 calls
    },
    isFree: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  achievements: [{
    title: String,
    description: String,
    year: Number
  }],
  menteeEngagements: {
    type: Number,
    default: 0
  },
  averageAttendance: {
    type: Number,
    default: 100
  },
  isTopMentor: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate average rating
mentorshipSchema.methods.calculateRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.totalRatings = 0;
    return;
  }
  
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating = parseFloat((totalRating / this.reviews.length).toFixed(1));
  this.totalRatings = this.reviews.length;
};

// Update rating before saving
mentorshipSchema.pre('save', function(next) {
  this.calculateRating();
  next();
});

export default mongoose.model('Mentorship', mentorshipSchema);

