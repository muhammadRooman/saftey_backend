const express = require("express");
const router = express.Router();
const BlogController = require("../conrollers/Blogs.controller");
const EnrollStudentController = require("../conrollers/enrollStudent.controller");
const EnrollTeacherController = require("../conrollers/enrollTeacher.controller");
const AssignmentController = require("../conrollers/Assignmant.controller");
const {
  upload,
  uploadSingleImage,
  uploadSingleVideo,
  uploadSingleMedia,
  handleMulterError,
} = require("../middlewares/Uploads");
const { verifyToken } = require("../middlewares/Auth.middleware");
const CourseVideoController = require("../conrollers/courseVideo.controller");
const ProvideLinkController = require("../conrollers/ProvideLink.controller");
const TeacherInfoController = require("../conrollers/teacherInfo.controller");
const OhsCourseController = require("../conrollers/ohsCourse.controller");

// Blog Routes
router.post("/blog", verifyToken, uploadSingleImage, handleMulterError, BlogController.createBlog);
router.get("/blog", verifyToken, BlogController.getBlogs);
router.get("/blog/:id", verifyToken, BlogController.getBlogById);
router.get("/blog/edit/:id", verifyToken, BlogController.getsigleBlogById);
router.patch("/blog/:id", verifyToken, uploadSingleImage, handleMulterError, BlogController.updateBlog);

// Enroll Student Routes
router.post("/enrollStudent", verifyToken, uploadSingleImage, handleMulterError, EnrollStudentController.createEnrollStudent);
router.delete("/enrollStudent/:id", verifyToken, EnrollStudentController.deleteEnrollStudent);
router.get("/enrollStudent", verifyToken, EnrollStudentController.getStudent);
router.get("/enrollStudent/:id", verifyToken, EnrollStudentController.getStudentId);
router.patch("/enrollStudent/:id", verifyToken, uploadSingleImage, handleMulterError, EnrollStudentController.updateEnrollStudent);
router.get("/enrollStudent/single/:id", verifyToken, EnrollStudentController.getSingleStudent);

// Enroll Teacher Routes
router.post("/enrollTeacher", verifyToken, uploadSingleImage, handleMulterError, EnrollTeacherController.newEnrollTeacher);
router.get("/enrollTeacher", verifyToken, EnrollTeacherController.getTeacher);
router.get("/enrollTeacher/:id", verifyToken, EnrollTeacherController.getTeacherId);
router.patch("/enrollTeacher/:id", verifyToken, uploadSingleImage, handleMulterError, EnrollTeacherController.updateEnrollTeacher);
router.get("/enrollTeacher/single/:id", verifyToken, EnrollTeacherController.getSingleTeacher);
router.delete("/enrollTeacher/:id", verifyToken, EnrollTeacherController.deleteEnrollTeacher);

// sudent Assignment Routes
router.post("/submit", verifyToken, upload, handleMulterError, AssignmentController.submitAssignment);
router.get("/teacher", verifyToken, AssignmentController.getAssignmentsForTeacher);
router.get("/getStudentById/:id", verifyToken, AssignmentController.getStudentById);

router.get("/assignment/:id", verifyToken, AssignmentController.getAssignmantId);
router.get("/student", verifyToken, AssignmentController.getAssignmentsForStudent);
router.patch("/updateAssignment/:id", verifyToken, upload, handleMulterError, AssignmentController.updateAssignment);
router.get("/students/:id", verifyToken, AssignmentController.getStudentById);
router.delete("/students/:id", verifyToken, AssignmentController.getStudentByIdDelete);
router.get("/assignments/teacher/:id", verifyToken, AssignmentController.getAssignmentsByTeacherId);





router.post("/assignments/marks/:id", verifyToken, AssignmentController.postAssighnamnetMarks);

// Course Videos (NEBOSH / IOSH / OSHA) - Teacher upload, Student gets by assigned courses
router.post("/courseVideo", verifyToken, uploadSingleVideo, handleMulterError, CourseVideoController.uploadVideo);
router.get("/courseVideo", verifyToken, CourseVideoController.getVideos);
router.get("/courseVideo/my-videos", verifyToken, CourseVideoController.getMyVideos);
router.get("/courseVideo/student/:studentId", verifyToken, CourseVideoController.getVideosForStudent);
router.delete("/courseVideo/:id", verifyToken, CourseVideoController.deleteVideo);
router.put(
    "/courseVideo/:id",
    verifyToken,
    uploadSingleVideo, // for optional video file upload
    handleMulterError,
    CourseVideoController.updateVideo
  );

// ✅ Create / Update (Upsert)
router.post("/provide-link/:id", verifyToken, ProvideLinkController.provideLink);

// ✅ Get all
router.get("/provide-links", verifyToken, ProvideLinkController.getAllLinks);

// ✅ Get single (by student id)
router.get("/provide-link/:id", verifyToken, ProvideLinkController.getLinkByStudent);

// ✅ Update (by link id)
router.put("/provide-link/:id", verifyToken, ProvideLinkController.updateLink);

// ✅ Delete
router.delete("/provide-link/:id", verifyToken, ProvideLinkController.deleteLink);
// // delete contact
// router.delete("/contact/:id", verifyToken, ContactUSController.deleteContact);

// Teacher Info (admin CRUD, students can read)
router.post(
  "/teacher-info",
  verifyToken,
  uploadSingleMedia,
  handleMulterError,
  TeacherInfoController.createTeacherInfo
);
router.get("/teacher-info", verifyToken, TeacherInfoController.getTeacherInfoList);
router.put(
  "/teacher-info/:id",
  verifyToken,
  uploadSingleMedia,
  handleMulterError,
  TeacherInfoController.updateTeacherInfo
);
router.delete("/teacher-info/:id", verifyToken, TeacherInfoController.deleteTeacherInfo);

// OHS All Courses (single description + multiple course names)
router.get("/ohs-courses", verifyToken, OhsCourseController.getOhsCourses);
router.put("/ohs-courses", verifyToken, OhsCourseController.updateOhsCourses);

module.exports = router;