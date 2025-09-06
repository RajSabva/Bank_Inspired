import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 📌 Deposit Money
 * Path: /api/users/deposit
 * Only role: user
 */
router.post("/deposit", protect, authorizeRoles("user"), async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Deposit amount must be greater than 0" });
    }

    // Find the logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add money to balance
    user.balance += amount;
    await user.save();

    // ✅ Record transaction
    await Transaction.create({
      user: user._id,
      type: "deposit",
      amount,
      status: "success",
    });

    res.status(200).json({
      message: "Deposit successful",
      balance: user.balance,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
