const ProvideLink = require("../models/ProvideLink.model");
const Signup = require("../models/SignUp.model"); 
// ✅ CREATE or UPDATE (Upsert)
exports.provideLink = async (req, res) => {
  try {
    const { link } = req.body;
    const { id } = req.params;

    if (!link) {
      return res.status(400).json({ success: false, message: "Link is required" });
    }

    // Check existing link
    let existing = await ProvideLink.findOne({ studentId: id });

    if (existing) {
      existing.link = link;
      await existing.save();

      // ✅ update hasLink in signup
      await Signup.findByIdAndUpdate(id, { hasLink: true });

      return res.status(200).json({
        success: true,
        message: "Link updated successfully",
        data: existing,
      });
    }

    // Create new link
    const newLink = await ProvideLink.create({ studentId: id, link });

    // ✅ update hasLink in signup
    await Signup.findByIdAndUpdate(id, { hasLink: true });

    res.status(201).json({
      success: true,
      message: "Link created successfully",
      data: newLink,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET ALL LINKS
exports.getAllLinks = async (req, res) => {
  try {
    const links = await ProvideLink.find()
      .populate("studentId", "name email");

    res.status(200).json({
      success: true,
      count: links.length,
      data: links,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET SINGLE BY STUDENT ID
exports.getLinkByStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const link = await ProvideLink.findOne({ studentId: id })
      .populate("studentId", "name email");

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "No link found",
      });
    }

    res.status(200).json({
      success: true,
      data: link,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE BY LINK ID
exports.updateLink = async (req, res) => {
  try {
    const { link } = req.body;
    const { id } = req.params;

    const updated = await ProvideLink.findByIdAndUpdate(
      id,
      { link },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Link updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE LINK
// ✅ DELETE LINK
exports.deleteLink = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔹 Find the link first
    const deleted = await ProvideLink.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    // 🔹 Update hasLink to false in Signup model
    const updatedSignup = await Signup.findOneAndUpdate(
      { _id: deleted.studentId }, // ensure proper _id match
      { hasLink: false },
      { new: true } // return updated doc
    );

    console.log("Updated signup after delete:", updatedSignup); // check if update happened

    res.status(200).json({
      success: true,
      message: "Link deleted successfully and hasLink set to false",
      data: updatedSignup,
    });
  } catch (error) {
    console.error("Error deleting link:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};