import mongoose from 'mongoose';

const serviceStatusHistorySchema = new mongoose.Schema({
  service_project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProject',
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: { createdAt: 'timestamp' } });

export default mongoose.model('ServiceStatusHistory', serviceStatusHistorySchema);
