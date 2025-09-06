import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js"; // ✅ import Transaction model
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 📌 Withdraw Money
 * Path: /api/users/withdraw
 * Only role: user
 */
router.post("/withdraw", protect, authorizeRoles("user"), async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Withdraw amount must be greater than 0" });
    }

    // Find the logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has enough balance
    if (user.balance < amount) {
      // ✅ Record failed transaction
      await Transaction.create({
        user: user._id,
        type: "withdraw",
        amount,
        status: "failed",
      });

      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct money
    user.balance -= amount;
    await user.save();

    // ✅ Record successful transaction
    await Transaction.create({
      user: user._id,
      type: "withdraw",
      amount,
      status: "success",
    });

    res.status(200).json({
      message: "Withdrawal successful",
      balance: user.balance,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
