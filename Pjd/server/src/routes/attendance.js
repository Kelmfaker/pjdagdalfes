const express = require('express');
const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const Activity = require('../models/Activity');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

// Require authentication for attendance endpoints
router.use(authenticateJWT);

// List attendance records, or for an activity
router.get('/', async (req, res) => {
	const { activity } = req.query;
	const filter = {};
	if (activity) filter.activity = activity;
	const items = await Attendance.find(filter).populate('member activity');
	res.json(items);
});

// Mark attendance (create or update)
router.post('/mark', async (req, res) => {
	try {
		const { activityId, memberId, present, method } = req.body;
		if (!activityId || !memberId) return res.status(400).json({ message: 'activityId and memberId are required' });

		const doc = {
			present: typeof present === 'boolean' ? present : true,
			method: method || 'manual',
			recordedAt: new Date()
		};
		if (req.user && req.user.id) doc.recordedBy = req.user.id;

		const rec = await Attendance.findOneAndUpdate(
			{ activity: activityId, member: memberId },
			doc,
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
		res.json(rec);
	} catch (err) {
		res.status(400).json({ error: err.message });
	}
});

// QR check-in: accepts activityId and membershipId (membershipId is the field on Member)
router.post('/qr', async (req, res) => {
	try {
		const { activityId, membershipId } = req.body;
		if (!activityId || !membershipId) return res.status(400).json({ message: 'activityId and membershipId required' });
		const member = await Member.findOne({ membershipId });
		if (!member) return res.status(404).json({ message: 'Member not found' });

		const doc = {
			present: true,
			method: 'qr',
			recordedAt: new Date()
		};

		const rec = await Attendance.findOneAndUpdate(
			{ activity: activityId, member: member._id },
			doc,
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);
		res.json({ ok: true, record: rec, member: { id: member._id, fullName: member.fullName, membershipId: member.membershipId } });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;

