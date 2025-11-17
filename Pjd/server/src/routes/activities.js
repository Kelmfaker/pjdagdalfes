const express = require('express');
const Activity = require('../models/Activity');
const Attendance = require('../models/Attendance');
const { authenticateJWT, requireAnyRole, requireRole } = require('../middleware/auth');

const router = express.Router();

// Require authentication
router.use(authenticateJWT);

// Create activity (Admin or Secretary)
router.post('/', requireAnyRole('Admin','Secretary'), async (req, res) => {
	try {
		// accept only allowed fields to avoid accidental injection
		const { title, type, description, location, date, responsibles, status } = req.body;
		const doc = { title, type, description, location, status };
		if (date) doc.date = new Date(date);
		if (Array.isArray(responsibles)) doc.responsibles = responsibles;

		const a = new Activity(doc);
		await a.save();
		res.status(201).json(a);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// List activities
router.get('/', async (req, res) => {
	const { q, status, page = 1, limit = 50 } = req.query;
	const filter = {};
	if (q) filter.title = { $regex: q, $options: 'i' };
	if (status) filter.status = status;
	const items = await Activity.find(filter)
		.sort({ date: 1 })
		.skip((page-1)*limit)
		.limit(parseInt(limit))
		.populate('responsibles');
	res.json(items);
});

// Get by id
router.get('/:id', async (req, res) => {
	const a = await Activity.findById(req.params.id).populate('responsibles');
	if (!a) return res.status(404).json({ message: 'Not found' });
	res.json(a);
});

// Update (Admin or Secretary)
router.put('/:id', requireAnyRole('Admin','Secretary'), async (req, res) => {
	try {
		const { title, type, description, location, date, responsibles, status } = req.body;
		const doc = { title, type, description, location, status };
		if (date) doc.date = new Date(date);
		if (Array.isArray(responsibles)) doc.responsibles = responsibles;

		const a = await Activity.findByIdAndUpdate(req.params.id, doc, { new: true });
		res.json(a);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// Delete (Admin only)
router.delete('/:id', requireRole('Admin'), async (req, res) => {
	await Activity.findByIdAndDelete(req.params.id);
	await Attendance.deleteMany({ activity: req.params.id });
	res.json({ ok: true });
});

// Get attendees for an activity
router.get('/:id/attendees', async (req, res) => {
	const activityId = req.params.id;
	const records = await Attendance.find({ activity: activityId }).populate('member');
	res.json(records);
});

module.exports = router;

