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
