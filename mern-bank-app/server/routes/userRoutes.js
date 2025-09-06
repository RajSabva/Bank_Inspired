import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * 📌 Generate JWT Token
 */
const generateToken = (id, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

/**
 * 📌 Register User
 * Step 1: Create new user with Aadhaar, Phone, Name, Account Type, Password
 */
router.post("/register", async (req, res) => {
  try {
    const { aadhaar, name, phone, accountType, password } = req.body;

    if (!aadhaar || !name || !phone || !accountType || !password) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Check if Aadhaar already exists
    if (await User.findOne({ aadhaar })) {
      return res.status(400).json({ message: "User with this Aadhaar already exists!" });
    }

    // Check if Phone already exists
    if (await User.findOne({ phone })) {
      return res.status(400).json({ message: "User with this phone number already exists!" });
    }

    // Create new user
    const user = new User({
      aadhaar,
      name,
      phone,
      accountType,
      password, // will be hashed by User.js pre-save hook
      isVerified: true, // auto-verified since no OTP
    });

    await user.save();

    // Generate JWT token immediately after registration
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        accountType: user.accountType,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

/**
 * 📌 Login User
 * Step 2: Authenticate with Phone + Password, return JWT token
 */
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Phone and password are required!" });
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Check password using matchPassword from User.js
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    // Generate JWT Token
    const token = generateToken(user._id, user.role);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        accountType: user.accountType,
        balance: user.balance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
