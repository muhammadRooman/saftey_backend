const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
  console.log("verifyToken middleware triggered for:", req.method, req.url);
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader || "None");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("verifyToken: Missing or invalid Authorization header");
    return res.status(401).json({ message: "Unauthorized: Token not provided or invalid format" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key");
    console.log("Decoded Token:", decoded);

    if (!decoded.userId) {
      console.log("verifyToken: Token missing userId");
      return res.status(401).json({ message: "Unauthorized: Token missing userId" });
    }

    req.userId = decoded.userId; // Explicitly set req.userId
    req.user = decoded; // Keep for other user data
    console.log("verifyToken: Token valid, userId set to", req.userId);
    next();
  } catch (err) {
    console.error("verifyToken: Token verification failed:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token has expired" });
    }
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};