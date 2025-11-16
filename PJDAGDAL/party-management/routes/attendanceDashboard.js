import express from "express";
import Activity from "../models/Activity.js";
import Member from "../models/Member.js";
import Attendance from "../models/Attendance.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// عرض صفحة الحضور
router.get("/", authenticate, authorizeRoles("admin", "secretary"), async (req, res) => {
  try {
    const activities = await Activity.find().populate("responsible", "fullName");
    res.render("attendance", { activities });
  } catch (err) {
    res.status(500).send("خطأ في تحميل الأنشطة للحضور");
  }
});

// حفظ الحضور
router.post("/", authenticate, authorizeRoles("admin", "secretary"), async (req, res) => {
  try {
    const { activityId, records } = req.body; // records = [{ memberId, presenceStatus }, ...]
    
    // حذف أي حضور سابق لنفس النشاط
    await Attendance.deleteMany({ activityId });

    // حفظ كل سجل حضور جديد
    const attendanceDocs = records.map(r => ({
      memberId: r.memberId,
      activityId,
      presenceStatus: r.presenceStatus
    }));

    await Attendance.insertMany(attendanceDocs);
    res.json({ message: "تم حفظ الحضور بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ أثناء حفظ الحضور" });
  }
});

export default router;

// QR check-in UI route (renders a small page for scanning/entering QR tokens)
router.get('/qr', authenticate, authorizeRoles('admin','secretary','responsible'), async (req, res) => {
  try {
    const activities = await Activity.find().populate('responsible','fullName');
    res.render('attendance-qr', { activities });
  } catch (err) {
    res.status(500).send('خطأ في تحميل صفحة QR للحضور');
  }
});
