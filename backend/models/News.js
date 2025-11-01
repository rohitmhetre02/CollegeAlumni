import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String },
  publishedAt: { type: Date, default: Date.now },
  author: { type: String },
  department: { type: String }
}, {
  timestamps: true
});

export default mongoose.model('News', newsSchema);


