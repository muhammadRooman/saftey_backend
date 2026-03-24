const OhsCourseConfig = require("../models/ohsCourseConfig.model");
const Signup = require("../models/SignUp.model");

const DEFAULT_COURSES = [
  "NEBOSH",
  "IOSH",
  "OSHA",
  "Rigger 1",
  "Rigger 2",
  "RIGGER3",
  "Risk Assessment",
  "First Aid",
  "Fire Safety",
  "Safety Management",
  "Fair Safety",
  "Electrical Safety",
  "Construction Safety",
  "Confined Space Training",
  "Lifting & Rigging Safety",
  "Chemical Handling Safety",
];

const DEFAULT_DESCRIPTION =
  "This course is designed to enhance your skills and knowledge in occupational health & safety.";

const getRole = async (userId) => {
  if (!userId) return null;
  const user = await Signup.findById(userId).select("role");
  return user?.role || null;
};

const isTeacherLike = (role) => role === "teacher";

const sanitizeCourses = (courses) => {
  if (!Array.isArray(courses)) return [];
  const trimmed = courses
    .map((c) => (typeof c === "string" ? c.trim() : String(c || "").trim()))
    .filter(Boolean);

  // Remove duplicates (case-insensitive) to avoid repeated card names.
  const seen = new Set();
  const unique = [];
  for (const name of trimmed) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(name);
  }
  return unique;
};

// Students (and teachers) can read.
exports.getOhsCourses = async (req, res) => {
  try {
    const doc = await OhsCourseConfig.findOne({});

    // Ensure there is always a single config document.
    if (!doc) {
      const created = await OhsCourseConfig.create({
        description: DEFAULT_DESCRIPTION,
        courses: DEFAULT_COURSES,
      });
      return res.status(200).json(created);
    }

    return res.status(200).json(doc);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch OHS courses", error: error.message });
  }
};

// Teachers/Admin-like users can edit/delete course names and update the single description.
exports.updateOhsCourses = async (req, res) => {
  try {
    const role = await getRole(req.userId);
    if (!isTeacherLike(role)) {
      return res.status(403).json({ message: "Only teacher can update OHS courses" });
    }

    const { description, courses } = req.body || {};

    // We allow partial update for safety, but at least one field must be provided.
    const updates = {};
    if (description !== undefined) {
      const nextDesc = typeof description === "string" ? description.trim() : String(description || "").trim();
      if (!nextDesc) return res.status(400).json({ message: "Description cannot be empty" });
      updates.description = nextDesc;
    }

    if (courses !== undefined) {
      const nextCourses = sanitizeCourses(courses);
      if (nextCourses.length === 0) return res.status(400).json({ message: "Courses cannot be empty" });
      updates.courses = nextCourses;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Provide at least 'description' or 'courses' to update" });
    }

    let doc = await OhsCourseConfig.findOne({});
    if (!doc) {
      doc = new OhsCourseConfig({
        description: DEFAULT_DESCRIPTION,
        courses: DEFAULT_COURSES,
      });
    }

    if (updates.description !== undefined) {
      doc.description = updates.description;
    }
    if (updates.courses !== undefined) {
      doc.courses = updates.courses;
    }

    await doc.save();

    return res.status(200).json(doc);
  } catch (error) {
    console.error("updateOhsCourses error:", error);
    return res.status(500).json({ message: "Failed to update OHS courses", error: error.message });
  }
};

