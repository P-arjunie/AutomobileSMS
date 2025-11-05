import mongoose from 'mongoose';

const serviceTypeSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  estimatedDuration: {
    type: Number,
    min: 0.5,
    max: 24,
    default: 2
  },
  basePrice: {
    type: Number,
    min: 0,
    default: 0
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

export default mongoose.model('ServiceType', serviceTypeSchema);
