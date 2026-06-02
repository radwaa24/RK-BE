import express from "express";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { protect, requirePermission } from "../middleware/auth.js";
import { ROLES, sanitizePermissions, isOwner, can } from "../config/permissions.js";

const router = express.Router();

// @route   GET /api/users
// @desc    List users (optionally filter by ?role= and ?search=)
// @access  staff.view
router.get("/", protect, requirePermission("staff.view"), async (req, res) => {
  try {
    const filter = {};
    if (req.query.role && ROLES.includes(req.query.role)) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      const rx = new RegExp(req.query.search, "i");
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const users = await User.find(filter).select("-password").sort("-createdAt");
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get a single user (self, or anyone with staff.view)
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const isSelf = req.params.id === req.user._id.toString();
    if (!isSelf && !can(req.user, "staff.view")) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/users
// @desc    Create a staff (or other) user with a role + permissions
// @access  staff.manage
router.post(
  "/",
  protect,
  requirePermission("staff.manage"),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(ROLES).withMessage("Invalid role"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, password, phone } = req.body;
      const role = req.body.role || "staff";
      const permissions = sanitizePermissions(req.body.permissions || []);

      // Only an owner may create another owner or grant staff.manage.
      if (
        (role === "owner" || permissions.includes("staff.manage")) &&
        !isOwner(req.user)
      ) {
        return res.status(403).json({
          success: false,
          message: "Only an owner can create owners or grant staff management",
        });
      }

      if (await User.findOne({ email: email.toLowerCase() })) {
        return res.status(400).json({ success: false, message: "User already exists" });
      }

      const user = await User.create({
        name,
        email,
        password,
        phone,
        role,
        // Owners don't need a stored permission list (they bypass checks).
        permissions: role === "owner" ? [] : permissions,
      });

      const safe = user.toObject();
      delete safe.password;
      res.status(201).json({ success: true, data: safe });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// @route   PUT /api/users/:id
// @desc    Update a user. Profile fields are self-editable; role/permissions/
//          isActive require staff.manage (and owner for owner-level changes).
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isSelf = req.params.id === req.user._id.toString();
    const manages = can(req.user, "staff.manage");

    if (!isSelf && !manages) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Plain profile fields anyone may set on an account they can edit.
    const { name, phone, address, role, permissions, isActive } = req.body;
    if (name !== undefined) target.name = name;
    if (phone !== undefined) target.phone = phone;
    if (address !== undefined) target.address = address;

    // Privileged fields (role / permissions / isActive).
    const wantsPrivileged =
      role !== undefined || permissions !== undefined || isActive !== undefined;

    if (wantsPrivileged) {
      if (!manages) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to change role, permissions or status",
        });
      }
      // Anti-lockout: you cannot change your OWN role/permissions/status.
      if (isSelf) {
        return res.status(400).json({
          success: false,
          message: "You cannot change your own role, permissions or status",
        });
      }
      // Editing an owner, or promoting to owner / granting staff.manage,
      // is owner-only.
      const grantsOwnerPower =
        role === "owner" ||
        (Array.isArray(permissions) && permissions.includes("staff.manage"));
      if ((target.role === "owner" || grantsOwnerPower) && !isOwner(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only an owner can manage owners or owner-level permissions",
        });
      }

      if (role !== undefined) {
        if (!ROLES.includes(role)) {
          return res.status(400).json({ success: false, message: "Invalid role" });
        }
        target.role = role;
      }
      if (permissions !== undefined) {
        target.permissions =
          target.role === "owner" ? [] : sanitizePermissions(permissions);
      }
      if (isActive !== undefined) target.isActive = !!isActive;
    }

    await target.save();
    const safe = target.toObject();
    delete safe.password;
    res.json({ success: true, data: safe });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user (staff.manage) or deactivate your own account
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isSelf = req.params.id === req.user._id.toString();

    if (isSelf) {
      target.isActive = false;
      await target.save();
      return res.json({ success: true, message: "Account deactivated successfully" });
    }

    if (!can(req.user, "staff.manage")) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Deleting an owner is owner-only, and never the last owner.
    if (target.role === "owner") {
      if (!isOwner(req.user)) {
        return res.status(403).json({
          success: false,
          message: "Only an owner can delete an owner",
        });
      }
      const ownerCount = await User.countDocuments({ role: "owner" });
      if (ownerCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last owner",
        });
      }
    }

    await target.deleteOne();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
