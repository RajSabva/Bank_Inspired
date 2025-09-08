// index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Load env variables
dotenv.config();

const app = express();

// ✅ Basic logging for Render diagnostics
console.log("🔧 Starting server bootstrap...");

// ✅ CORS setup (allow React on 3000 & Vite on 5173 during dev)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// ✅ Middleware
app.use(express.json());

// ✅ Simple healthcheck for platform port scan & uptime checks
app.get("/healthz", (req, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));

// Routes
import userRoutes from "./routes/userRoutes.js";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import transferRoutes from "./routes/transfer.js";
import historyRoutes from "./routes/history.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import adminEmployeeRoutes from "./routes/adminEmployee.js";
import employeeRoutes from "./routes/employeeRoutes.js";

app.use("/api/users", userRoutes);
app.use("/api/users", depositRoutes);
app.use("/api/users", withdrawRoutes);
app.use("/api/users", transferRoutes);
app.use("/api/users", historyRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminEmployeeRoutes);
app.use("/api/employee", employeeRoutes);

// MongoDB connection
const startMongo = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is not set. Aborting startup.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Auto-create predefined admin if not exists
    const { default: Admin } = await import("./models/admin.js");
    const adminPhone = process.env.PREDEF_ADMIN_PHONE || "8888888888";
    const adminPassword = process.env.PREDEF_ADMIN_PASSWORD || "admin@123";

    const existingAdmin = await Admin.findOne({ phone: adminPhone });
    if (!existingAdmin) {
      const admin = new Admin({ phone: adminPhone, password: adminPassword });
      await admin.save();
      console.log("👑 Predefined Admin created successfully");
    } else {
      console.log("ℹ️ Predefined Admin already exists");
    }
  } catch (err) {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  }
};

// Start server and connect to DB
const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0"; // required in many platforms/containers

const server = app.listen(PORT, HOST, async () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT} (pid: ${process.pid})`);
  await startMongo();
});

// Graceful shutdown (helpful for health/rolling deploys)
const shutdown = (signal) => {
  console.log(`📪 Received ${signal}. Closing server...`);
  server.close(async (err) => {
    if (err) {
      console.error("❌ Server close error:", err);
      process.exit(1);
    }
    try {
      await mongoose.disconnect();
      console.log("🧹 MongoDB connection closed. Exiting.");
      process.exit(0);
    } catch (e) {
      console.error("❌ Error during shutdown:", e);
      process.exit(1);
    }
  });

  // fallback in case close hangs
  setTimeout(() => {
    console.error("⏱️ Force exit after 10s");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught exception:", err);
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled rejection:", reason);
  // allow normal shutdown path
  shutdown("unhandledRejection");
});
