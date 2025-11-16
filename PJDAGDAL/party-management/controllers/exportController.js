import Member from "../models/Member.js";
import Attendance from "../models/Attendance.js";

// Skeleton: export members as CSV/JSON
export const exportMembers = async (req, res) => {
  try {
    const members = await Member.find();
    // TODO: implement CSV streaming; for now, return JSON
    res.json({ count: members.length, data: members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const exportAttendance = async (req, res) => {
  try {
    const { activityId } = req.query;
    const q = activityId ? { activityId } : {};
    const rows = await Attendance.find(q).populate('memberId', 'fullName membershipId').populate('activityId', 'title date');
    res.json({ count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
