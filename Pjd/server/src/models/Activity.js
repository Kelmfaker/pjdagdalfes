const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
	title: { type: String, required: true, index: true },
	type: { type: String, enum: ['meeting','course','campaign','other'], default: 'other' },
	description: { type: String },
	location: { type: String },
	date: { type: Date, index: true },
	responsibles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	status: { type: String, enum: ['scheduled','done','postponed'], default: 'scheduled' },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);

