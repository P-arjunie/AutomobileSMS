import mongoose from 'mongoose';

const timeLogSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee is required'],
    index: true
  },
  serviceProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Service project is required'],
    index: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
    index: true
  },
  endTime: {
    type: Date,
    default: null
  },
  durationMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
timeLogSchema.index({ employee: 1, startTime: -1 });
timeLogSchema.index({ serviceProject: 1 });
timeLogSchema.index({ employee: 1, status: 1 });
timeLogSchema.index({ startTime: 1, endTime: 1 });

// Pre-save middleware to calculate duration
timeLogSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    const diffMs = this.endTime - this.startTime;
    this.durationMinutes = Math.round(diffMs / (1000 * 60));
  } else if (this.status === 'active') {
    // For active timers, calculate duration from start time to now
    const now = new Date();
    const diffMs = now - this.startTime;
    this.durationMinutes = Math.round(diffMs / (1000 * 60));
  }
  next();
});

// Virtual for duration in hours
timeLogSchema.virtual('durationHours').get(function() {
  return this.durationMinutes ? (this.durationMinutes / 60).toFixed(2) : 0;
});

// Method to check if time log overlaps with another
timeLogSchema.methods.hasOverlap = async function(employeeId, startTime, endTime) {
  const TimeLog = mongoose.model('TimeLog');
  
  const overlappingLogs = await TimeLog.find({
    employee: employeeId,
    _id: { $ne: this._id },
    status: { $ne: 'cancelled' },
    $or: [
      // New log starts during existing log
      {
        startTime: { $lte: startTime },
        endTime: { $gte: startTime }
      },
      // New log ends during existing log
      {
        startTime: { $lte: endTime },
        endTime: { $gte: endTime }
      },
      // New log completely encompasses existing log
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      },
      // Existing active log (no endTime)
      {
        startTime: { $lte: endTime },
        endTime: null,
        status: 'active'
      }
    ]
  });

  return overlappingLogs.length > 0;
};

export default mongoose.model('TimeLog', timeLogSchema);

