// server/routes/adminEmployee.js
import express from "express";
import User from "../models/User.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 📌 Create Employee
 * Path: /api/admin/create-employee
 * Role: admin
 */
router.post("/create-employee", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, phone, aadhaar, password } = req.body;

    if (!name || !phone || !aadhaar || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (await User.findOne({ phone })) {
      return res.status(400).json({ message: "Employee with this phone already exists" });
    }
    if (await User.findOne({ aadhaar })) {
      return res.status(400).json({ message: "Employee with this Aadhaar already exists" });
    }

    const employee = new User({
      name,
      phone,
      aadhaar,
      accountType: "current",
      password,
      role: "employee",
      isVerified: true,
    });

    await employee.save();

    res.status(201).json({ message: "Employee created successfully", employee });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * 📌 Get All Employees
 * Path: /api/admin/employees
 * Role: admin
 */
router.get("/employees", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password");
    res.json({ employees });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * 📌 Delete Employee
 * Path: /api/admin/employee/:id
 * Role: admin
 */
router.delete("/employee/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee || employee.role !== "employee") {
      return res.status(404).json({ message: "Employee not found" });
    }

    await employee.remove();

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
