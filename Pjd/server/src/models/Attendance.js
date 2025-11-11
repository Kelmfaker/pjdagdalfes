const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
	activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
	member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
	status: { type: String, enum: ['Present','Absent','Excused'], default: 'Present' },
	recordedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);

