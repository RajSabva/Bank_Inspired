import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["deposit", "withdraw", "transfer"],
      required: true,
    },
    amount: { type: Number, required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // for transfer
    status: { type: String, enum: ["success", "failed"], default: "success" },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
