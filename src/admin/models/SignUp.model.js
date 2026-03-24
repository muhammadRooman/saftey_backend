const mongoose = require("mongoose");

const signupSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  subject: [
    {
      type: String
    }
  ],
  role: {
    type: String,
    enum: ["teacher", "student"],
    default: "student",
    // required: true,
  },
   hasLink: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("signup", signupSchema);
