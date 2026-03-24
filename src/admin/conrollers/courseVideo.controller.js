const CourseVideo = require("../models/courseVideo.model");
const Signup = require("../models/SignUp.model");

// Teacher: upload course video (NEBOSH / IOSH / OSHA)
exports.uploadVideo = async (req, res) => {
  try {
    const { title, courseType } = req.body;
    const teacherId = req.userId;

    if (!title || !courseType) {
      return res.status(400).json({ message: "Title and courseType are required" });
    }
    if (!["NEBOSH", "IOSH", "OSHA", "RIGGER3"].includes(courseType)) {
      return res.status(400).json({ message: "courseType must be NEBOSH, RIGGER3, IOSH or OSHA" });
    }
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: "Video file is required" });
    }

    const video = new CourseVideo({
      title,
      courseType,
      videoUrl: req.file.filename,
      teacher: teacherId,
    });
    await video.save();

    res.status(201).json({
      message: "Video uploaded successfully",
      video: { _id: video._id, title: video.title, courseType: video.courseType, videoUrl: video.videoUrl },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all videos (teacher) - optional filter by courseType
exports.getVideos = async (req, res) => {
  try {
    const { courseType } = req.query;
    const filter = {};
    if (courseType && ["NEBOSH", "IOSH", "OSHA", "RIGGER3"].includes(courseType)) {
      filter.courseType = courseType;
    }
    const videos = await CourseVideo.find(filter)
      .populate("teacher", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params; // video ID
    const { title, courseType } = req.body;

    if (!id) return res.status(400).json({ message: "Video ID is required" });

    // Validate courseType if provided
    if (courseType && !["NEBOSH", "IOSH", "OSHA", "RIGGER3"].includes(courseType)) {
      return res.status(400).json({ message: "courseType must be NEBOSH, RIGGER3, IOSH or OSHA" });
    }

    const video = await CourseVideo.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    // Update fields if provided
    if (title) video.title = title;
    if (courseType) video.courseType = courseType;

    // If new video file is uploaded
    if (req.file && req.file.filename) {
      video.videoUrl = req.file.filename;
    }

    await video.save();

    res.status(200).json({
      message: "Video updated successfully",
      video: {
        _id: video._id,
        title: video.title,
        courseType: video.courseType,
        videoUrl: video.videoUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Get videos for a specific student (by student userId) - only videos of courses assigned to that student
exports.getVideosForStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await Signup.findById(studentId).select("subject");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const courseTypes = Array.isArray(student.subject) ? student.subject : (student.subject ? [student.subject] : []);
    if (courseTypes.length === 0) {
      return res.status(200).json([]);
    }
    const videos = await CourseVideo.find({ courseType: { $in: courseTypes } })
      .populate("teacher", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logged-in student: get my assigned course videos
exports.getMyVideos = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await Signup.findById(userId).select("subject role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const courseTypes = Array.isArray(user.subject) ? user.subject : (user.subject ? [user.subject] : []);
    if (courseTypes.length === 0) {
      return res.status(200).json([]);
    }
    const videos = await CourseVideo.find({ courseType: { $in: courseTypes } })
      .populate("teacher", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete video (teacher who uploaded or admin)
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await CourseVideo.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    await CourseVideo.findByIdAndDelete(id);
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
