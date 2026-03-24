const EnrollTeacher = require("../models/enrollTeacher.model"); // Import the Blog model

// Create a new blog post
exports.newEnrollTeacher = async (req, res) => {
  try {
    const { name, email, phone, address, subject, userId,location,salary } = req.body;
    console.log("req",req.body);
    const image = req.file ? req.file.filename : null;
  //  const userId = req.user._id;
   console.log("userId",userId);
    // Normalize subject to array
    let subjectArray = [];
    if (Array.isArray(subject)) {
      subjectArray = subject;
    } else if (typeof subject === "string" && subject.trim()) {
      try {
        const parsed = JSON.parse(subject);
        subjectArray = Array.isArray(parsed) ? parsed : [subject];
      } catch {
        subjectArray = [subject];
      }
    }

    const newEnrollTeacher = new EnrollTeacher({
      name,
      email,
      phone,
      address,
      location,salary,
      subject: subjectArray,
      image,
      
      user: userId,
    });

    await newEnrollTeacher.save();

    res.status(201).json({ message: "Enroll Student created successfully", TeacherEnroll: newEnrollTeacher });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTeacher = async (req, res) => {
  try {
    // All enrolled students, no filtering by user
    const students = await EnrollTeacher.find().sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching enrolled teacher",
      error: error.message,
    });
  }
};
// Get a single blog by ID
exports.getTeacherId = async (req, res) => {

  try {
    const userId = req.params.id; // Get user ID from URL params
    console.log("Fetching blogs for user ID:", userId);
console.log("EnrollTeacher",EnrollTeacher.find({ user: userId }));
    const blogs = await EnrollTeacher.find({ user: userId }).sort({ createdAt: -1 });

    console.log("blogs",blogs);
    if (blogs.length === 0) {
      return res.status(404).json({ message: "No EnrollTeacher  found for this user" });
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

exports.getSingleTeacher = async (req, res) => {
  try {
    const studentId = req.params.id; // URL param: /enrollStudent/:id
    console.log("Fetching student with ID:", studentId);

    const student = await EnrollTeacher.findById(studentId);
console.log("SSSSSSSSSSSSSSSSSSSSSSSSSS",student);
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

exports.updateEnrollTeacher = async (req, res) => {
  try {
    console.log("Update request body:", req.body);
    const { id } = req.params;
    const { name, email, phone, address, subject,location,salary } = req.body;
    const image = req.file ? req.file.filename : undefined;

    const updateData = {
      name,
      email,
      phone,
      location,salary,
      address,
    };

    if (typeof subject !== "undefined") {
      let subjectArray = [];
      if (Array.isArray(subject)) {
        subjectArray = subject;
      } else if (typeof subject === "string" && subject.trim()) {
        try {
          const parsed = JSON.parse(subject);
          subjectArray = Array.isArray(parsed) ? parsed : [subject];
        } catch {
          subjectArray = [subject];
        }
      }
      updateData.subject = subjectArray;
    }

    if (image) {
      updateData.image = image;
    }

    const updatedStudent = await EnrollTeacher.findByIdAndUpdate(
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

exports.deleteEnrollTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTeacher = await EnrollTeacher.findByIdAndDelete(id);

    if (!deletedTeacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      message: "Teacher deleted successfully",
      teacher: deletedTeacher,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete teacher",
      error: error.message,
    });
  }
};