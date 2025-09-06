import express from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 📌 Transfer Money
 * Path: /api/users/transfer
 * Only role: user
 */
router.post("/transfer", protect, authorizeRoles("user"), async (req, res) => {
  try {
    const { recipientPhone, amount } = req.body;

    if (!recipientPhone || !amount || amount <= 0) {
      return res.status(400).json({ message: "Recipient phone and valid amount are required" });
    }

    // Find sender & recipient
    const sender = await User.findById(req.user._id);
    const recipient = await User.findOne({ phone: recipientPhone });

    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (sender.phone === recipient.phone) {
      return res.status(400).json({ message: "Cannot transfer to your own account" });
    }

    // Check balance
    if (sender.balance < amount) {
      await Transaction.create({
        user: sender._id,
        type: "transfer",
        amount,
        status: "failed",
        recipient: recipient._id,
      });
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct from sender
    sender.balance -= amount;
    await sender.save();

    // Add to recipient
    recipient.balance += amount;
    await recipient.save();

    // ✅ Record sender transaction
    await Transaction.create({
      user: sender._id,
      type: "transfer",
      amount,
      status: "success",
      recipient: recipient._id,
    });

    // ✅ Record recipient transaction
    await Transaction.create({
      user: recipient._id,
      type: "deposit", // deposit for recipient
      amount,
      status: "success",
    });

    res.status(200).json({
      message: `Transferred ₹${amount} to ${recipient.name}`,
      senderBalance: sender.balance,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
