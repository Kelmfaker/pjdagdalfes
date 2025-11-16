import express from "express";
import { createUser, getAllUsers, deleteUser } from "../controllers/usersController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", authenticate, authorizeRoles("admin"), createUser); // Admin فقط
// Login routed via /api/auth/login (consolidated)
router.get("/", authenticate, authorizeRoles("admin"), getAllUsers); // عرض كل المستخدمين Admin فقط
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteUser);

export default router;
