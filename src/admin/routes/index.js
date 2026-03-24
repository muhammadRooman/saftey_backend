const express = require("express");
const router = express.Router();

// Import sub-routes
const signUpRoutes = require("./user.route");
const blogsRoutes = require("./blogs.route");
const messageRoutes = require("./message.route");




// Route grouping
router.use("/auth", signUpRoutes); // e.g., /api/auth/signup
router.use("/admin", blogsRoutes); // e.g., /api/auth/signup
router.use("/messages", messageRoutes);




module.exports = router;
