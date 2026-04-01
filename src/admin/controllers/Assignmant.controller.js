const Assignment = require("../models/Assignmant.model");
const fs = require("fs");
const path = require("path");

exports.submitAssignment = async (req, res) => {
  console.log("submitAssignment: Route reached");
  console.log("Request body:", req.body);
  try {
    const { title, description, teacher, subject } = req.body;
    const student = req.userId; // Use req.userId, not req.body.student

    // Log for debugging
    console.log("Student ID (req.userId):", req.userId);
    console.log("Uploaded files:", req.files);

    // Validate required fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!description) missingFields.push("description");
    if (!teacher) missingFields.push("teacher");
    if (!student) missingFields.push("student");
    if (!subject) missingFields.push("subject");

    if (missingFields.length > 0) {
      if (req.savedImageId) fs.unlinkSync(path.join(__dirname, "../../../../uploads", req.savedImageId));
      if (req.savedPdfId) fs.unlinkSync(path.join(__dirname, "../../../../uploads", req.savedPdfId));
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(", ")}` });
    }

    const image = req.savedImageId ? `/uploads/${req.savedImageId}` : null;
    const pdf = req.savedPdfId ? `/uploads/${req.savedPdfId}` : null;

    if (!image && !pdf) {
      return res.status(400).json({ message: "Image or file (PDF, DOC, DOCX) is required" });
    }

    const newAssignment = new Assignment({
      title,
      description,
      subject,
      image,
      pdf,
      student,
      teacher,
    });

    await newAssignment.save();

    res.status(201).json({
      message: "Assignment submitted successfully",
      assignment: newAssignment,
    });
  } catch (error) {
    if (req.savedImageId) fs.unlinkSync(path.join(__dirname, "../../../uploads", req.savedImageId));
    if (req.savedPdfId) fs.unlinkSync(path.join(__dirname, "../../../uploads", req.savedPdfId));
    console.error("Error submitting assignment:", error);
    res.status(500).json({ message: "Error submitting assignment", error: error.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const userId = req.params.id;

    const assignments = await Assignment.find({ student: userId })
      .populate("student", "name email")
      .populate("teacher", "name email");

    if (assignments.length === 0) {
      return res.status(404).json({ message: "No Assignment found for this user" });
    }

    // Prepend domain to image/pdf if needed
    const fullAssignments = assignments.map((a) => ({
      ...a._doc,
      image: a.image ? `${req.protocol}://${req.get("host")}${a.image}` : null,
      pdf: a.pdf ? `${req.protocol}://${req.get("host")}${a.pdf}` : null,
    }));

    res.status(200).json(fullAssignments);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching assignments",
      error: error.message,
    });
  }
};


// Get all assignments for a teacher
exports.getAssignmentsForTeacher = async (req, res) => {
  try {
    const teacherId = req.user.userId; // Access userId from req.user
    console.log("Teacher ID:", teacherId); // Debugging teacher ID

    // Fetch assignments assigned to the teacher
    const assignments = await Assignment.find({ teacher: teacherId })
      .populate("student", "name email") // Populate student details
      .sort({ submittedAt: -1 }); // Sort by submission date (latest first)

    console.log("Assignments:", assignments); // Debugging assignments

    if (assignments.length === 0) {
      return res.status(404).json({ message: "No assignments found for this teacher" });
    }

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({
      message: "Error fetching assignments",
      error: error.message,
    });
  }
};

exports.getAssignmantId = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id)
      .populate("student", "name email")
      .populate("teacher", "name email");

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching assignment",
      error: error.message,
    });
  }
};
// Get all assignments submitted by a student
exports.getAssignmentsForStudent = async (req, res) => {
  try {
    const studentId = req.userId; // Assume student ID is coming from authentication middleware
    
    // Fetch assignments submitted by the student
    const assignments = await Assignment.find({ student: studentId })
      .populate("teacher", "name email") // Populate teacher details
      .sort({ submittedAt: -1 }); // Sort by submission date (latest first)

    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({
      message: "Error fetching assignments",
      error: error.message,
    });
  }
};


exports.updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, teacher } = req.body;

    // Find the assignment first
    const existingAssignment = await Assignment.findById(id);
    if (!existingAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Prepare update object
    const updateFields = {
      title: title || existingAssignment.title,
      description: description || existingAssignment.description,
      subject: subject || existingAssignment.subject,
      teacher: teacher || existingAssignment.teacher,
    };

    // Handle new image upload
    if (req.savedImageId) {
      // Remove old image
      if (existingAssignment.image) {
        const oldImagePath = path.join(__dirname, "../../../", existingAssignment.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      updateFields.image = `uploads/${req.savedImageId}`;
    }

    // Handle new PDF upload
    if (req.savedPdfId) {
      // Remove old PDF
      if (existingAssignment.pdf) {
        const oldPdfPath = path.join(__dirname, "../../../", existingAssignment.pdf);
        if (fs.existsSync(oldPdfPath)) fs.unlinkSync(oldPdfPath);
      }
      updateFields.pdf = `uploads/${req.savedPdfId}`;
    }

    // Update document
    const updatedAssignment = await Assignment.findByIdAndUpdate(id, updateFields, {
      new: true,
    })
      .populate("student", "name email")
      .populate("teacher", "name email");

    res.status(200).json({
      message: "Assignment updated successfully",
      assignment: updatedAssignment,
    });

  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({
      message: "Failed to update assignment",
      error: error.message,
    });
  }
};

exports.getStudentByIdDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await Assignment.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: "assignamnt not found" });
    }

    res.status(200).json({
      message: "assignamnt  deleted successfully",
      student: deletedStudent,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete student",
      error: error.message,
    });
  }
};




exports.getAssignmentsByTeacherId = async (req, res) => {
  try {
    const teacherId = req.params.id; // Teacher ki id URL se lein

    // Us teacher ko diye gaye assignments nikalain
    const assignments = await Assignment.find({ teacher: teacherId })
      .populate("student", "name email")
      .populate("teacher", "name email")
      .sort({ submittedAt: -1 });

    if (assignments.length === 0) {
      return res.status(404).json({ message: "No assignments found for this teacher" });
    }

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching assignments for teacher",
      error: error.message,
    });
  }
};




exports.postAssighnamnetMarks = async (req, res) => {
  console.log("MARKS ROUTE HIT", req.body);
  try {
    const { id } = req.params;
   const { marks, outofMarks } = req.body;
console.log("MARKS ROUTE HIT12", marks, outofMarks);

if (marks == null) {
  return res.status(400).json({ message: "Marks are required" });
}

const assignment = await Assignment.findById(id);
if (!assignment) {
  return res.status(404).json({ message: "Assignment not found" });
}

assignment.marks = Number(marks);
assignment.outofMarks = outofMarks !== undefined ? Number(outofMarks) : assignment.outofMarks;

await assignment.save();

res.status(200).json({ message: "Marks updated", assignment });
  } catch (error) {
    console.error("Error updating marks:", error);
    res.status(500).json({ message: "Error updating marks", error: error.message });
  }
};
