import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'coordinator', 'student', 'alumni'], required: true },
  type: { 
    type: String, 
    enum: ['job_post', 'event_create', 'news_post', 'mentorship_create', 'job_apply', 'event_register', 'profile_update', 'other'],
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String },
  metadata: { type: Object }
}, {
  timestamps: true
});

export default mongoose.model('Activity', activitySchema);


