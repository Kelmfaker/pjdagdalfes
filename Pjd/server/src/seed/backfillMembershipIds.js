const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// load root .env if exists
const projectEnv = path.join(__dirname, '..', '..', '.env');
if (require('fs').existsSync(projectEnv)) dotenv.config({ path: projectEnv });

const Member = require('../models/Member');
const Counter = require('../models/Counter');

async function run() {
	const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mam_system';
	await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
	console.log('Connected to MongoDB for backfill');

	// ensure counter exists
	let counter = await Counter.findOne({ _id: 'membershipId' });
	if (!counter) {
		counter = new Counter({ _id: 'membershipId', seq: 0 });
		await counter.save();
	}

	const members = await Member.find({ $or: [{ membershipId: { $exists: false } }, { membershipId: null }] });
	console.log('Members to backfill:', members.length);
	for (const m of members) {
		const res = await Counter.findOneAndUpdate({ _id: 'membershipId' }, { $inc: { seq: 1 } }, { new: true });
		// Avoid running full schema validation on legacy documents with differing enum values
		await Member.updateOne({ _id: m._id }, { $set: { membershipId: res.seq } }, { runValidators: false });
		console.log('Assigned membershipId', res.seq, 'to', m.fullName || m._id);
	}

	console.log('Backfill complete');
	process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
