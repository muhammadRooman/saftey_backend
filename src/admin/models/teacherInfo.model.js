const mongoose = require("mongoose");

const teacherInfoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, default: "", trim: true },
    mediaUrl: { type: String, required: true, trim: true }, // stored filename in uploads
    mediaType: { type: String, enum: ["image", "video"], required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "signup",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("teacherInfo", teacherInfoSchema);
