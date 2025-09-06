import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    aadhaar: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    accountType: {
      type: String,
      enum: ["savings", "current"],
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    role: {
        type: String,
        enum: ["user", "employee", "manager", "admin"], // ✅ added admin
        default: "user",
},
    isVerified: {
      type: Boolean,
      default: true, // ✅ Directly verified since no OTP step
    },
    password: {
      type: String,
      required: true, // must be set during registration
    },
  },
  { timestamps: true }
);

// 🔹 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔹 Method to check password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
