const express = require("express");
const router = express.Router();
const authController = require("../conrollers/Auth.controller"); // <- conrollers
const blogController = require("../conrollers/Blogs.controller");
const { verifyToken } = require("../middlewares/Auth.middleware");

// router.post("/signup", authController.signUp); 
// router.post("/login", authController.login); 
// router.patch("/updateUser/:id", verifyToken, authController.updateUser); 
// router.get("/getUser/:id", verifyToken, authController.getUser);
// router.post("/forgot-password", authController.forgotPassword);
// router.post("/reset-password/:id", authController.resetPassword);
// router.get("/userDetails", verifyToken, authController.getLoggedInUserDetails);
router.post("/signup", authController.signUp); 
router.post("/login", authController.login); 
router.patch("/updateUser/:id", verifyToken, authController.updateUser); 
router.put("/updateStudent/:id", verifyToken, authController.updateStudent); 
router.get("/getUser/:id", verifyToken, authController.getUser);
router.get("/getAllUsers", verifyToken, authController.getAllUsers);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:id", authController.resetPassword);
router.get("/userDetails", verifyToken, authController.getLoggedInUserDetails);
// ✅ New Delete route
router.delete("/deleteUser/:id", verifyToken, authController.deleteUser);
module.exports = router;
