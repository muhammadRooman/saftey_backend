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
    /** Optional attachment for the course (uploaded by teacher/admin). */
    fileUrl: { type: String, default: "" }, // stored filename in uploads folder
    language: {
      type: String,
      enum: ["Urdu", "English", "Arabic", "Pashto"],
      default: "English",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "signup",
      required: true,
    },
  },
  { timestamps: true }
);

// Always expose `language` in JSON (and default for old docs missing the field)
const addLanguageToJson = (_, ret) => {
  if (ret.language == null || ret.language === "") {
    ret.language = "English";
  }
  return ret;
};
courseVideoSchema.set("toJSON", { transform: addLanguageToJson });
courseVideoSchema.set("toObject", { transform: addLanguageToJson });

// Drop stale compiled model so schema changes (e.g. `language`) apply after server edits — restart still recommended
try {
  mongoose.deleteModel("courseVideo");
} catch (_) {
  /* not registered yet */
}

module.exports = mongoose.model("courseVideo", courseVideoSchema);
