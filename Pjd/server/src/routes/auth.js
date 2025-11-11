const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
	const { username, password } = req.body;
	const user = await User.findOne({ username });
	if (!user) return res.status(401).json({ message: 'Invalid credentials' });
	const ok = await bcrypt.compare(password, user.password);
	if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
	const token = jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
	res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
});

// Register
// If a role other than 'Viewer' is requested, require an Admin token.
router.post('/register', async (req, res) => {
	try {
		const { username, password, role } = req.body;
		if (!username || !password) return res.status(400).json({ message: 'username and password required' });
		const requestedRole = role || 'Viewer';

		// If requesting elevated role, ensure caller is Admin
		if (requestedRole !== 'Viewer') {
			const auth = req.headers['authorization'] || req.headers['Authorization'];
			if (!auth) return res.status(403).json({ message: 'Creating users with roles requires admin authorization' });
			const parts = auth.split(' ');
			if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(403).json({ message: 'Invalid authorization format' });
			try {
				const payload = jwt.verify(parts[1], process.env.JWT_SECRET || 'secret');
				if (payload.role !== 'Admin') return res.status(403).json({ message: 'Only Admin can create non-viewer users' });
			} catch (err) {
				return res.status(403).json({ message: 'Invalid token' });
			}
		}

		const exists = await User.findOne({ username });
		if (exists) return res.status(400).json({ message: 'Username already exists' });
		const hash = await bcrypt.hash(password, 10);
		const u = new User({ username, password: hash, role: requestedRole });
		await u.save();
		res.status(201).json({ id: u._id, username: u.username, role: u.role });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Optional: create user (admin only) - convenience
router.post('/create', authenticateJWT, requireRole('Admin'), async (req, res) => {
	try {
		const { username, password, role } = req.body;
		if (!username || !password) return res.status(400).json({ message: 'username and password required' });
		const exists = await User.findOne({ username });
		if (exists) return res.status(400).json({ message: 'Username already exists' });
		const hash = await bcrypt.hash(password, 10);
		const u = new User({ username, password: hash, role: role || 'Viewer' });
		await u.save();
		res.status(201).json({ id: u._id, username: u.username, role: u.role });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;

