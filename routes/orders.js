import express from "express";
import { body, validationResult } from "express-validator";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
// import {  authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders (user's orders or all orders for admin)
// @access  Private
router.get("/", async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { user: req.user._id };

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("items.product", "name images")
      .sort("-createdAt");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product", "name images price");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user owns the order or is admin
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post(
  "/",
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Order must have at least one item"),
    body("shippingAddress.street")
      .notEmpty()
      .withMessage("Street address is required"),
    body("shippingAddress.city").notEmpty().withMessage("City is required"),
    body("shippingAddress.state").notEmpty().withMessage("State is required"),
    body("shippingAddress.zipCode")
      .notEmpty()
      .withMessage("Zip code is required"),
    body("shippingAddress.country")
      .notEmpty()
      .withMessage("Country is required"),
    body("paymentMethod").notEmpty().withMessage("Payment method is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const {
        items,
        shippingAddress,
        paymentMethod,
        tax,
        shipping,
        discount,
        notes,
      } = req.body;

      // Validate products and calculate totals
      const orderItems = [];
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product ${item.product} not found`,
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
          });
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
          total: product.price * item.quantity,
        });

        // Update product stock
        product.stock -= item.quantity;
        await product.save();
      }

      // Create order
      const order = await Order.create({
        user: req.user._id,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        tax: tax || 0,
        shipping: shipping || 0,
        discount: discount || 0,
        notes,
      });

      // Clear user's cart
      await Cart.findOneAndDelete({ user: req.user._id });

      const populatedOrder = await Order.findById(order._id)
        .populate("items.product", "name images")
        .populate("user", "name email");

      res.status(201).json({
        success: true,
        data: populatedOrder,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private/Admin
router.put(
  "/:id/status",

  [
    body("status")
      .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      order.status = req.body.status;
      if (req.body.status === "delivered") {
        order.deliveredAt = new Date();
        order.paymentStatus = "paid";
      }
      await order.save();

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// @route   DELETE /api/orders/:id
// @desc    Cancel order (user) or delete order (admin)
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Users can only cancel their own orders
    if (
      order.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // If user cancels, restore product stock
    if (req.user.role !== "admin" && order.status !== "cancelled") {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
      order.status = "cancelled";
      await order.save();
    } else if (req.user.role === "admin") {
      // Admin can delete order
      await order.deleteOne();
    }

    res.json({
      success: true,
      message: "Order cancelled/deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
