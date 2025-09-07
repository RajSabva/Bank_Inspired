// server.js (production-ready, ES modules)
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";

dotenv.config();

const app = express();
const __dirname = path.resolve();

const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ---------- CORS configuration (env-driven) ----------
/**
 * Set CORS_ORIGINS in Render as comma-separated values, e.g.:
 * https://bank-inspired-2.onrender.com,https://your-other-frontend.com
 * If not set, defaults to localhost dev URLs.
 */
const defaultOrigins = ["http://localhost:3000", "http://localhost:5173"];
const corsOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. curl, mobile apps)
      if (!origin) return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS policy: origin not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Ensure preflight requests are handled for all routes
app.options("*", cors());

// ---------- Security & performance middleware ----------
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));

// ---------- Health route ----------
app.get("/health", (req, res) => res.status(200).json({ status: "ok", env: NODE_ENV }));

// ---------- Route imports (after middleware) ----------
import userRoutes from "./routes/userRoutes.js";
import depositRoutes from "./routes/deposit.js";
import withdrawRoutes from "./routes/withdraw.js";
import transferRoutes from "./routes/transfer.js";
import historyRoutes from "./routes/history.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import adminEmployeeRoutes from "./routes/adminEmployee.js";
import employeeRoutes from "./routes/employeeRoutes.js";

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/users", depositRoutes);
app.use("/api/users", withdrawRoutes);
app.use("/api/users", transferRoutes);
app.use("/api/users", historyRoutes);
app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin", adminEmployeeRoutes);
app.use("/api/employee", employeeRoutes);

// ---------- Production static serving (optional) ----------
if (NODE_ENV === "production") {
  const clientBuild = path.join(__dirname, "client", "dist"); // Vite outputs to dist
  app.use(express.static(clientBuild));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

// ---------- 404 & error handlers ----------
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err?.stack ?? err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// ---------- DB connect + server bootstrap ----------
async function start() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not defined. Aborting.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Seed admin (non-blocking but awaited)
    try {
      const { default: Admin } = await import("./models/admin.js");
      const adminPhone = process.env.ADMIN_PHONE || "8888888888";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin@123";
      const existingAdmin = await Admin.findOne({ phone: adminPhone });
      if (!existingAdmin) {
        const admin = new Admin({ phone: adminPhone, password: adminPassword });
        await admin.save();
        console.log("👑 Predefined Admin created successfully");
      } else {
        console.log("ℹ️ Predefined Admin already exists");
      }
    } catch (seedErr) {
      console.warn("⚠️ Admin seed error (continuing):", seedErr?.message || seedErr);
    }

    const server = app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT} (${NODE_ENV})`)
    );

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n⚙️  Shutdown signal received: ${signal}. Closing server...`);
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log("🔌 MongoDB connection closed. Exiting.");
          process.exit(0);
        });
      });

      setTimeout(() => {
        console.error("Forcing shutdown.");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("❌ Failed to start app:", err);
    process.exit(1);
  }
}

start();

// process-level safety
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
