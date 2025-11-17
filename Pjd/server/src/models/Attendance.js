const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
	activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true, index: true },
	member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
	present: { type: Boolean, default: true },
	method: { type: String, enum: ['manual','qr'], default: 'manual' },
	recordedAt: { type: Date, default: Date.now },
	recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

// optional: prevent duplicate attendance for same member+activity
attendanceSchema.index({ activity: 1, member: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

