import express from "express";
import { exportMembers, exportAttendance } from "../controllers/exportController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.get('/members', authenticate, authorizeRoles('admin','secretary'), exportMembers);
router.get('/attendance', authenticate, authorizeRoles('admin','secretary'), exportAttendance);

export default router;
