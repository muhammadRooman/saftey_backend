const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    roomName: { type: String, required: true, unique: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "signup",
      required: true,
    },
    allowedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "signup",
      },
    ],
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

try {
  mongoose.deleteModel("liveClass");
} catch (_) {
  /* not registered */
}

module.exports = mongoose.model("liveClass", liveClassSchema);

