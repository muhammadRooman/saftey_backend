const mongoose = require("mongoose");

const courseVideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    courseType: {
      type: String,
      enum: ["NEBOSH", "IOSH", "OSHA", "RIGGER3"],
      required: true,
    },
    videoUrl: { type: String, required: true }, // stored filename in uploads folder
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "signup",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("courseVideo", courseVideoSchema);
