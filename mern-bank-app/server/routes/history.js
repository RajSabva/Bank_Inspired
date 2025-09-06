import express from "express";
import Transaction from "../models/Transaction.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 📌 Get Transaction History (Passbook)
 * Path: /api/users/history
 * Role: user
 */
router.get("/history", protect, authorizeRoles("user"), async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate("recipient", "name phone") // show recipient details if transfer
      .sort({ createdAt: -1 }); // latest first

    res.json({
      message: "Transaction history fetched successfully",
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
