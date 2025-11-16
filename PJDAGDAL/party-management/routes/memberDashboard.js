import express from "express";
import Member from "../models/Member.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// عرض صفحة الأعضاء
router.get("/", authenticate, authorizeRoles("admin", "secretary"), async (req, res) => {
  try {
    const members = await Member.find();
    res.render("members", { members });
  } catch (err) {
    res.status(500).send("خطأ في تحميل الأعضاء");
  }
});

export default router;
