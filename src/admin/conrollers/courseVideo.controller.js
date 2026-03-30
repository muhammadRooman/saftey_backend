const CourseVideo = require("../models/courseVideo.model");
const Signup = require("../models/SignUp.model");

const LANGS = ["Urdu", "English", "Arabic"];

/**
 * List videos from MongoDB directly + attach teachers.
 * Avoids Mongoose hydrating with a stale cached schema that omits `language` in JSON even when stored in DB.
 */
async function listVideosFromDb(match) {
  const coll = CourseVideo.collection;
  const rows = await coll.find(match).sort({ createdAt: -1 }).toArray();
  const teacherIdStrings = [...new Set(rows.map((r) => r.teacher && String(r.teacher)))];
  let teacherById = {};
  if (teacherIdStrings.length) {
    const teachers = await Signup.find({ _id: { $in: teacherIdStrings } })
      .select("name email")
      .lean();
    teacherById = Object.fromEntries(
      teachers.map((t) => [String(t._id), { _id: t._id, name: t.name, email: t.email }])
    );
  }
  return rows.map((r) => ({
    _id: r._id,
    title: r.title,
    courseType: r.courseType,
    videoUrl: r.videoUrl,
    fileUrl: r.fileUrl || "",
    language: r.language != null && r.language !== "" ? r.language : "English",
    teacher: teacherById[String(r.teacher)] || r.teacher,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    __v: r.__v,
  }));
}

/** Normalize language from multipart body or query (trim, case-insensitive). */
function parseLanguage(raw) {
  let v = raw;
  if (Array.isArray(v)) v = v[0];
  if (v == null || v === "") return "English";
  const s = String(v).trim();
  if (!s) return "English";
  const lower = s.toLowerCase();
  const map = { urdu: "Urdu", english: "English", arabic: "Arabic" };
  if (map[lower]) return map[lower];
  return LANGS.includes(s) ? s : "English";
}

/** Match videos for a student's assigned language; legacy docs without `language` count as English. */
function buildLanguageQuery(lang) {
  const l = parseLanguage(lang);
  if (l === "English") {
    return {
      $or: [{ language: "English" }, { language: { $exists: false } }, { language: null }],
    };
  }
  return { language: l };
}

// Teacher: upload course video (NEBOSH / IOSH / OSHA)
exports.uploadVideo = async (req, res) => {
  try {
    const { title, courseType, language, videoLang } = req.body;
    const teacherId = req.userId;

    if (!title || !courseType) {
      return res.status(400).json({ message: "Title and courseType are required" });
    }
    if (!["NEBOSH", "IOSH", "OSHA", "RIGGER3"].includes(courseType)) {
      return res.status(400).json({ message: "courseType must be NEBOSH, RIGGER3, IOSH or OSHA" });
    }
    // Support both: old `.single("video")` and new `.fields([{name:'video'},{name:'pdf'}])`
    const videoFile = req.files?.video?.[0] || req.file;
    const pdfFile = req.files?.pdf?.[0] || null;

    if (!videoFile || !videoFile.filename) {
      return res.status(400).json({ message: "Video file is required" });
    }

    // Body fields sometimes missing with multipart; also accept query (?language=) and alias videoLang
    const langRaw = language ?? videoLang ?? req.query.language;
    const langResolved = parseLanguage(langRaw);

    const video = new CourseVideo({
      title,
      courseType,
      language: langResolved,
      videoUrl: videoFile.filename,
      fileUrl: pdfFile?.filename || "",
      teacher: teacherId,
    });
    await video.save();

    res.status(201).json({
      message: "Video uploaded successfully",
      video: {
        _id: video._id,
        title: video.title,
        courseType: video.courseType,
        language: video.language,
        videoUrl: video.videoUrl,
        fileUrl: video.fileUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all videos (teacher) - optional filter by courseType
exports.getVideos = async (req, res) => {
  try {
    const { courseType, language } = req.query;
    const filter = {};
    if (courseType && ["NEBOSH", "IOSH", "OSHA", "RIGGER3"].includes(courseType)) {
      filter.courseType = courseType;
    }
    if (language != null && String(language).trim() !== "") {
      Object.assign(filter, buildLanguageQuery(language));
    }
    const videos = await listVideosFromDb(filter);
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params; // video ID
    const { title, courseType, language, videoLang } = req.body;

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
    const langRaw = language ?? videoLang ?? req.query.language;
    if (langRaw != null && String(langRaw).trim() !== "") {
      video.language = parseLanguage(langRaw);
    }

    // If new video file is uploaded
    const videoFile = req.files?.video?.[0] || req.file;
    const pdfFile = req.files?.pdf?.[0] || null;

    if (videoFile && videoFile.filename) {
      video.videoUrl = videoFile.filename;
    }

    // Optional course attachment (PDF). If missing, keep the previous one.
    if (pdfFile && pdfFile.filename) {
      video.fileUrl = pdfFile.filename;
    }

    await video.save();

    res.status(200).json({
      message: "Video updated successfully",
      video: {
        _id: video._id,
        title: video.title,
        courseType: video.courseType,
        language: video.language,
        videoUrl: video.videoUrl,
        fileUrl: video.fileUrl,
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
    const student = await Signup.findById(studentId).select("subject videoLanguage");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    const courseTypes = Array.isArray(student.subject) ? student.subject : (student.subject ? [student.subject] : []);
    if (courseTypes.length === 0) {
      return res.status(200).json([]);
    }
    const lang = parseLanguage(student.videoLanguage);
    const videos = await listVideosFromDb({
      courseType: { $in: courseTypes },
      ...buildLanguageQuery(lang),
    });
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Logged-in student: get my assigned course videos
exports.getMyVideos = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await Signup.findById(userId).select("subject role videoLanguage");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const courseTypes = Array.isArray(user.subject) ? user.subject : (user.subject ? [user.subject] : []);
    if (courseTypes.length === 0) {
      return res.status(200).json([]);
    }
    const lang = parseLanguage(user.videoLanguage);
    const videos = await listVideosFromDb({
      courseType: { $in: courseTypes },
      ...buildLanguageQuery(lang),
    });
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
