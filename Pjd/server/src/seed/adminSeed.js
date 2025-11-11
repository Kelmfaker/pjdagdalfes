// Seed script: ensure an Admin user exists (idempotent)
const dotenv = require('dotenv');
const path = require('path');
// prefer server .env (already loaded by app in normal run), but support local execution
const envPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mam_system';

async function run() {
	try {
		await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
		console.log('Connected to MongoDB for seeding');

		const username = process.env.ADMIN_USERNAME || 'admin';
		const password = process.env.ADMIN_PASSWORD || 'admin123';
		const role = process.env.ADMIN_ROLE || 'Admin';

		let user = await User.findOne({ username });
		if (user) {
			console.log('Admin user already exists:', username);
		} else {
			const hash = await bcrypt.hash(password, 10);
			user = new User({ username, password: hash, role });
			await user.save();
			console.log('Created admin user:', username);
		}
	} catch (err) {
		console.error('Seed error:', err && err.message ? err.message : err);
		process.exitCode = 1;
	} finally {
		await mongoose.disconnect();
	}
}

run();

