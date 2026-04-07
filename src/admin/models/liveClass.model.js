const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    roomName: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true 
    },
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

// Safe model registration (prevents "Cannot overwrite model" error in development)
const LiveClass = mongoose.models.liveClass || mongoose.model("liveClass", liveClassSchema);

module.exports = LiveClass;