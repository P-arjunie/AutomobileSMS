import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Report name is required'],
    trim: true,
    maxlength: [200, 'Report name cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: [
      'service-completion',
      'employee-productivity',
      'customer-history',
      'revenue',
      'appointments',
      'custom'
    ]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  format: {
    type: String,
    enum: ['json', 'csv', 'pdf', 'excel'],
    default: 'json'
  },
  filters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isSaved: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for better performance
reportSchema.index({ createdBy: 1 });
reportSchema.index({ type: 1 });
reportSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
reportSchema.index({ createdAt: -1 });

export default mongoose.model('Report', reportSchema);

