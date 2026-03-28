// const express = require("express");
// const cors = require("cors");
// const http = require("http");
// const { Server } = require("socket.io");
// const Message = require("./src/admin/models/message.model");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 8082;

// // ✅ CONNECT TO DB
// require("./src/admin/config/db.config").connect();

// // Create HTTP server wrapper (for Socket.IO)
// const server = http.createServer(app);

// // Socket.IO instance
// const io = new Server(server, {
//   cors: {
//     origin: "*", // TODO: lock to specific frontend URL in production
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   },
// });

// // Middleware
// // app.use(
// //   cors({
// //     origin: "*",
// //     methods: ["GET", "POST", "PUT", "DELETE"],
// //     credentials: true,
// //   })
// // );

// const allowedOrigins = [
//   "http://localhost:3000",
//   "https://saftey-frontend.vercel.app", // ✅ apna real URL
//   "https://saftey-frontend-git-main.vercel.app" // (optional preview URL)
// ];


// app.use(cors({
//   origin: function(origin, callback){
//     if(!origin) return callback(null, true);
//     if(allowedOrigins.indexOf(origin) === -1){
//       const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
//       return callback(new Error(msg), false);
//     }
//     return callback(null, true);
//   },
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Routes
// const apiRoutes = require("./src/admin/routes/index");
// app.use("/api", apiRoutes);
// app.use("/uploads", express.static("uploads"));
// app.get("/", (req, res) => res.send("✅ Server running on Railway"));
// // Track online students per studentId (safe for multiple tabs)
// // studentId -> Set(socketIds)
// const onlineStudentsById = new Map();

// // ========== SOCKET.IO REALTIME CHAT ==========
// io.on("connection", (socket) => {
//   console.log("Socket connected:", socket.id);

//   // Admin joins a common admin room
//   socket.on("join-admin", () => {
//     socket.join("admin-room");
//     console.log("Admin joined admin-room");
//     // Send current online student ids immediately
//     try {
//       const onlineIds = Array.from(onlineStudentsById.keys());
//       socket.emit("online-students", { studentIds: onlineIds });
//     } catch (e) {
//       // best-effort
//     }
//   });

//   // Student joins their personal room
//   socket.on("join-student", ({ studentId }) => {
//     if (!studentId) return;
//     const room = `student:${studentId}`;
//     socket.join(room);
//     socket.data.studentId = String(studentId);

//     const sid = String(studentId);
//     const set = onlineStudentsById.get(sid) || new Set();
//     const beforeSize = set.size;
//     set.add(socket.id);
//     onlineStudentsById.set(sid, set);

//     // notify admins only on first socket for that student
//     if (beforeSize === 0) {
//       io.to("admin-room").emit("student-online", { studentId: sid });
//     }
//     console.log(`Student joined room ${room}`);
//   });

//   // Admin -> Student
//   socket.on("admin-send-message", async ({ studentId, message }) => {
//     if (!studentId || !message) return;

//     try {
//       const sid = String(studentId);
//       const studentRoom = `student:${sid}`;

//       // delivered if student is online at send time
//       const studentSet = onlineStudentsById.get(sid);
//       const deliveredToStudent = !!studentSet && studentSet.size > 0;

//       // Save to DB
//       const saved = await Message.create({
//         from: "admin",
//         to: sid,
//         message,
//         deliveredToStudent,
//         deliveredAtStudent: deliveredToStudent ? new Date() : null,
//         deliveredToAdmin: false,
//         deliveredAtAdmin: null,
//       });

//       const payload = {
//         _id: saved._id,
//         from: saved.from,
//         to: saved.to,
//         message: saved.message,
//         createdAt: saved.createdAt,
//         deliveredToAdmin: saved.deliveredToAdmin,
//         seenByAdmin: saved.seenByAdmin,
//         deliveredToStudent: saved.deliveredToStudent,
//         seenByStudent: saved.seenByStudent,
//         deliveredAtAdmin: saved.deliveredAtAdmin,
//         seenAtAdmin: saved.seenAtAdmin,
//         deliveredAtStudent: saved.deliveredAtStudent,
//         seenAtStudent: saved.seenAtStudent,
//       };

//       io.to(studentRoom).emit("receive-message", payload);
//       io.to("admin-room").emit("admin-message-sent", payload);
//       // Also update admin UI conversation immediately
//       io.to("admin-room").emit("receive-message", payload);

//       io.to(studentRoom).emit("student-alert", {
//         type: "new-message",
//         from: "admin",
//         message,
//       });
//     } catch (e) {
//       // best-effort: don't crash socket server
//     }
//   });

