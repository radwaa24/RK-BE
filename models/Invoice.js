import mongoose from "mongoose";

// A monthly (or custom-period) invoice for a client project:
//   total = subscriptionFee + commissionTotal (commission on sales in the period).
const invoiceSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    subscriptionFee: { type: Number, default: 0 },
    salesTotal: { type: Number, default: 0 }, // gross sales the client reported
    commissionTotal: { type: Number, default: 0 }, // your cut of those sales
    total: { type: Number, default: 0 }, // subscriptionFee + commissionTotal
    currency: { type: String, default: "EGP" },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "void"],
      default: "draft",
    },
    issuedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
