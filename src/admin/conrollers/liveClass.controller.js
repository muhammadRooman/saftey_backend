const LiveClass = require("../models/liveClass.model");
const Signup = require("../models/SignUp.model");

const randomRoomName = () =>
  `lms-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

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
      return res.status(400).json({ message: "Invalid start/end time" });
    }

    const uniqueStudentIds = Array.from(new Set(allowedStudentIds || [])).filter(Boolean);

    const students = await Signup.find({
      _id: { $in: uniqueStudentIds },
      role: "student",
    }).select("_id");

    const roomName = randomRoomName();

    const liveClass = await LiveClass.create({
      title,
      description,
      roomName,
      createdBy: creatorId,
      allowedStudents: students.map((s) => s._id),
      startTime: start,
      endTime: end,
      status: "scheduled",
    });

    res.status(201).json({ success: true, data: withMeetingUrl(liveClass) });
  } catch (err) {
    console.error("createLiveClass error", err);
    res.status(500).json({ message: "Failed to create live class" });
  }
};

exports.listTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.userId;
    const teacher = await Signup.findById(teacherId).select("role");
    if (!teacher || teacher.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view teacher classes" });
    }

    const classes = await LiveClass.find({ createdBy: teacherId })
      .sort({ startTime: -1 })
      .lean();
    res.json({ success: true, data: classes.map(withMeetingUrl) });
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
      return res.status(403).json({ message: "Only students can view student classes" });
    }

    const now = new Date();
    const classes = await LiveClass.find({
      allowedStudents: studentId,
      endTime: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
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
    // 1) If teacher pressed "Start Live", student should receive immediately
    const liveNow = await LiveClass.findOne({
      allowedStudents: studentId,
      status: "live",
    })
      .sort({ startTime: -1 })
      .lean();

    if (liveNow) {
      return res.json({ success: true, data: withMeetingUrl(liveNow) });
    }

    // 2) Otherwise, allow scheduled class within the time window
    const windowMinutes = 10;
    const startWindow = new Date(now.getTime() - windowMinutes * 60 * 1000);

    const scheduled = await LiveClass.findOne({
      allowedStudents: studentId,
      startTime: { $lte: now, $gte: startWindow },
      endTime: { $gte: now },
      status: "scheduled",
    })
      .sort({ startTime: 1 })
      .lean();

    if (!scheduled) {
      return res.status(404).json({ message: "No active live class" });
    }

    res.json({ success: true, data: withMeetingUrl(scheduled) });
  } catch (err) {
    console.error("getStudentActiveClass error", err);
    res.status(500).json({ message: "Failed to load active class" });
  }
};

exports.setLiveClassStatus = async (req, res) => {
  try {
    const actorId = req.userId;
    const actor = await Signup.findById(actorId).select("role");
    if (!actor || !["teacher", "admin"].includes(actor.role)) {
      return res
        .status(403)
        .json({ message: "Only teachers/admin can update live class status" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["scheduled", "live", "ended", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Teacher can update only own classes; admin can update any class.
    const query = actor.role === "teacher" ? { _id: id, createdBy: actorId } : { _id: id };
    const liveClass = await LiveClass.findOne(query);
    if (!liveClass) {
      return res.status(404).json({ message: "Live class not found or access denied" });
    }

    liveClass.status = status;
    await liveClass.save();

    return res.json({ success: true, data: withMeetingUrl(liveClass) });
  } catch (err) {
    console.error("setLiveClassStatus error", err);
    return res.status(500).json({ message: "Failed to update live class" });
  }
};

exports.deleteLiveClass = async (req, res) => {
  try {
    const actorId = req.userId;
    const actor = await Signup.findById(actorId).select("role");
    if (!actor || !["teacher", "admin"].includes(actor.role)) {
      return res
        .status(403)
        .json({ message: "Only teachers/admin can delete live classes" });
    }

    const { id } = req.params;
    const query = actor.role === "teacher" ? { _id: id, createdBy: actorId } : { _id: id };
    const deleted = await LiveClass.findOneAndDelete(query);
    if (!deleted) {
      return res.status(404).json({ message: "Live class not found or access denied" });
    }

    return res.json({ success: true, message: "Live class deleted", data: withMeetingUrl(deleted) });
  } catch (err) {
    console.error("deleteLiveClass error", err);
    return res.status(500).json({ message: "Failed to delete live class" });
  }
};

