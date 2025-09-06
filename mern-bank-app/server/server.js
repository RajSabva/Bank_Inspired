import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Load env variables
dotenv.config();

const app = express();

// ✅ CORS setup (allow React on 3000 & 5173)
app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://localhost:5173"   // Vite default port
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ✅ Middleware
app.use(express.json());

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
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB connected");

    // 🔹 Auto-create predefined admin if not exists
    const { default: Admin } = await import("./models/admin.js");

    const adminPhone = "8888888888";
    const adminPassword = "admin@123";

    const existingAdmin = await Admin.findOne({ phone: adminPhone });
    if (!existingAdmin) {
      const admin = new Admin({ phone: adminPhone, password: adminPassword });
      await admin.save();
      console.log("👑 Predefined Admin created successfully");
    } else {
      console.log("ℹ️ Predefined Admin already exists");
    }
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
