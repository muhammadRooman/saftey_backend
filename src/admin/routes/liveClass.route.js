// // src/admin/routes/liveClass.route.js
// const express = require("express");
// const router = express.Router();

// const LiveClassController = require("../controllers/liveClass.controller");   // ← Important: "controllers" not "conrollers"
// const { verifyToken } = require("../middlewares/Auth.middleware");

// console.log("📌 liveClass.route.js is being executed");

// // POST /api/admin/liveclass
// router.post("/liveclass", verifyToken, LiveClassController.createLiveClass);

// router.get("/liveclass/teacher", verifyToken, LiveClassController.getTeacherClasses);
// router.patch("/liveclass/:id/status", verifyToken, LiveClassController.updateClassStatus);

// router.get("/student/live-class", verifyToken, LiveClassController.getStudentClasses);

// router.get("/liveclass/:id", verifyToken, LiveClassController.getSingleClass);
// router.delete("/liveclass/:id", verifyToken, LiveClassController.deleteClass);

// module.exports = router;