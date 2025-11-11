const express = require('express');
const Member = require('../models/Member');
const { authenticateJWT, requireAnyRole, requireRole } = require('../middleware/auth');

const router = express.Router();

// Require authentication for member endpoints
router.use(authenticateJWT);

// Create member (Admin or Secretary)
router.post('/', requireAnyRole('Admin','Secretary'), async (req, res) => {
	try {
		const m = new Member(req.body);
		await m.save();
		res.status(201).json(m);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// List / search - any authenticated role
router.get('/', async (req, res) => {
	const { q, memberType, status, page = 1, limit = 20 } = req.query;
	const filter = {};
	if (q) filter.fullName = { $regex: q, $options: 'i' };
	if (memberType) filter.memberType = memberType;
	if (status) filter.status = status;
	const items = await Member.find(filter).skip((page-1)*limit).limit(parseInt(limit));
	res.json(items);
});

// Get by id
router.get('/:id', async (req, res) => {
	const m = await Member.findById(req.params.id);
	if (!m) return res.status(404).json({ message: 'Not found' });
	res.json(m);
});

// Update (Admin or Secretary)
router.put('/:id', requireAnyRole('Admin','Secretary'), async (req, res) => {
	const m = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
	res.json(m);
});

// Delete (Admin only)
router.delete('/:id', requireRole('Admin'), async (req, res) => {
	await Member.findByIdAndDelete(req.params.id);
	res.json({ ok: true });
});

module.exports = router;

