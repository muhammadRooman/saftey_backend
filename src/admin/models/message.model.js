const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    from: { type: String, required: true }, // "admin" or studentId
    to: { type: String, required: true }, // "admin" or studentId
    message: { type: String, required: true, trim: true },
    // WhatsApp-style status:
    // - admin -> student : student uses seenByStudent
    // - student -> admin : admin uses seenByAdmin
    deliveredToAdmin: { type: Boolean, default: false },
    deliveredAtAdmin: { type: Date, default: null },
    seenByAdmin: { type: Boolean, default: false },
    seenAtAdmin: { type: Date, default: null },
    deliveredToStudent: { type: Boolean, default: false },
    deliveredAtStudent: { type: Date, default: null },
    seenByStudent: { type: Boolean, default: false },
    seenAtStudent: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);

