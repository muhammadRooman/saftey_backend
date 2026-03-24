const mongoose = require("mongoose");

const enrollTeacherSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    address: String,
    location:String,
    salary:String,
    // Multiple subjects / courses this teacher can teach
    subject: [
      {
        type: String,
      },
    ],
    image: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "signup", // Make sure this matches the user model name
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EnrollTeacher", enrollTeacherSchema);
