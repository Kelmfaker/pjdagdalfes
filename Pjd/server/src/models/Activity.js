const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
	title: { type: String, required: true },
	type: { type: String },
	description: { type: String },
	location: { type: String },
	date: { type: Date },
	responsible: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
	status: { type: String, default: 'scheduled' },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', activitySchema);

