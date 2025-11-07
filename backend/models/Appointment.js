import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: false, // Optional - can be null for appointments made before vehicle management
    index: true
  },
  vehicle: {
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Vehicle year is required'],
      min: 1900,
      max: new Date().getFullYear() + 1
    },
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      trim: true,
      uppercase: true
    },
    vin: {
      type: String,
      trim: true,
      maxlength: 17
    },
    mileage: {
      type: Number,
      min: 0
    }
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'waiting-parts', 'completed', 'cancelled'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  estimatedDuration: {
    type: Number, // in hours
    default: 2
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  estimatedCost: {
    type: Number,
    min: 0,
    default: 0
  },
  actualCost: {
    type: Number,
    min: 0,
    default: 0
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  notes: [{
    text: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    url: String,
    description: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  modificationRequests: [{
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    newScheduledDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
appointmentSchema.index({ customer: 1 });
appointmentSchema.index({ vehicleId: 1 });
appointmentSchema.index({ assignedEmployee: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ scheduledDate: 1 });
appointmentSchema.index({ 'vehicle.licensePlate': 1 });

// Calculate actual duration
appointmentSchema.virtual('actualDuration').get(function() {
  if (this.startTime && this.endTime) {
    return (this.endTime - this.startTime) / (1000 * 60 * 60); // in hours
  }
  return null;
});

// Check if appointment is overdue
appointmentSchema.virtual('isOverdue').get(function() {
  return this.scheduledDate < new Date() && this.status !== 'completed' && this.status !== 'cancelled';
});

export default mongoose.model('Appointment', appointmentSchema);
