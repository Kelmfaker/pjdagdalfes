import mongoose from 'mongoose';
import { getNextSequence } from './Counter.js';

const memberSchema = new mongoose.Schema({
  membershipId: { type: Number, unique: true, index: true },
  fullName: { type: String, required: true },
  phone: { type: String },
  email: { type: String, lowercase: true, trim: true },
  address: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['M', 'F', 'other'], default: 'other' },
  memberType: { type: String, enum: ['bureau', 'active', 'sympathizer'], required: true },
  role: { type: String }, // role if bureau member (e.g., president, treasurer)
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Assign a sequential membershipId on creation
memberSchema.pre('save', async function(next) {
  if (this.isNew && !this.membershipId) {
    try {
      this.membershipId = await getNextSequence('membershipId');
    } catch (err) {
      return next(err);
    }
  }
  next();
});

export default mongoose.model('Member', memberSchema);
