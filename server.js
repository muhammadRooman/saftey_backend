const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./src/admin/models/message.model");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8082;

// ✅ CONNECT TO DB
require("./src/admin/config/db.config").connect();

// Create HTTP server wrapper (for Socket.IO)
const server = http.createServer(app);

// Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: "*", // TODO: lock to specific frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );
const allowedOrigins = [
  "http://localhost:3000",           // local frontend
  "https://your-frontend.vercel.app" // deployed frontend
];

app.use(cors({
  origin: function(origin, callback){
    // allow requests with no origin (like Postman)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const apiRoutes = require("./src/admin/routes/index");
app.use("/api", apiRoutes);
app.use("/uploads", express.static("uploads"));
app.get("/", (req, res) => res.send("✅ Server running on Railway"));
// Track online students per studentId (safe for multiple tabs)
// studentId -> Set(socketIds)
const onlineStudentsById = new Map();

// ========== SOCKET.IO REALTIME CHAT ==========
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Admin joins a common admin room
  socket.on("join-admin", () => {
    socket.join("admin-room");
    console.log("Admin joined admin-room");
    // Send current online student ids immediately
    try {
      const onlineIds = Array.from(onlineStudentsById.keys());
      socket.emit("online-students", { studentIds: onlineIds });
    } catch (e) {
      // best-effort
    }
  });

  // Student joins their personal room
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

    // notify admins only on first socket for that student
    if (beforeSize === 0) {
      io.to("admin-room").emit("student-online", { studentId: sid });
    }
    console.log(`Student joined room ${room}`);
  });

  // Admin -> Student
  socket.on("admin-send-message", async ({ studentId, message }) => {
    if (!studentId || !message) return;

    try {
      const sid = String(studentId);
      const studentRoom = `student:${sid}`;

      // delivered if student is online at send time
      const studentSet = onlineStudentsById.get(sid);
      const deliveredToStudent = !!studentSet && studentSet.size > 0;

      // Save to DB
      const saved = await Message.create({
        from: "admin",
        to: sid,
        message,
        deliveredToStudent,
        deliveredAtStudent: deliveredToStudent ? new Date() : null,
        deliveredToAdmin: false,
        deliveredAtAdmin: null,
      });

      const payload = {
        _id: saved._id,
        from: saved.from,
        to: saved.to,
        message: saved.message,
        createdAt: saved.createdAt,
        deliveredToAdmin: saved.deliveredToAdmin,
        seenByAdmin: saved.seenByAdmin,
        deliveredToStudent: saved.deliveredToStudent,
        seenByStudent: saved.seenByStudent,
        deliveredAtAdmin: saved.deliveredAtAdmin,
        seenAtAdmin: saved.seenAtAdmin,
        deliveredAtStudent: saved.deliveredAtStudent,
        seenAtStudent: saved.seenAtStudent,
      };

      io.to(studentRoom).emit("receive-message", payload);
      io.to("admin-room").emit("admin-message-sent", payload);
      // Also update admin UI conversation immediately
      io.to("admin-room").emit("receive-message", payload);

      io.to(studentRoom).emit("student-alert", {
        type: "new-message",
        from: "admin",
        message,
      });
    } catch (e) {
      // best-effort: don't crash socket server
    }
  });

  // Student -> Admin
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
        deliveredAtStudent: null,
      });

      const payload = {
        _id: saved._id,
        from: saved.from,
        to: saved.to,
        message: saved.message,
        createdAt: saved.createdAt,
        deliveredToAdmin: saved.deliveredToAdmin,
        seenByAdmin: saved.seenByAdmin,
        deliveredToStudent: saved.deliveredToStudent,
        seenByStudent: saved.seenByStudent,
        deliveredAtAdmin: saved.deliveredAtAdmin,
        seenAtAdmin: saved.seenAtAdmin,
        deliveredAtStudent: saved.deliveredAtStudent,
        seenAtStudent: saved.seenAtStudent,
      };

      io.to("admin-room").emit("receive-message", payload);
      io.to("admin-room").emit("admin-alert", {
        type: "new-message",
        from: sid,
        message,
      });

      io.to(studentRoom).emit("student-message-sent", payload);
    } catch (e) {
      // best-effort: don't crash socket server
    }
  });

  // Student marks admin->student messages as seen
  socket.on("student-mark-seen", async ({ studentId, messageIds }) => {
    const sid = String(studentId || "");
    if (!sid) return;
    if (!Array.isArray(messageIds) || messageIds.length === 0) return;

    const ids = messageIds.filter(Boolean);
    if (ids.length === 0) return;

    try {
      await Message.updateMany(
        { _id: { $in: ids }, from: "admin", to: sid },
        {
          $set: {
            seenByStudent: true,
            seenAtStudent: new Date(),
          },
        }
      );

      const updated = await Message.find({ _id: { $in: ids } })
        .sort({ createdAt: 1 })
        .lean();

      io.to("admin-room").emit("message-seen-updated", {
        messages: updated,
      });
    } catch (e) {
      // best-effort
    }
  });

  // Admin marks student->admin messages as seen
  socket.on("admin-mark-seen", async ({ studentId, messageIds }) => {
    const sid = String(studentId || "");
    if (!sid) return;
    if (!Array.isArray(messageIds) || messageIds.length === 0) return;

    const ids = messageIds.filter(Boolean);
    if (ids.length === 0) return;

    try {
      await Message.updateMany(
        { _id: { $in: ids }, from: sid, to: "admin" },
        {
          $set: {
            seenByAdmin: true,
            seenAtAdmin: new Date(),
          },
        }
      );

      const updated = await Message.find({ _id: { $in: ids } })
        .sort({ createdAt: 1 })
        .lean();

      io.to(`student:${sid}`).emit("message-seen-updated", {
        messages: updated,
      });
    } catch (e) {
      // best-effort
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
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

// Start server (HTTP + Socket.IO)
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
