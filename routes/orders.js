import express from "express";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import { protect, requirePermission } from "../middleware/auth.js";
import { isStaff } from "../config/permissions.js";

const router = express.Router();

// @route   GET /api/orders
// @desc    Get all orders (user's orders or all orders for admin)
// @access  Private
router.get("/", protect, requirePermission("orders.view"), async (req, res) => {
  try {
    // Staff with orders.view see all orders; anyone else only their own.
    const filter = isStaff(req.user) ? {} : { user: req.user._id };

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
router.get("/:id", protect, requirePermission("orders.view"), async (req, res) => {
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

    // Staff can see any order; a customer can only see their own.
    if (
      !isStaff(req.user) &&
      order.user._id.toString() !== req.user._id.toString()
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
  protect,
  requirePermission("orders.create"),
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
        user: bodyUser,
        paymentStatus,
      } = req.body;

      // Staff may place an order on behalf of a customer by passing `user`.
      // Everyone else can only create orders for themselves.
      const orderUser =
        isStaff(req.user) && bodyUser ? bodyUser : req.user._id;

      // Run stock validation, stock decrement, order creation and cart clearing
      // inside ONE transaction so we never decrement stock for an order that
      // fails to save (no more "ghost" stock reductions).
      const session = await mongoose.startSession();
      let orderId;
      try {
        await session.withTransaction(async () => {
          const orderItems = [];
          for (const item of items) {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
              const e = new Error(`Product ${item.product} not found`);
              e.statusCode = 404;
              throw e;
            }
            if (product.stock < item.quantity) {
              const e = new Error(`Insufficient stock for ${product.name}`);
              e.statusCode = 400;
              throw e;
            }

            orderItems.push({
              product: product._id,
              name: product.name,
              quantity: item.quantity,
              price: product.price,
              total: product.price * item.quantity,
            });

            product.stock -= item.quantity;
            await product.save({ session });
          }

          const created = await Order.create(
            [
              {
                user: orderUser,
                items: orderItems,
                shippingAddress,
                paymentMethod,
                // Only staff may set payment status directly (e.g. mark paid).
                ...(isStaff(req.user) && paymentStatus ? { paymentStatus } : {}),
                tax: tax || 0,
                shipping: shipping || 0,
                discount: discount || 0,
                notes,
              },
            ],
            { session }
          );

          orderId = created[0]._id;
          await Cart.findOneAndDelete({ user: orderUser }, { session });
        });
      } finally {
        await session.endSession();
      }

      const populatedOrder = await Order.findById(orderId)
        .populate("items.product", "name images")
        .populate("user", "name email");

      res.status(201).json({
        success: true,
        data: populatedOrder,
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
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
  protect,
  requirePermission("orders.edit"),
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
router.delete("/:id", protect, requirePermission("orders.delete"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Restore stock for any order that wasn't already cancelled, then delete it.
    if (order.status !== "cancelled") {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }
    await order.deleteOne();

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
