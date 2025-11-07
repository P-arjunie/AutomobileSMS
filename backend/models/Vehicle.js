import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
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
    uppercase: true,
    index: true
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
}, { timestamps: true });

vehicleSchema.index({ owner: 1, licensePlate: 1 }, { unique: true });

export default mongoose.model('Vehicle', vehicleSchema);
import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required'],
    index: true
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true,
    maxlength: [50, 'Make cannot exceed 50 characters']
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true,
    maxlength: [50, 'Model cannot exceed 50 characters']
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
    min: [1900, 'Year must be 1900 or later'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    trim: true,
    uppercase: true,
    maxlength: [20, 'License plate cannot exceed 20 characters'],
    unique: true,
    index: true
  },
  vin: {
    type: String,
    required: [true, 'VIN is required'],
    trim: true,
    uppercase: true,
    minlength: [17, 'VIN must be exactly 17 characters'],
    maxlength: [17, 'VIN must be exactly 17 characters'],
    unique: true,
    validate: {
      validator: function(v) {
        // Basic VIN validation (17 characters, alphanumeric except I, O, Q)
        return /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
      },
      message: 'Please provide a valid VIN (17 characters, no I, O, Q)'
    }
  },
  color: {
    type: String,
    required: [true, 'Vehicle color is required'],
    trim: true,
    maxlength: [30, 'Color cannot exceed 30 characters']
  },
  mileage: {
    type: Number,
    required: [true, 'Mileage is required'],
    min: [0, 'Mileage cannot be negative'],
    max: [999999, 'Mileage seems unrealistic']
  },
  imageUrl: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional vehicle information
  engineType: {
    type: String,
    enum: ['gasoline', 'diesel', 'hybrid', 'electric', 'other'],
    default: 'gasoline'
  },
  transmission: {
    type: String,
    enum: ['manual', 'automatic', 'cvt'],
    default: 'automatic'
  },
  fuelCapacity: {
    type: Number,
    min: [1, 'Fuel capacity must be positive'],
    max: [200, 'Fuel capacity seems unrealistic']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
vehicleSchema.index({ customerId: 1, isActive: 1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ vin: 1 });
vehicleSchema.index({ make: 1, model: 1 });

// Virtual for vehicle display name
vehicleSchema.virtual('displayName').get(function() {
  return `${this.year} ${this.make} ${this.model}`;
});

// Virtual for service history (populated separately)
vehicleSchema.virtual('serviceHistory', {
  ref: 'Appointment',
  localField: '_id',
  foreignField: 'vehicleId'
});

// Pre-save middleware for data cleaning
vehicleSchema.pre('save', function(next) {
  // Clean and format license plate
  if (this.licensePlate) {
    this.licensePlate = this.licensePlate.replace(/[^A-Z0-9]/g, '').toUpperCase();
  }
  
  // Clean and format VIN
  if (this.vin) {
    this.vin = this.vin.replace(/[^A-HJ-NPR-Z0-9]/g, '').toUpperCase();
  }
  
  next();
});

// Static method to find vehicles by customer
vehicleSchema.statics.findByCustomer = function(customerId, options = {}) {
  const query = { customerId, isActive: true };
  
  if (options.search) {
    const searchRegex = new RegExp(options.search, 'i');
    query.$or = [
      { make: searchRegex },
      { model: searchRegex },
      { licensePlate: searchRegex },
      { color: searchRegex }
    ];
  }
  
  return this.find(query).sort(options.sort || { createdAt: -1 });
};

// Instance method to check ownership
vehicleSchema.methods.isOwnedBy = function(customerId) {
  return this.customerId.toString() === customerId.toString();
};

// Instance method to get service count
vehicleSchema.methods.getServiceCount = async function() {
  const Appointment = mongoose.model('Appointment');
  return await Appointment.countDocuments({ vehicleId: this._id });
};

// Instance method to get last service date
vehicleSchema.methods.getLastServiceDate = async function() {
  const Appointment = mongoose.model('Appointment');
  const lastService = await Appointment.findOne({ 
    vehicleId: this._id,
    status: 'completed'
  }).sort({ updatedAt: -1 });
  
  return lastService ? lastService.updatedAt : null;
};

export default mongoose.model('Vehicle', vehicleSchema);
