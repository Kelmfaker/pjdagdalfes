const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Create or reset an admin account using a one-time SETUP_SECRET.
// POST /api/setup/create-admin
// Body: { username, password }
// Header or query: ?secret= or header 'x-setup-secret'
router.post('/create-admin', async (req, res) => {
	try {
		const secret = req.headers['x-setup-secret'] || req.query.secret;
		if (!process.env.SETUP_SECRET) return res.status(500).json({ message: 'Setup not enabled on server' });
		if (!secret || secret !== process.env.SETUP_SECRET) return res.status(403).json({ message: 'Invalid setup secret' });

		const { username = 'admin', password = 'admin123' } = req.body || {};
		if (!username || !password) return res.status(400).json({ message: 'username and password required' });

		const hash = await bcrypt.hash(password, 10);
		const u = await User.findOneAndUpdate(
			{ username },
			{ $set: { password: hash, role: 'Admin' } },
			{ upsert: true, new: true }
		);
		res.json({ ok: true, created: true, username: u.username, id: u._id });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;

