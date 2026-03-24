const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    address: String,
    description: String,
    image: String, // Corrected type
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EnrollTeacher",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("blog", blogSchema);
