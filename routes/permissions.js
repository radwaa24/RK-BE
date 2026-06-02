import express from "express";
import { protect, requirePermission } from "../middleware/auth.js";
import { PERMISSION_GROUPS, PRESETS, ROLES } from "../config/permissions.js";

const router = express.Router();

// @route   GET /api/permissions
// @desc    Return the permission catalog, presets and roles for the staff editor
// @access  staff.view
router.get("/", protect, requirePermission("staff.view"), (req, res) => {
  res.json({
    success: true,
    data: { groups: PERMISSION_GROUPS, presets: PRESETS, roles: ROLES },
  });
});

export default router;
