import mongoose from 'mongoose';

const serviceLogSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  description: {
    type: String,
    required: [true, 'Work description is required'],
    maxlength: 1000
  },
  workType: {
    type: String,
    enum: [
      'diagnosis',
      'repair',
      'maintenance',
      'inspection',
      'parts-replacement',
      'testing',
      'cleanup',
      'documentation'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'paused', 'cancelled'],
    default: 'in-progress'
  },
  hoursLogged: {
    type: Number,
    min: 0,
    default: 0
  },
  parts: [{
    name: String,
    partNumber: String,
    quantity: Number,
    cost: Number
  }],
  laborCost: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    maxlength: 500
  },
  images: [{
    url: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
serviceLogSchema.index({ appointment: 1 });
serviceLogSchema.index({ employee: 1 });
serviceLogSchema.index({ startTime: 1 });
serviceLogSchema.index({ status: 1 });

// Calculate duration when endTime is set
serviceLogSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // in minutes
    this.hoursLogged = Math.round((this.duration / 60) * 100) / 100; // in hours, rounded to 2 decimal places
  }
  next();
});

// Virtual for total parts cost
serviceLogSchema.virtual('totalPartsCost').get(function() {
  return this.parts.reduce((total, part) => total + (part.cost * part.quantity), 0);
});

// Virtual for total cost
serviceLogSchema.virtual('totalCost').get(function() {
  return this.laborCost + this.totalPartsCost;
});

export default mongoose.model('ServiceLog', serviceLogSchema);
