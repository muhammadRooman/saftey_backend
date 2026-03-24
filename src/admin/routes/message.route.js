const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/Auth.middleware");
const messageController = require("../conrollers/Message.controller");

// Admin or student can fetch their conversation with admin
router.get("/conversation/:studentId", verifyToken, messageController.getConversation);

// Clear conversation (admin or student)
router.delete("/conversation/:studentId", verifyToken, messageController.clearConversation);

module.exports = router;

