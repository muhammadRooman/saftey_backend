const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    address: String,
    subject: [{ type: String }], 
    image: String, 
     user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "signup",
          required: true,
        },
  },
  { timestamps: true }
);

module.exports = mongoose.model("enrollStudent", blogSchema);
