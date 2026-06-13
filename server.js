import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectDB } from "./config/db.js";

// Import Routes — RK is the Hub: only platform (Hub) + auth.
import authRoutes from "./routes/auth.js";
import platformRoutes from "./routes/platform.js";

// Load environment variables
dotenv.config();

const app = express();
app.set("etag", false);

// Middleware
// FRONTEND_URL may be a single origin or a comma-separated list, so the same
// API can serve local dev and one or more deployed frontends.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
// Any localhost / 127.0.0.1 port is allowed (local dev shouldn't break when the
// frontend picks a different port like 3001).
const isLocalhost = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (no Origin), any listed origin, and localhost.
      if (!origin || allowedOrigins.includes(origin) || isLocalhost(origin)) {
        return callback(null, true);
      }
      // Reject cleanly (no CORS header) instead of throwing a 500.
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "RK Hub API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/platform", platformRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start a normal HTTP server only when NOT running on Vercel (serverless).
// On Vercel, api/[...path].js imports this `app` and connects the DB per request.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      console.log("MongoDB Connected");
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      });
    })
    .catch((error) => {
      console.error(`MongoDB Connection Error: ${error.message}`);
      process.exit(1);
    });
}

export default app;
