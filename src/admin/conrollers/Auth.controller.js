const Signup = require("../models/SignUp.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Add JWT if you want to use it for login
const nodemailer = require("nodemailer");

//  
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("User ID:", id);

    const user = await Signup.findById(id).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("Delete User ID:", id);

    const user = await Signup.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Signup.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    // const users = await Signup.find().select("-password"); // password hide
    const users = await Signup.find().select("-password"); // password hide

    res.status(200).json({
      success: true,
      totalUsers: users.length,
      users,
    });

  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password, role, subject } = req.body;

    console.log("Update User ID:", id);
    console.log("Update Data:", req.body);

    // Check user exists
    const user = await Signup.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (subject) user.subject = subject;

    // If password provided → hash it
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user,
    });

  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Signup Function
exports.signUp = async (req, res) => {
  try {
    const { name, email, password, phone, role,subject } = req.body;
console.log("1234567",req.body)
    // Basic validation
    // if (!["teacher", "student"].includes(role)) {
    //   return res.status(400).json({ message: "Invalid role selected" });
    // }

    const existingUser = await Signup.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Signup({ name, email, password: hashedPassword, phone, subject });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};



//getLoggedInUserDetails
exports.getLoggedInUserDetails = async (req, res) => {
  try {
    const id = req.user.userId; // 👈 JWT middleware سے آئے گا

    const user = await Signup.findById(id).select("name email role subject");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Login Function
exports.login = async (req, res) => {
  try {
    const { email, password, } = req.body;
console.log("email",email);
console.log("password",password);
    const existingUser = await Signup.findOne({ email });
    console.log("existingUser",existingUser);
    if (!existingUser) {
      return res.status(200).json({ message: "Invalid credentials", success: false, });
    }

    console.log("password.....",password);
    console.log("existingUser.....",existingUser.password);
    // Check if the password matches
    const isMatch = await bcrypt.compare(password, existingUser.password);

    console.log("isMatch",isMatch);
    if (!isMatch) {
      return res.status(200).json({ message: "Invalid credentials" ,   success: false,});
    }

    // Generate a token (if you're using JWT)
    const token = jwt.sign({ userId: existingUser._id }, "your_jwt_secret_key", { expiresIn: "1d" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: existingUser._id,  // 🔑 Include ID here
        name: existingUser.name,
        email: existingUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


// update Profile Function
exports.updateStudent = async (req, res) => {
  try {
    const { name, email, password, phone,subject } = req.body;
    const { id } = req.params;

    console.log("User ID:", id);
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Phone:", phone);
    console.log("Password:", password);
    console.log("subject:", subject);

    // Find user by ID (not email)
    const user = await Signup.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (subject) user.subject = subject;
    if (password) user.password = password;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

//forget password function
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
console.log("eeeeeeeeeeeeeee",email)
  try {
    const user = await Signup.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
      
    }

    // Create token (valid for 15 minutes)
    const token = jwt.sign({ id: user._id }, "your_jwt_secret_key", { expiresIn: "15m" });

    // Prepare reset link
    const resetLink = `http://localhost:3002/reset-password/${user._id}/${token}`;

    // Nodemailer transport config (use your email/password or app password)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "muhammadrooman5@gmail.com",
        pass: "sjdx jquz uvfw bpke",
      },
    });

    // Email options
    const mailOptions = {
      from: '"Rooman" <muhammadrooman5@gmail.com>',
      to: user.email,
      subject: "Reset Your Password - CMS Admin Panel",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #4CAF50;">Reset Your Password</h2>
            <p style="font-size: 16px; color: #555;">Hello <strong>${user.name}</strong>,</p>
            <p style="font-size: 16px; color: #555;">Click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.</p>
            <a href="${resetLink}" style="display: inline-block; margin: 20px 0; padding: 12px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
            <p style="font-size: 14px; color: #999;">If you didn’t request a password reset, you can ignore this email.</p>
           <p style="font-size: 14px; color: red;">Project created by Muhammad Rooman &copy; 2025</p>


          </div>
        </div>
      `,
    };
    
    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password Function
exports.resetPassword = async (req, res) => {

  const { id } = req.params;
  const { token, newPassword } = req.body;
  console.log("Reset Password Request:", req.body);
  try {
    const decoded = jwt.verify(token, "your_jwt_secret_key");

    console.log("Decoded Token:", decoded);
    if (decoded.id !== id) {
      return res.status(400).json({ message: "Invalid token or user ID" });
    }

    const user = await Signup.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Token has expired" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};
