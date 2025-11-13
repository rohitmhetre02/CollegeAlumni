import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['event', 'batch', 'project', 'campus', 'achievement', 'other']
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  project: {
    type: String,
    trim: true
  },
  batch: {
    type: String,
    trim: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  graduationYear: {
    type: Number
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
gallerySchema.index({ category: 1, uploadedAt: -1 });
gallerySchema.index({ batch: 1, uploadedAt: -1 });
gallerySchema.index({ event: 1 });
gallerySchema.index({ uploadedBy: 1 });

export default mongoose.model('Gallery', gallerySchema);

