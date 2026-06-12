import mongoose from "mongoose";

// A subscription plan you offer to client projects.
const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // per interval, in `currency`
    currency: { type: String, default: "EGP" },
    interval: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    // Commission you take on the client's reported sales (0–1, e.g. 0.05 = 5%).
    commissionRate: { type: Number, default: 0, min: 0, max: 1 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
