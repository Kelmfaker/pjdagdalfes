import Member from "../models/Member.js";
import { logAudit } from '../utils/audit.js';

// Normalize incoming member fields (map localized labels to canonical enum values)
function normalizeMemberInput(input = {}) {
  const payload = { ...input };

  // normalize gender -> schema expects 'M' or 'F' (we removed 'other')
  if (payload.gender && typeof payload.gender === 'string') {
    const g = payload.gender.trim().toLowerCase();
    if (g === 'أنثى' || g === 'female' || g === 'f' || g === 'أنثي' || g === 'انثى') {
      payload.gender = 'F';
    } else if (g === 'ذكر' || g === 'male' || g === 'm') {
      payload.gender = 'M';
    } else if (g === 'other' || g === 'غير محدد' || g === 'غير_محدد' || g === 'غير محددة') {
      // no longer support 'other' — remove the field so it won't fail validation
      delete payload.gender;
    } else {
      // keep as-is; mongoose will validate and reject invalid enums
      payload.gender = payload.gender;
    }
  }

  // normalize status -> schema expects 'active' or 'inactive'
  if (payload.status && typeof payload.status === 'string') {
    const s = payload.status.trim().toLowerCase();
    if (s === 'نشط' || s === 'active' || s === 'نشط️') {
      payload.status = 'active';
    } else if (s === 'غير نشط' || s === 'inactive' || s === 'غير_نشط' || s === 'غير-نشط') {
      payload.status = 'inactive';
    } else {
      payload.status = payload.status;
    }
  }
  
    // trim common text fields
    if (payload.fullName && typeof payload.fullName === 'string') payload.fullName = payload.fullName.trim();
    if (payload.phone && typeof payload.phone === 'string') payload.phone = payload.phone.trim();
    if (payload.email && typeof payload.email === 'string') payload.email = payload.email.trim();
    if (payload.address && typeof payload.address === 'string') payload.address = payload.address.trim();
    if (payload.role && typeof payload.role === 'string') payload.role = payload.role.trim();
    if (payload.bio && typeof payload.bio === 'string') payload.bio = payload.bio.trim();
    if (payload.pdfUrl && typeof payload.pdfUrl === 'string') payload.pdfUrl = payload.pdfUrl.trim();
    // educationLevel and occupation should be canonical codes; trim if present
    if (payload.educationLevel && typeof payload.educationLevel === 'string') payload.educationLevel = payload.educationLevel.trim();
    if (payload.occupation && typeof payload.occupation === 'string') payload.occupation = payload.occupation.trim();
    // boolean fields: accept 'true'/'false', 'نعم'/'لا', '1'/'0'
    function parseBool(v){
      if (typeof v === 'boolean') return v;
      if (!v && v !== 0) return false;
      const s = String(v).trim().toLowerCase();
      return (s === 'true' || s === '1' || s === 'نعم' || s === 'y' || s === 'yes');
    }
    if ('memberOfRegionalBodies' in payload) payload.memberOfRegionalBodies = parseBool(payload.memberOfRegionalBodies);
    if ('assignedMission' in payload) payload.assignedMission = parseBool(payload.assignedMission);
    if (payload.memberOfRegionalBodiesDetail && typeof payload.memberOfRegionalBodiesDetail === 'string') payload.memberOfRegionalBodiesDetail = payload.memberOfRegionalBodiesDetail.trim();
    if (payload.assignedMissionDetail && typeof payload.assignedMissionDetail === 'string') payload.assignedMissionDetail = payload.assignedMissionDetail.trim();
    if (payload.previousPartyExperiences && typeof payload.previousPartyExperiences === 'string') payload.previousPartyExperiences = payload.previousPartyExperiences.trim();

  return payload;
}

// عرض كل الأعضاء
export const getAllMembers = async (req, res) => {
  try {
    // Server-side sorting: allow ?sort=<field>&order=asc|desc
    const allowedSortFields = ['fullName', 'membershipId', 'joinedAt', 'status', 'memberType', 'phone', 'createdAt', '_id'];
    let sortField = req.query.sort;
    if (!sortField || !allowedSortFields.includes(sortField)) {
      sortField = 'fullName';
    }
    const sortOrder = (req.query.order && String(req.query.order).toLowerCase() === 'desc') ? -1 : 1;
    const sortObj = { [sortField]: sortOrder };

    const members = await Member.find().sort(sortObj);
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
    const data = normalizeMemberInput(req.body);
    const member = new Member(data);
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
    const data = normalizeMemberInput(req.body);
    const member = await Member.findByIdAndUpdate(req.params.id, data, { new: true });
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
