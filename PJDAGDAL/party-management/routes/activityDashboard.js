import express from "express";
import Activity from "../models/Activity.js";
import Member from "../models/Member.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// عرض صفحة الأنشطة
router.get("/", authenticate, authorizeRoles("admin", "secretary"), async (req, res) => {
  try {
    const activities = await Activity.find().populate("responsible", "fullName");
    const bureauMembers = await Member.find({ memberType: "bureau" }); // لأختيار المكلفين
    res.render("activities", { activities, bureauMembers });
  } catch (err) {
    res.status(500).send("خطأ في تحميل الأنشطة");
  }
});

export default router;
