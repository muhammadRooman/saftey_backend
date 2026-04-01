const Blog = require("../models/blogs.model"); // Import the Blog model

// Create a new blog post
exports.createBlog = async (req, res) => {
  try {
    const { name, email, phone, address, description,userId } = req.body;
    console.log("req",req.body);
    const image = req.file ? req.file.filename : null;
  //  const userId = req.user._id;
   console.log("userId",userId);
    const newBlog = new Blog({
      name,
      email,
      phone,
      address,
      description,
      image,
      user: userId,
    });

    await newBlog.save();

    res.status(201).json({ message: "Blog created successfully", blog: newBlog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


  
// Get all blog posts
exports.getBlogs = async (req, res) => {
  try {
    
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching blogs",
      error: error.message,
    });
  }
};

// Get a single blog by ID
exports.getBlogById = async (req, res) => {

  try {
    const userId = req.params.id; // Get user ID from URL params
    console.log("Fetching blogs for user ID:", userId);

    const blogs = await Blog.find({ user: userId }).sort({ createdAt: -1 });

    if (blogs.length === 0) {
      return res.status(404).json({ message: "No blogs found for this user" });
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

exports.getsigleBlogById = async (req, res) => {
  try {
    const blogId = req.params.id; // Get blog ID from URL params
    console.log("Fetching single blog by blog ID:", blogId);

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching blog",
      error: error.message,
    });
  }
};

// Update a blog post by ID
exports.updateBlog = async (req, res) => {
  try {
    console.log("req", req.body);
    const { name, email, phone, address, description } = req.body;
    const image = req.file ? req.file.filename : null; // Handle single image upload

    // Find the blog first
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Update fields if provided
    if (name) blog.name = name;
    if (email) blog.email = email;
    if (phone) blog.phone = phone;
    if (address) blog.address = address;
    if (description) blog.description = description;
    if (image) blog.image = image; // Only update if new image is uploaded

    await blog.save();

    res.status(200).json({
      message: "Item updated successfully",
      blog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      message: "Error updating blog",
      error: error.message,
    });
  }
};

// Delete a blog post by ID
exports.deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({
      message: "Blog deleted successfully",
      blog: deletedBlog,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting blog",
      error: error.message,
    });
  }
};
