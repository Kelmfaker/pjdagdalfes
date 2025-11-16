import express from "express";
import {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} from "../controllers/membersController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", authenticate, authorizeRoles('admin','secretary'), getAllMembers);          // عرض جميع الأعضاء (محمي)
router.get("/:id", authenticate, authorizeRoles('admin','secretary'), getMemberById);       // عرض عضو واحد (محمي)
router.post("/", authenticate, authorizeRoles('admin','secretary'), createMember);          // إضافة عضو جديد (محمي)
router.put("/:id", authenticate, authorizeRoles('admin','secretary'), updateMember);        // تعديل عضو (محمي)
router.delete("/:id", authenticate, authorizeRoles('admin'), deleteMember);     // حذف عضو (Admin فقط)

export default router;
