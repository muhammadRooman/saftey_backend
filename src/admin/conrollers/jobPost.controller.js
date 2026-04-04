const JobPost = require("../models/jobPost.model");
const Signup = require("../models/SignUp.model");

const ALLOWED_JOB_TYPES = ["Full-Time", "Part-Time", "Internship", "Contract"];

async function getUserRole(userId) {
  const u = await Signup.findById(userId).select("role");
  return u?.role || null;
}

function parseSkills(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  try {
    const j = JSON.parse(raw);
    if (Array.isArray(j)) return j.map(String).map((s) => s.trim()).filter(Boolean);
  } catch (_) {
    /* comma-separated */
  }
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildJobPayload(req, posterFilename) {
  const {
    postMode,
    title,
    description,
    companyName,
    contactNumber,
    location,
    jobType,
    jobDescription,
    skills,
    deadline,
    applyLink,
    applyLinkSecondary,
    status,
  } = req.body;

  const mode = postMode === "manual" ? "manual" : "image";
  const st = status === "draft" ? "draft" : "published";

  const payload = {
    postMode: mode,
    title: String(title || "").trim(),
    description: String(description || "").trim(),
    companyName: String(companyName || "").trim(),
    location: String(location || "").trim(),
    contactNumber: String(contactNumber || "").trim(),
    jobType: ALLOWED_JOB_TYPES.includes(jobType) ? jobType : "",
    jobDescriptionHtml: String(jobDescription || "").trim(),
    skills: parseSkills(skills),
    applyLink: String(applyLink || "").trim(),
    applyLinkSecondary: String(applyLinkSecondary || "").trim(),
    status: st,
    createdBy: req.userId,
  };

  if (deadline) {
    const d = new Date(deadline);
    payload.deadline = Number.isNaN(d.getTime()) ? undefined : d;
  }

  if (posterFilename) {
    payload.posterImage = posterFilename;
  }

  return payload;
}

exports.createJob = async (req, res) => {
  try {
console.log("111111111",req.body)
    const role = await getUserRole(req.userId);
    if (role !== "teacher") {
      return res.status(403).json({ message: "Only admin can post jobs" });
    }

    const posterFile = req.file?.filename;
    const body = req.body; 
    const postMode = body.postMode === "manual" ? "manual" : "image";

    if (!body.title || !String(body.title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (postMode === "image") {
      if (!posterFile) {
        return res.status(400).json({ message: "Job poster image is required for image post" });
      }
      if (!body.description || !String(body.description).trim()) {
        return res.status(400).json({ message: "Description is required for image post" });
      }
    } else {
      if (!body.companyName || !String(body.companyName).trim()) {
        return res.status(400).json({ message: "Company name is required for manual post" });
      }
      if (!body.location || !String(body.location).trim()) {
        return res.status(400).json({ message: "Location is required for manual post" });
      }
      if (!body.contactNumber || !String(body.contactNumber).trim()) {
        return res.status(400).json({ message: "contactNumber is required for image post" });
      }
      if (!body.jobType || !ALLOWED_JOB_TYPES.includes(body.jobType)) {
        return res.status(400).json({ message: "Valid job type is required for manual post" });
      }
      if (!body.jobDescription || !String(body.jobDescription).trim()) {
        return res.status(400).json({ message: "Job description is required for manual post" });
      }
    }

    const data = buildJobPayload(req, posterFile || "");
    const job = new JobPost(data);
    await job.save();

    res.status(201).json({ message: "Job posted successfully", job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listJobs = async (req, res) => {
  try {
    const role = await getUserRole(req.userId);
    const filter = {};
    if (role === "student") {
      filter.status = "published";
    }

    const jobs = await JobPost.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id).populate("createdBy", "name email").lean();
    if (!job) return res.status(404).json({ message: "Job not found" });
    const role = await getUserRole(req.userId);
    if (role === "student" && job.status !== "published") {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const role = await getUserRole(req.userId);
    if (role !== "teacher") {
      return res.status(403).json({ message: "Only admin can update jobs" });
    }

    const job = await JobPost.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const posterFile = req.file?.filename;
    const {
      postMode,
      title,
      description,
      companyName,
      contactNumber,
      location,
      jobType,
      jobDescription,
      skills,
      deadline,
      applyLink,
      applyLinkSecondary,
      status,
    } = req.body;

    if (postMode === "manual" || postMode === "image") {
      job.postMode = postMode;
    }
    if (title != null) job.title = String(title).trim();
    if (description != null) job.description = String(description).trim();
    if (companyName != null) job.companyName = String(companyName).trim();
    if (location != null) job.location = String(location).trim();
    if (contactNumber != null) job.contactNumber = String(contactNumber).trim();
    if (jobType != null) job.jobType = ALLOWED_JOB_TYPES.includes(jobType) ? jobType : job.jobType;
    if (jobDescription != null) job.jobDescriptionHtml = String(jobDescription).trim();
    if (skills != null) job.skills = parseSkills(skills);
    if (deadline !== undefined) {
      if (!deadline) job.deadline = undefined;
      else {
        const d = new Date(deadline);
        if (!Number.isNaN(d.getTime())) job.deadline = d;
      }
    }
    if (applyLink != null) job.applyLink = String(applyLink).trim();
    if (applyLinkSecondary != null) job.applyLinkSecondary = String(applyLinkSecondary).trim();
    if (status === "draft" || status === "published") job.status = status;
    if (posterFile) job.posterImage = posterFile;

    await job.save();
    res.status(200).json({ message: "Job updated", job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const role = await getUserRole(req.userId);
    if (role !== "teacher") {
      return res.status(403).json({ message: "Only admin can delete jobs" });
    }
    const job = await JobPost.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.status(200).json({ message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
