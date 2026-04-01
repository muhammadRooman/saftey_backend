const Message = require("../models/message.model");

exports.getConversation = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    const limit = Math.min(Number(req.query.limit) || 100, 100);

    const docs = await Message.find({
      $or: [
        { from: "admin", to: studentId },
        { from: studentId, to: "admin" },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    return res.json({ messages: docs });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load conversation" });
  }
};

exports.clearConversation = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    await Message.deleteMany({
      $or: [
        { from: "admin", to: studentId },
        { from: studentId, to: "admin" },
      ],
    });

    return res.json({ message: "Conversation cleared" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to clear conversation" });
  }
};

