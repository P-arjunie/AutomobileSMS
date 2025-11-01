import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true,
    index: true
  },
  refreshToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

sessionSchema.index({ userId: 1, expiresAt: 1 });

export default mongoose.model('Session', sessionSchema);
