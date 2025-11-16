import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAudit } from '../utils/audit.js';

// تسجيل مستخدم جديد (Admin فقط)
export const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ message: "المستخدم موجود مسبقاً" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ username, passwordHash, role });
    await user.save();
    await logAudit(req, 'create', 'User', user._id, null, user.toObject());
    res.status(201).json({ message: "تم إنشاء المستخدم بنجاح", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// تسجيل الدخول
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "اسم المستخدم أو كلمة المرور خاطئة" });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ message: "اسم المستخدم أو كلمة المرور خاطئة" });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ message: "تم تسجيل الدخول بنجاح", token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// عرض كل المستخدمين (Admin فقط)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// حذف مستخدم
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    await logAudit(req, 'delete', 'User', user._id, user.toObject(), null);
    res.json({ message: "تم حذف المستخدم بنجاح" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
