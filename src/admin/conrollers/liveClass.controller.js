const { randomUUID } = require("crypto");
const LiveClass = require("../models/liveClass.model");
const Signup = require("../models/SignUp.model");

const isHexObjectId = (id) => typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);

const randomRoomName = () => `lms-${randomUUID().replace(/-/g, "")}`;

const buildMeetingUrl = (roomName) =>
  roomName ? `https://meet.jit.si/${encodeURIComponent(roomName)}` : null;

const withMeetingUrl = (cls) => {
  if (!cls) return cls;
  const obj = typeof cls.toObject === "function" ? cls.toObject() : cls;
  return { ...obj, meetingUrl: buildMeetingUrl(obj.roomName) };
};

exports.createLiveClass = async (req, res) => {
  try {
    const creatorId = req.userId;
    const creator = await Signup.findById(creatorId).select("role");
    if (!creator || creator.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create live classes" });
    }

    const { title, description = "", startTime, endTime, allowedStudentIds = [] } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: "Title, startTime and endTime are required" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ message: "Invalid start/end time. End time must be after start time." });
    }

    // === FIXED: Handle both string and array for allowedStudentIds ===
    let studentIdsArray = Array.isArray(allowedStudentIds) 
      ? allowedStudentIds 
      : (allowedStudentIds ? [allowedStudentIds] : []);

    const uniqueStudentIds = Array.from(new Set(studentIdsArray))
      .filter(Boolean)
      .map(id => String(id).trim())
      .filter(isHexObjectId);

    const students = await Signup.find({
      _id: { $in: uniqueStudentIds },
      role: "student",
    }).select("_id");

    const roomName = randomRoomName();

    const liveClass = await LiveClass.create({
      title: String(title).trim(),
      description: String(description || "").trim(),
      roomName,
      createdBy: creator._id,
      allowedStudents: students.map((s) => s._id),
      startTime: start,
      endTime: end,
      status: "scheduled",
    });

    res.status(201).json({ 
      success: true, 
      message: "Live class created successfully",
      data: withMeetingUrl(liveClass) 
    });

  } catch (err) {
    console.error("createLiveClass error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    });

    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid live class data",
        details: Object.values(err.errors || {}).map((e) => e.message),
      });
    }

    if (err.code === 11000) {
      return res.status(409).json({ message: "Room name conflict. Please try again." });
    }

    res.status(500).json({
      message: "Failed to create live class",
      ...(process.env.NODE_ENV !== "production" && { 
        detail: err.message 
      }),
    });
  }
};

// Rest of the controller functions remain almost the same (with minor improvements)
exports.listTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.userId;
    const teacher = await Signup.findById(teacherId).select("role");
    if (!teacher || teacher.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view their classes" });
    }

    const classes = await LiveClass.find({ createdBy: teacherId })
      .populate("allowedStudents", "name email")
      .sort({ startTime: -1 })
      .lean();

    res.json({ 
      success: true, 
      data: classes.map(withMeetingUrl) 
    });
  } catch (err) {
    console.error("listTeacherClasses error", err);
    res.status(500).json({ message: "Failed to load classes" });
  }
};

exports.listStudentClasses = async (req, res) => {
  try {
    const studentId = req.userId;
    const student = await Signup.findById(studentId).select("role");
    if (!student || student.role !== "student") {
      return res.status(403).json({ message: "Only students can view their classes" });
    }

    const now = new Date();
    const classes = await LiveClass.find({
      allowedStudents: studentId,
      endTime: { $gte: new Date(now.getTime() - 60 * 60 * 1000) }, // last 1 hour
      status: { $ne: "cancelled" },
    })
      .sort({ startTime: 1 })
      .lean();

    res.json({ success: true, data: classes.map(withMeetingUrl) });
  } catch (err) {
    console.error("listStudentClasses error", err);
    res.status(500).json({ message: "Failed to load your classes" });
  }
};

exports.getStudentActiveClass = async (req, res) => {
  try {
    const studentId = req.userId;
    const student = await Signup.findById(studentId).select("role");
    if (!student || student.role !== "student") {
      return res.status(403).json({ message: "Only students can view active class" });
    }

    const now = new Date();

    // Priority 1: Live class
    let activeClass = await LiveClass.findOne({
      allowedStudents: studentId,
      status: "live",
    }).sort({ startTime: -1 }).lean();

    // Priority 2: Scheduled class that should be active now (with 15 min grace)
    if (!activeClass) {
      const graceMinutes = 15;
      const graceStart = new Date(now.getTime() - graceMinutes * 60 * 1000);

      activeClass = await LiveClass.findOne({
        allowedStudents: studentId,
        status: "scheduled",
        startTime: { $lte: now },
        endTime: { $gte: now },
        startTime: { $gte: graceStart }   // simplified
      }).sort({ startTime: 1 }).lean();
    }

    if (!activeClass) {
      return res.status(404).json({ 
        message: "No active live class at the moment",
        currentTime: now.toISOString()
      });
    }

    res.json({ success: true, data: withMeetingUrl(activeClass) });
  } catch (err) {
    console.error("getStudentActiveClass error:", err);
    res.status(500).json({ message: "Failed to load active class" });
  }
};

exports.setLiveClassStatus = async (req, res) => {
  try {
    const actorId = req.userId;
    const actor = await Signup.findById(actorId).select("role");
    if (!actor || !["teacher", "admin"].includes(actor.role)) {
      return res.status(403).json({ message: "Only teachers/admin can update status" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["scheduled", "live", "ended", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const query = actor.role === "teacher" 
      ? { _id: id, createdBy: actorId } 
      : { _id: id };

    const liveClass = await LiveClass.findOne(query);
    if (!liveClass) {
      return res.status(404).json({ message: "Live class not found or access denied" });
    }

    liveClass.status = status;
    await liveClass.save();

    res.json({ success: true, data: withMeetingUrl(liveClass) });
  } catch (err) {
    console.error("setLiveClassStatus error", err);
    res.status(500).json({ message: "Failed to update live class" });
  }
};

exports.deleteLiveClass = async (req, res) => {
  try {
    const actorId = req.userId;
    const actor = await Signup.findById(actorId).select("role");
    if (!actor || !["teacher", "admin"].includes(actor.role)) {
      return res.status(403).json({ message: "Only teachers/admin can delete live classes" });
    }

    const { id } = req.params;
    const query = actor.role === "teacher" 
      ? { _id: id, createdBy: actorId } 
      : { _id: id };

    const deleted = await LiveClass.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ message: "Live class not found or access denied" });
    }

    res.json({ 
      success: true, 
      message: "Live class deleted successfully", 
      data: withMeetingUrl(deleted) 
    });
  } catch (err) {
    console.error("deleteLiveClass error", err);
    res.status(500).json({ message: "Failed to delete live class" });
  }
};