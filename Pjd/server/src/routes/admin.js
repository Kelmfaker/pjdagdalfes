const express = require('express');
const Member = require('../models/Member');
const Counter = require('../models/Counter');
const { authenticateJWT, requireRole } = require('../middleware/auth');

const router = express.Router();

// protect all admin endpoints
router.use(authenticateJWT);
router.use(requireRole('Admin'));

// Helper: compute next seq for a year without saving counters
async function computeAssignments(year) {
	const counterId = `memberId-${year}`;
	const counterDoc = await Counter.findById(counterId).lean();
	let nextSeq = (counterDoc && counterDoc.seq) ? counterDoc.seq + 1 : 1;

	const candidates = await Member.find({ $or: [ { membershipId: { $exists: false } }, { membershipId: null }, { membershipId: '' } ] }).sort({ _id: 1 }).lean();
	const assignments = [];
	for (const m of candidates) {
		const useYear = m.joinDate ? (new Date(m.joinDate)).getFullYear() : parseInt(year, 10);
		if (String(useYear) !== String(year)) continue;
		const id = `M-${year}-${String(nextSeq).padStart(5, '0')}`;
		assignments.push({ memberId: m._id, fullName: m.fullName, membershipId: id });
		nextSeq++;
	}
	return { assignments, startingSeq: (counterDoc && counterDoc.seq) ? counterDoc.seq + 1 : 1 };
}

router.get('/membership-ids/preview', async (req, res) => {
	try {
		const year = req.query.year;
		if (!year) return res.status(400).json({ message: 'year is required' });
		const result = await computeAssignments(year);
		res.json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

router.post('/membership-ids/preview', async (req, res) => {
	try {
		const { year } = req.body;
		if (!year) return res.status(400).json({ message: 'year is required' });
		const result = await computeAssignments(year);
		res.json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

router.post('/membership-ids/apply', async (req, res) => {
	try {
		const { year, mode = 'fill' } = req.body;
		if (!year) return res.status(400).json({ message: 'year is required' });

		const counterId = `memberId-${year}`;
		let counterDoc = await Counter.findById(counterId);
		if (!counterDoc) {
			counterDoc = new Counter({ _id: counterId, seq: 0 });
			await counterDoc.save();
		}

		let membersToUpdate = [];
		if (mode === 'reassign') {
			membersToUpdate = await Member.find({ $or: [ { joinDate: { $exists: true, $ne: null } }, { joinDate: { $exists: false } } ] }).sort({ _id: 1 });
			membersToUpdate = membersToUpdate.filter(m => {
				const useYear = m.joinDate ? new Date(m.joinDate).getFullYear() : parseInt(year, 10);
				return String(useYear) === String(year);
			});
		} else {
			membersToUpdate = await Member.find({ $or: [ { membershipId: { $exists: false } }, { membershipId: null }, { membershipId: '' } ] }).sort({ _id: 1 });
			membersToUpdate = membersToUpdate.filter(m => {
				const useYear = m.joinDate ? new Date(m.joinDate).getFullYear() : parseInt(year, 10);
				return String(useYear) === String(year);
			});
		}

		const applied = [];
		for (const m of membersToUpdate) {
			counterDoc.seq += 1;
			const newId = `M-${year}-${String(counterDoc.seq).padStart(5, '0')}`;
			m.membershipId = newId;
			await m.save();
			applied.push({ memberId: m._id, fullName: m.fullName, membershipId: newId });
		}
		await counterDoc.save();

		res.json({ appliedCount: applied.length, applied });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;

