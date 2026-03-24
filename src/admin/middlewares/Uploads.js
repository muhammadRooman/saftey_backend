const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// File filter for assignment uploads (image and pdf)
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
  const allowedPdfType = ["application/pdf"];
  if (file.fieldname === "image" && allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (file.fieldname === "pdf" && allowedPdfType.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${file.fieldname === "image" ? "JPEG, PNG, GIF" : "PDF"}`), false);
  }
};

// File filter for single image uploads
const imageFileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type for image. Allowed: JPEG, PNG, GIF"), false);
  }
};

// File filter for video uploads (course videos)
const videoFileFilter = (req, file, cb) => {
  const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
  if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type for video. Allowed: MP4, WebM, MOV, AVI"), false);
  }
};

// File filter for mixed media uploads (image or video)
const mediaFileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Allowed: JPEG, PNG, GIF, WEBP, MP4, WebM, MOV, AVI"), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    if (file.fieldname === "image") {
      req.savedImageId = uniqueFilename;
    } else if (file.fieldname === "pdf") {
      req.savedPdfId = uniqueFilename;
    } else if (file.fieldname === "media") {
      req.savedMediaId = uniqueFilename;
    }
    cb(null, uniqueFilename);
  },
});

// Multer for assignment routes (image and pdf)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).fields([
  { name: "image", maxCount: 1 },
  { name: "pdf", maxCount: 1 },
]);

// Multer for single image uploads (blogs, enrollments)a
const uploadSingleImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single("image");

// Multer for single video upload (course videos) - 100MB limit
const uploadSingleVideo = multer({
  storage: storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
}).single("video");

// Multer for teacher info media upload (image/video) - 100MB limit
const uploadSingleMedia = multer({
  storage: storage,
  fileFilter: mediaFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).single("media");

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ message: `Multer error: Unexpected field '${err.field}'. Expected: ${req.route.path.includes("/submit") || req.route.path.includes("/updateAssignment") ? "image or pdf" : "image"}` });
  } else if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Multer error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  upload,
  uploadSingleImage,
  uploadSingleVideo,
  uploadSingleMedia,
  handleMulterError,
};