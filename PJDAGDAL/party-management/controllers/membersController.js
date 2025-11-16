import Member from "../models/Member.js";
import { logAudit } from '../utils/audit.js';

// عرض كل الأعضاء
export const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find();
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// عرض عضو واحد
export const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "العضو غير موجود" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// إضافة عضو جديد
export const createMember = async (req, res) => {
  try {
    const member = new Member(req.body);
    await member.save();
    // audit
    await logAudit(req, 'create', 'Member', member._id, null, member.toObject());
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// تعديل بيانات عضو
export const updateMember = async (req, res) => {
  try {
    const before = await Member.findById(req.params.id).lean();
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!member) return res.status(404).json({ message: "العضو غير موجود" });
    await logAudit(req, 'update', 'Member', member._id, before, member.toObject());
    res.json(member);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// حذف عضو
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: "العضو غير موجود" });
    await logAudit(req, 'delete', 'Member', member._id, member.toObject(), null);
    res.json({ message: "تم حذف العضو بنجاح" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
