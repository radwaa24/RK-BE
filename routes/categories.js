import express from "express";
import { body, validationResult } from "express-validator";
import Category from "../models/Category.js";
// import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort("name");
    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let category = null;

    // Try to parse as number first (categoryId)
    const categoryId = parseInt(id);
    if (!isNaN(categoryId)) {
      category = await Category.findOne({ categoryId: categoryId });
    }

    // If not found by categoryId, try MongoDB _id (for backward compatibility)
    if (!category) {
      // Check if it's a valid MongoDB ObjectId format
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        category = await Category.findById(id);
      } else {
        // If it's not a valid ObjectId but also not found by categoryId, try _id anyway
        try {
          category = await Category.findById(id);
        } catch (err) {
          // Invalid ObjectId format, ignore
        }
      }
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private/Admin
router.post(
  "/",
  [body("name").trim().notEmpty().withMessage("Category name is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const category = await Category.create(req.body);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let category = null;

    // Try to parse as number first (categoryId)
    const categoryId = parseInt(id);
    if (!isNaN(categoryId)) {
      category = await Category.findOneAndUpdate(
        { categoryId: categoryId },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
    }

    // If not found by categoryId, try MongoDB _id (for backward compatibility)
    if (!category) {
      // Check if it's a valid MongoDB ObjectId format
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        category = await Category.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
      } else {
        // If it's not a valid ObjectId but also not found by categoryId, try _id anyway
        try {
          category = await Category.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
          });
        } catch (err) {
          // Invalid ObjectId format, ignore
        }
      }
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let category = null;

    // Try to parse as number first (categoryId)
    const categoryId = parseInt(id);
    if (!isNaN(categoryId)) {
      category = await Category.findOne({ categoryId: categoryId });
    }

    // If not found by categoryId, try MongoDB _id (for backward compatibility)
    if (!category) {
      // Check if it's a valid MongoDB ObjectId format
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        category = await Category.findById(id);
      } else {
        // If it's not a valid ObjectId but also not found by categoryId, try _id anyway
        try {
          category = await Category.findById(id);
        } catch (err) {
          // Invalid ObjectId format, ignore
        }
      }
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Actually delete the category from database
    await Category.deleteOne({ _id: category._id });

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
