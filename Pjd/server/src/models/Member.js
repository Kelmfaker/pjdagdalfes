const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
	membershipId: { type: Number, index: true, unique: true, sparse: true },
	fullName: { type: String, required: true, index: true },
	phone: { type: String, index: true, sparse: true },
	email: { type: String, index: true, sparse: true, unique: false },
	address: { type: String },
	dob: { type: Date },
	gender: { type: String, enum: ['male','female','other'], default: 'other' },
	memberType: { type: String, enum: ['office','worker','sympathizer'], default: 'worker' },
	role: { type: String, default: null }, // for office members
	status: { type: String, enum: ['active','inactive'], default: 'active' },
	joinDate: { type: Date, default: Date.now },
	createdAt: { type: Date, default: Date.now }
});

// Auto-increment membershipId using Counter model when creating a new member without one
memberSchema.pre('save', async function(next) {
	if (this.membershipId) return next();
	try {
		const Counter = require('./Counter');
		const res = await Counter.findOneAndUpdate({ _id: 'membershipId' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
		this.membershipId = res.seq;
		return next();
	} catch (err) {
		return next(err);
	}
});

module.exports = mongoose.model('Member', memberSchema);

