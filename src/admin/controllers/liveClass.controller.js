const LiveClass = require("../models/liveClass.model");

// 🔥 Create Live Class
exports.createLiveClass = async (req, res) => {
  console.log("Creating live class with data:", req.body);
  try {
    const { title, description, startTime, endTime, allowedStudentIds } =
      req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // random room name for Jitsi
    const roomName = `lms-${Math.random().toString(36).substring(2, 10)}`;

   const liveClass = await LiveClass.create({
  title,
  description: description || "",
  startTime,
  endTime,
  allowedStudents: allowedStudentIds || [],   // ← Use allowedStudents (schema field)
  createdBy: req.user.id,                     // Better than teacherId
  roomName,
});

    res.status(201).json({
      message: "Live class created",
      data: liveClass,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔥 Get classes for teacher (Admin)
exports.getTeacherClasses = async (req, res) => {
  try {
    const classes = await LiveClass.find({
      teacherId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({ data: classes });
  } catch (err) {
    res.status(500).json({ message: "Error fetching classes" });
  }
};

// 🔥 Get classes for student
exports.getStudentClasses = async (req, res) => {
  try {
    const studentId = req.user.id;

    const classes = await LiveClass.find({
      allowedStudentIds: studentId,
    }).sort({ createdAt: -1 });

    res.json({ data: classes });
  } catch (err) {
    res.status(500).json({ message: "Error fetching student classes" });
  }
};

// 🔥 Update status (live / ended)
exports.updateClassStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await LiveClass.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({
      message: "Status updated",
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

// 🔥 Get single class
exports.getSingleClass = async (req, res) => {
  try {
    const cls = await LiveClass.findById(req.params.id);

    if (!cls) return res.status(404).json({ message: "Not found" });

    res.json({ data: cls });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};

// 🔥 Delete class
exports.deleteClass = async (req, res) => {
  try {
    await LiveClass.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};