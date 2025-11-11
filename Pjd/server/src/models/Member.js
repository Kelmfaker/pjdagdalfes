const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
	fullName: { type: String, required: true },
	membershipId: { type: String, index: true, unique: false, sparse: true },
	joinDate: { type: Date },
	memberType: { type: String },
	status: { type: String, default: 'active' },
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Member', memberSchema);

