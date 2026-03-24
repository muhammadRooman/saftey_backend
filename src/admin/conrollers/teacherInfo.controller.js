const TeacherInfo = require("../models/teacherInfo.model");
const Signup = require("../models/SignUp.model");

const getRole = async (userId) => {
  if (!userId) return null;
  const user = await Signup.findById(userId).select("role");
  return user?.role || null;
};

const isAdminLike = (role) => role === "teacher";

const inferMediaType = (mimetype = "") => {
  if (String(mimetype).startsWith("image/")) return "image";
  if (String(mimetype).startsWith("video/")) return "video";
  return null;
};

exports.createTeacherInfo = async (req, res) => {
  try {
    const role = await getRole(req.userId);
    if (!isAdminLike(role)) {
      return res.status(403).json({ message: "Only admin can create teacher info" });
    }

    const { title, message } = req.body;
    if (!title) {
      return res.status(400).json({ message: "title is required" });
    }
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: "media file is required" });
    }

    const mediaType = inferMediaType(req.file.mimetype);
    if (!mediaType) {
      return res.status(400).json({ message: "Invalid media type" });
    }

    const doc = await TeacherInfo.create({
      title,
      message: message || "",
      mediaUrl: req.file.filename,
      mediaType,
      createdBy: req.userId,
    });

    return res.status(201).json({ message: "Teacher info created", data: doc });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create teacher info", error: error.message });
  }
};

exports.getTeacherInfoList = async (req, res) => {
  try {
    const list = await TeacherInfo.find({})
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    return res.status(200).json({ data: list });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch teacher info", error: error.message });
  }
};

exports.updateTeacherInfo = async (req, res) => {
  try {
    const role = await getRole(req.userId);
    if (!isAdminLike(role)) {
      return res.status(403).json({ message: "Only admin can update teacher info" });
    }

    const { id } = req.params;
    const { title, message } = req.body;
    const existing = await TeacherInfo.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Teacher info not found" });
    }

    if (title !== undefined) existing.title = title;
    if (message !== undefined) existing.message = message;

    if (req.file && req.file.filename) {
      const mediaType = inferMediaType(req.file.mimetype);
      if (!mediaType) {
        return res.status(400).json({ message: "Invalid media type" });
      }
      existing.mediaUrl = req.file.filename;
      existing.mediaType = mediaType;
    }

    await existing.save();
    return res.status(200).json({ message: "Teacher info updated", data: existing });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update teacher info", error: error.message });
  }
};

exports.deleteTeacherInfo = async (req, res) => {
  try {
    const role = await getRole(req.userId);
    if (!isAdminLike(role)) {
      return res.status(403).json({ message: "Only admin can delete teacher info" });
    }

    const { id } = req.params;
    const existing = await TeacherInfo.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Teacher info not found" });
    }

    await TeacherInfo.findByIdAndDelete(id);
    return res.status(200).json({ message: "Teacher info deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete teacher info", error: error.message });
  }
};
