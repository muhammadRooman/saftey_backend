const mongoose = require("mongoose");

const ohsCourseConfigSchema = new mongoose.Schema(
  {
    // Single shared description shown to students for all OHS course cards.
    description: { type: String, required: true, default: "" },
    // Multiple course names (cards). Admin can add/edit/delete these.
    courses: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ohsCourseConfig", ohsCourseConfigSchema);

