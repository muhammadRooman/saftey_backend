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
const DEFAULT_CONTACT = {
  name: "OHS Academy",
  email: "muhammad.rooman5@gmail.com",
  phone: "0333-0222006",
  address: "House #3, Peshawar Saddar",
};

const toResponsePayload = (docLike) => {
  const raw = docLike?.toObject ? docLike.toObject() : (docLike || {});
  return {
    ...raw,
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description
        : DEFAULT_DESCRIPTION,
    courses:
      Array.isArray(raw.courses) && raw.courses.length
        ? raw.courses
        : DEFAULT_COURSES,
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name
        : DEFAULT_CONTACT.name,
    email:
      typeof raw.email === "string" && raw.email.trim()
        ? raw.email
        : DEFAULT_CONTACT.email,
    phone:
      typeof raw.phone === "string" && raw.phone.trim()
        ? raw.phone
        : DEFAULT_CONTACT.phone,
    address:
      typeof raw.address === "string" && raw.address.trim()
        ? raw.address
        : DEFAULT_CONTACT.address,
  };
};

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
        ...DEFAULT_CONTACT,
      });
      return res.status(200).json(toResponsePayload(created));
    }

    let changed = false;
    if (!doc.name) {
      doc.name = DEFAULT_CONTACT.name;
      changed = true;
    }
    if (!doc.email) {
      doc.email = DEFAULT_CONTACT.email;
      changed = true;
    }
    if (!doc.phone) {
      doc.phone = DEFAULT_CONTACT.phone;
      changed = true;
    }
    if (!doc.address) {
      doc.address = DEFAULT_CONTACT.address;
      changed = true;
    }
    if (changed) {
      await doc.save();
    }

    return res.status(200).json(toResponsePayload(doc));
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

    const { description, courses, name, email, phone, address } = req.body || {};

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

    if (name !== undefined) {
      const nextName = typeof name === "string" ? name.trim() : String(name || "").trim();
      if (!nextName) return res.status(400).json({ message: "Name cannot be empty" });
      updates.name = nextName;
    }
    if (email !== undefined) {
      const nextEmail = typeof email === "string" ? email.trim() : String(email || "").trim();
      if (!nextEmail) return res.status(400).json({ message: "Email cannot be empty" });
      updates.email = nextEmail;
    }
    if (phone !== undefined) {
      const nextPhone = typeof phone === "string" ? phone.trim() : String(phone || "").trim();
      if (!nextPhone) return res.status(400).json({ message: "Phone cannot be empty" });
      updates.phone = nextPhone;
    }
    if (address !== undefined) {
      const nextAddress = typeof address === "string" ? address.trim() : String(address || "").trim();
      if (!nextAddress) return res.status(400).json({ message: "Address cannot be empty" });
      updates.address = nextAddress;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "Provide at least one field: description, courses, name, email, phone, or address",
      });
    }

    let doc = await OhsCourseConfig.findOne({});
    if (!doc) {
      doc = new OhsCourseConfig({
        description: DEFAULT_DESCRIPTION,
        courses: DEFAULT_COURSES,
        ...DEFAULT_CONTACT,
      });
    }

    if (updates.description !== undefined) {
      doc.description = updates.description;
    }
    if (updates.courses !== undefined) {
      doc.courses = updates.courses;
    }
    if (updates.name !== undefined) {
      doc.name = updates.name;
    }
    if (updates.email !== undefined) {
      doc.email = updates.email;
    }
    if (updates.phone !== undefined) {
      doc.phone = updates.phone;
    }
    if (updates.address !== undefined) {
      doc.address = updates.address;
    }

    await doc.save();

    return res.status(200).json(toResponsePayload(doc));
  } catch (error) {
    console.error("updateOhsCourses error:", error);
    return res.status(500).json({ message: "Failed to update OHS courses", error: error.message });
  }
};

