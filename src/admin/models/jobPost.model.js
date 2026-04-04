const mongoose = require("mongoose");

const jobPostSchema = new mongoose.Schema(
  {
    postMode: { type: String, enum: ["image", "manual"], required: true },
    title: { type: String, required: true, trim: true },
    /** Short text; for image posts this is the text under the title */
    description: { type: String, default: "" },
    /** Uploaded job-poster image filename (image mode) */
    posterImage: { type: String, default: "" },

    companyName: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    location: { type: String, default: "" },
    jobType: { type: String, default: "" },
    /** Full description for manual posts (plain or HTML from textarea) */
    jobDescriptionHtml: { type: String, default: "" },
    skills: [{ type: String, trim: true }],
    deadline: { type: Date },
    applyLink: { type: String, default: "" },
    applyLinkSecondary: { type: String, default: "" },

    status: { type: String, enum: ["draft", "published"], default: "published" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "signup",
      required: true,
    },
  },
  { timestamps: true }
);

try {
  mongoose.deleteModel("jobPost");
} catch (_) {
  /* noop */
}

module.exports = mongoose.model("jobPost", jobPostSchema);
