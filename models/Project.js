import mongoose from "mongoose";

// A client project = a custom app you built for a client, registered in the Hub.
const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    vertical: { type: String, trim: true }, // e.g. "decoration", "shop"
    appUrl: { type: String, trim: true }, // where the client app lives
    status: {
      type: String,
      enum: ["trial", "active", "past_due", "suspended"],
      default: "trial",
    },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },
    // Snapshot of the commission rate for this client (can override the plan's).
    commissionRate: { type: Number, default: 0, min: 0, max: 1 },

    // API key the client app uses to talk to the Hub. We store only the hash.
    apiKeyHash: { type: String, select: false },
    apiKeyLast4: { type: String },

    contactName: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },

    trialEndsAt: { type: Date },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
