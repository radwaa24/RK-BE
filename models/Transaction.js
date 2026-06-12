import mongoose from "mongoose";

// A sale/booking reported by a client app, used to accrue your commission.
const transactionSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    // The client app's own id for this sale (prevents double-counting).
    externalId: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "EGP" },
    type: { type: String, enum: ["order", "booking", "other"], default: "order" },
    // Commission snapshot at the time of reporting.
    commissionRate: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One external id per project = idempotent ingestion.
transactionSchema.index(
  { project: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $type: "string" } } }
);
transactionSchema.index({ project: 1, occurredAt: -1 });

export default mongoose.model("Transaction", transactionSchema);
