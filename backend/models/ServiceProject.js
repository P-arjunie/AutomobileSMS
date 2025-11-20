import mongoose from 'mongoose';

const serviceProjectSchema = new mongoose.Schema({
  appointment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
  },
  assigned_employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  start_time: {
    type: Date,
  },
  end_time: {
    type: Date,
  },
  current_status: {
    type: String,
    enum: ['Checked In', 'Diagnosis', 'In Progress', 'Quality Check', 'Completed'],
    default: 'Checked In',
  },
  estimated_completion: {
    type: Date,
  },
}, { timestamps: true });

export default mongoose.model('ServiceProject', serviceProjectSchema);
