const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  image: {
    type: String, // File path or filename for the submitted assignment
    required: false,
  },
  pdf: {
  type: String, // File path or filename for the submitted PDF
  required: false,
},
marks: {
  type: Number,
  default: null,
},
outofMarks: {
  type: Number,
  default: null,
},
  student: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the student
    ref: "signup", // Assuming "user" model is used for students
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the teacher
    ref: "EnrollTeacher", // Assuming "user" model is used for teachers
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now, // Automatically set submission time
  },
});

module.exports = mongoose.model("assignment", assignmentSchema);