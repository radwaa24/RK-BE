import Project from "../models/Project.js";
import { hashApiKey } from "../utils/apiKey.js";

// Authenticates a client app by its API key (header `X-API-Key`) and attaches
// the matching project as req.project. Used by the Platform ingestion API.
export const apiKeyAuth = async (req, res, next) => {
  try {
    const key = req.headers["x-api-key"];
    if (!key) {
      return res.status(401).json({ success: false, message: "Missing X-API-Key" });
    }
    const project = await Project.findOne({ apiKeyHash: hashApiKey(key) }).select(
      "+apiKeyHash"
    );
    if (!project) {
      return res.status(401).json({ success: false, message: "Invalid API key" });
    }
    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
