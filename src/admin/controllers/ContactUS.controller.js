const Contact = require("../models/contactUS.model");

// ---------------- Create Contact ----------------

exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    const newContact = new Contact({
      name,
      email,
      phone,
      message,
    });

    await newContact.save();

    res.status(201).json({
      message: "Contact created successfully",
      data: newContact,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating contact",
      error: error.message,
    });
  }
};

// ---------------- Get All Contacts ----------------

exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Contacts fetched successfully",
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching contacts",
      error: error.message,
    });
  }
};

// ---------------- Delete Contact ----------------

exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    await Contact.findByIdAndDelete(id);

    res.status(200).json({
      message: "Contact deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting contact",
      error: error.message,
    });
  }
};
