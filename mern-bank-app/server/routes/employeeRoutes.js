// server/routes/employeeRoutes.js
import express from "express";
import User from "../models/User.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 📌 Get All Users
 * Path: /api/employee/users
 * Role: employee, manager, admin
 */
router.get("/users", protect, authorizeRoles("employee", "manager", "admin"), async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json({ message: "All users fetched successfully", users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * 📌 Get Single User by ID
 * Path: /api/employee/user/:id
 * Role: employee, manager, admin
 */
router.get("/user/:id", protect, authorizeRoles("employee", "manager", "admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User details fetched successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