//   // Student -> Admin
//   socket.on("student-send-message", async ({ studentId, message }) => {
//     if (!studentId || !message) return;

//     try {
//       const sid = String(studentId);
//       const studentRoom = `student:${sid}`;

//       const adminRoom = io.sockets.adapter.rooms.get("admin-room");
//       const deliveredToAdmin = !!adminRoom && adminRoom.size > 0;

//       const saved = await Message.create({
//         from: sid,
//         to: "admin",
//         message,
//         deliveredToAdmin,
//         deliveredToStudent: false,
//         deliveredAtAdmin: deliveredToAdmin ? new Date() : null,
//         deliveredAtStudent: null,
//       });

//       const payload = {
//         _id: saved._id,
//         from: saved.from,
//         to: saved.to,
//         message: saved.message,
//         createdAt: saved.createdAt,
//         deliveredToAdmin: saved.deliveredToAdmin,
//         seenByAdmin: saved.seenByAdmin,
//         deliveredToStudent: saved.deliveredToStudent,
//         seenByStudent: saved.seenByStudent,
//         deliveredAtAdmin: saved.deliveredAtAdmin,
//         seenAtAdmin: saved.seenAtAdmin,
//         deliveredAtStudent: saved.deliveredAtStudent,
//         seenAtStudent: saved.seenAtStudent,
//       };

//       io.to("admin-room").emit("receive-message", payload);
//       io.to("admin-room").emit("admin-alert", {
//         type: "new-message",
//         from: sid,
//         message,
//       });

//       io.to(studentRoom).emit("student-message-sent", payload);
//     } catch (e) {
//       // best-effort: don't crash socket server
//     }
//   });

//   // Student marks admin->student messages as seen
//   socket.on("student-mark-seen", async ({ studentId, messageIds }) => {
//     const sid = String(studentId || "");
//     if (!sid) return;
//     if (!Array.isArray(messageIds) || messageIds.length === 0) return;

//     const ids = messageIds.filter(Boolean);
//     if (ids.length === 0) return;

//     try {
//       await Message.updateMany(
//         { _id: { $in: ids }, from: "admin", to: sid },
//         {
//           $set: {
//             seenByStudent: true,
//             seenAtStudent: new Date(),
//           },
//         }
//       );

//       const updated = await Message.find({ _id: { $in: ids } })
//         .sort({ createdAt: 1 })
//         .lean();

//       io.to("admin-room").emit("message-seen-updated", {
//         messages: updated,
//       });
//     } catch (e) {
//       // best-effort
//     }
//   });

//   // Admin marks student->admin messages as seen
//   socket.on("admin-mark-seen", async ({ studentId, messageIds }) => {
//     const sid = String(studentId || "");
//     if (!sid) return;
//     if (!Array.isArray(messageIds) || messageIds.length === 0) return;

//     const ids = messageIds.filter(Boolean);
//     if (ids.length === 0) return;

//     try {
//       await Message.updateMany(
//         { _id: { $in: ids }, from: sid, to: "admin" },
//         {
//           $set: {
//             seenByAdmin: true,
//             seenAtAdmin: new Date(),
//           },
//         }
//       );

//       const updated = await Message.find({ _id: { $in: ids } })
//         .sort({ createdAt: 1 })
//         .lean();

//       io.to(`student:${sid}`).emit("message-seen-updated", {
//         messages: updated,
//       });
//     } catch (e) {
//       // best-effort
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("Socket disconnected:", socket.id);
//     const studentId = socket.data.studentId;
//     if (studentId) {
//       const set = onlineStudentsById.get(studentId);
//       if (set) {
//         set.delete(socket.id);
//         if (set.size === 0) {
//           onlineStudentsById.delete(studentId);
//           io.to("admin-room").emit("student-offline", { studentId });
//         } else {
//           onlineStudentsById.set(studentId, set);
//         }
//       }
//     }
//   });
// });

// // Start server (HTTP + Socket.IO)
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });

// server.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Models
const Message = require("./src/admin/models/message.model");
const User = require("./src/admin/models/user.model"); // Example user model

// App setup
const app = express();
const PORT = process.env.PORT || 8082;

