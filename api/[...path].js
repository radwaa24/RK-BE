// Vercel serverless entry. Every /api/* request is routed here; we ensure the
// (cached) DB connection is up, then hand the request to the Express app.
import app from "../server.js";
import { connectDB } from "../config/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    // TEMP diagnostic: reveal the real cause (revert after debugging).
    const uri = process.env.MONGODB_URI || "";
    return res.end(
      JSON.stringify({
        success: false,
        message: "Database connection failed",
        error: err.message,
        hasMongoUri: !!uri,
        uriHost: uri.split("@")[1]?.split("/")[0] || null,
        hasJwtSecret: !!process.env.JWT_SECRET,
      })
    );
  }
  return app(req, res);
}
