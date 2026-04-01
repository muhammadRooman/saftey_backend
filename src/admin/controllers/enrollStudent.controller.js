const EnrollStudent = require("../models/enrollStudent.model");
const Signup = require("../models/SignUp.model");
const bcrypt = require("bcrypt");

exports.createEnrollStudent = async (req, res) => {
  try {
    const { name, email, phone, subject, address, userId, password } = req.body;
    console.log("req", req.body);
    const image = req.file ? req.file.filename : null;

    console.log("userId", userId);

    // If a password is provided, ensure the student is also registered as a system user
    if (password) {
      const existingUser = await Signup.findOne({ email });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const studentUser = new Signup({
          name,
          email,
          phone,
          password: hashedPassword,
          role: "student",
          subject,
        });

        await studentUser.save();
      }
    }

    const newEnrollStudent = new EnrollStudent({
      name,
      email,
      phone,
      subject,
      address,
      image,
      user: userId,
    });

    await newEnrollStudent.save();

    res.status(201).json({ message: "Enroll Student created successfully", StudentEnroll: newEnrollStudent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudent = async (req, res) => {
  try {
    // All enrolled students, no filtering by user
    const students = await EnrollStudent.find().sort({ createdAt: -1 });
console.log("students",students);
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching enrolled students",
      error: error.message,
    });
  }
};
// Get a single blog by ID
exports.getStudentId = async (req, res) => {

  try {
    const userId = req.params.id; // Get user ID from URL params
    console.log("Fetching blogs for user ID:", userId);

     const blogs = await EnrollStudent.find({ user: userId })
      .populate("user", "name email") // <-- Populate user details
      .sort({ createdAt: -1 });

    console.log("blogs",blogs);
    if (blogs.length === 0) {
      return res.status(404).json({ message: "No EnrollStudent  found for this user" });
    }

    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching blogs",
      error: error.message,
    });
  }
};

exports.getSingleStudent = async (req, res) => {
  try {
    const studentId = req.params.id; // URL param: /enrollStudent/:id
    console.log("Fetching student with ID:", studentId);

    const student = await EnrollStudent.findById(studentId);
console.log("::::::::::::::::::::::::",student);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student by ID:", error);
    res.status(500).json({
      message: "Error fetching student",
      error: error.message,
    });
  }
};

exports.updateEnrollStudent = async (req, res) => {
  try {
    console.log("Update request body:", req.body);
    const { id } = req.params;
    const { name, email, phone,subject, address } = req.body;
    const image = req.file ? req.file.filename : undefined;

    const updateData = {
      name,
      email,
      phone,
      subject,
      address,
    };

    if (image) {
      updateData.image = image;
    }

    const updatedStudent = await EnrollStudent.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Student updated successfully",
      student: updatedStudent,
    });

  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      message: "Failed to update student",
      error: error.message,
    });
  }
};


exports.deleteEnrollStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await EnrollStudent.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Student deleted successfully",
      student: deletedStudent,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete student",
      error: error.message,
    });
  }
};