// ✅ CONNECT TO DB
require("./src/admin/config/db.config").connect();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Allowed origins (Frontend URLs)
const allowedOrigins = [
  "https://saftey-frontend.vercel.app",
  "https://saftey-frontend-git-main.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    console.log("Origin:", origin); // 👈 DEBUG
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== LOGIN ROUTE (JWT Example) ==========
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Authenticate user
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found" });

    const isMatch = user.password === password; // Simple example, ideally hash compare
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Set cookie for cross-origin
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,       // HTTPS required on production
      sameSite: "None"    // ✅ allows Vercel <-> Render cross-origin
    });

    res.json({ success: true, token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================== API Routes ==================
const apiRoutes = require("./src/admin/routes/index");
app.use("/api", apiRoutes);

app.get("/", (req, res) => res.send("✅ Server running"));

// ================= SOCKET.IO ===================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Track online students
const onlineStudentsById = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Admin joins
  socket.on("join-admin", () => {
    socket.join("admin-room");
    const onlineIds = Array.from(onlineStudentsById.keys());
    socket.emit("online-students", { studentIds: onlineIds });
  });

  // Student joins
  socket.on("join-student", ({ studentId }) => {
    if (!studentId) return;
    const room = `student:${studentId}`;
    socket.join(room);
    socket.data.studentId = String(studentId);

    const sid = String(studentId);
    const set = onlineStudentsById.get(sid) || new Set();
    const beforeSize = set.size;
    set.add(socket.id);
    onlineStudentsById.set(sid, set);

    if (beforeSize === 0) {
      io.to("admin-room").emit("student-online", { studentId: sid });
    }
  });

  // Admin -> Student message
  socket.on("admin-send-message", async ({ studentId, message }) => {
    if (!studentId || !message) return;

    try {
      const sid = String(studentId);
      const studentRoom = `student:${sid}`;
      const studentSet = onlineStudentsById.get(sid);
      const deliveredToStudent = !!studentSet && studentSet.size > 0;

      const saved = await Message.create({
        from: "admin",
        to: sid,
        message,
        deliveredToStudent,
        deliveredAtStudent: deliveredToStudent ? new Date() : null,
        deliveredToAdmin: false,
        deliveredAtAdmin: null
      });

      const payload = { ...saved.toObject() };

      io.to(studentRoom).emit("receive-message", payload);
      io.to("admin-room").emit("admin-message-sent", payload);
      io.to("admin-room").emit("receive-message", payload);

      io.to(studentRoom).emit("student-alert", {
        type: "new-message",
        from: "admin",
        message
      });
    } catch {}
  });

  // Student -> Admin message
  socket.on("student-send-message", async ({ studentId, message }) => {
    if (!studentId || !message) return;

    try {
      const sid = String(studentId);
      const studentRoom = `student:${sid}`;
      const adminRoom = io.sockets.adapter.rooms.get("admin-room");
      const deliveredToAdmin = !!adminRoom && adminRoom.size > 0;

      const saved = await Message.create({
        from: sid,
        to: "admin",
        message,
        deliveredToAdmin,
        deliveredToStudent: false,
        deliveredAtAdmin: deliveredToAdmin ? new Date() : null,
        deliveredAtStudent: null
      });

      const payload = { ...saved.toObject() };
      io.to("admin-room").emit("receive-message", payload);
      io.to("admin-room").emit("admin-alert", { type: "new-message", from: sid, message });
      io.to(studentRoom).emit("student-message-sent", payload);
    } catch {}
  });

  // Mark messages as seen
  socket.on("student-mark-seen", async ({ studentId, messageIds }) => {
    if (!studentId || !Array.isArray(messageIds) || messageIds.length === 0) return;
    await Message.updateMany(
      { _id: { $in: messageIds }, from: "admin", to: studentId },
      { $set: { seenByStudent: true, seenAtStudent: new Date() } }
    );
    const updated = await Message.find({ _id: { $in: messageIds } }).sort({ createdAt: 1 }).lean();
    io.to("admin-room").emit("message-seen-updated", { messages: updated });
  });

  socket.on("admin-mark-seen", async ({ studentId, messageIds }) => {
    if (!studentId || !Array.isArray(messageIds) || messageIds.length === 0) return;
    await Message.updateMany(
      { _id: { $in: messageIds }, from: studentId, to: "admin" },
      { $set: { seenByAdmin: true, seenAtAdmin: new Date() } }
    );
    const updated = await Message.find({ _id: { $in: messageIds } }).sort({ createdAt: 1 }).lean();
    io.to(`student:${studentId}`).emit("message-seen-updated", { messages: updated });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const studentId = socket.data.studentId;
    if (studentId) {
      const set = onlineStudentsById.get(studentId);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          onlineStudentsById.delete(studentId);
          io.to("admin-room").emit("student-offline", { studentId });
        } else {
          onlineStudentsById.set(studentId, set);
        }
      }
    }
  });
});

// ================= START SERVER =================
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});