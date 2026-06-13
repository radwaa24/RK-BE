import express from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Plan from "../models/Plan.js";
import Transaction from "../models/Transaction.js";
import Invoice from "../models/Invoice.js";
import { protect, requireSuperAdmin } from "../middleware/auth.js";
import { apiKeyAuth } from "../middleware/apiKeyAuth.js";
import { generateApiKey } from "../utils/apiKey.js";

const router = express.Router();

/* ─────────────────────────── Platform API (client apps) ───────────────────────────
   Authenticated by API key. Client apps report sales here so the Hub can accrue
   commission, and can check their subscription status (kill-switch). */

// @route POST /api/platform/transactions   (X-API-Key)
router.post("/transactions", apiKeyAuth, async (req, res) => {
  try {
    const project = req.project;
    if (project.status === "suspended") {
      return res.status(403).json({ success: false, message: "Project suspended" });
    }
    const { amount, type, externalId, currency, occurredAt } = req.body;
    if (amount == null || isNaN(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ success: false, message: "Valid amount required" });
    }
    const rate = project.commissionRate || 0;
    const amt = Number(amount);
    try {
      const tx = await Transaction.create({
        project: project._id,
        externalId: externalId || undefined,
        amount: amt,
        currency: currency || "EGP",
        type: type || "order",
        commissionRate: rate,
        commissionAmount: +(amt * rate).toFixed(2),
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      });
      res.status(201).json({ success: true, data: tx });
    } catch (e) {
      // Duplicate externalId for this project -> idempotent success.
      if (e.code === 11000) {
        return res.json({ success: true, message: "Already recorded (idempotent)" });
      }
      throw e;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route GET /api/platform/status   (X-API-Key) — client apps gate themselves on this
router.get("/status", apiKeyAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      status: req.project.status,
      active: ["trial", "active"].includes(req.project.status),
      name: req.project.name,
    },
  });
});

/* ─────────────────────────── Hub admin API (you) ───────────────────────────
   Everything below requires the platform super_admin. */
router.use(protect, requireSuperAdmin);

/* ---- Plans ---- */
router.get("/plans", async (req, res) => {
  const plans = await Plan.find().sort("price");
  res.json({ success: true, count: plans.length, data: plans });
});

router.post(
  "/plans",
  [body("name").trim().notEmpty(), body("price").isFloat({ min: 0 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    try {
      const plan = await Plan.create(req.body);
      res.status(201).json({ success: true, data: plan });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
);

router.put("/plans/:id", async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.json({ success: true, data: plan });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/plans/:id", async (req, res) => {
  await Plan.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Plan deleted" });
});

/* ---- Projects (clients) ---- */
router.get("/projects", async (req, res) => {
  const projects = await Project.find().populate("plan", "name price interval").sort("-createdAt");
  res.json({ success: true, count: projects.length, data: projects });
});

router.post(
  "/projects",
  [body("name").trim().notEmpty().withMessage("Name is required")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    try {
      const { key, hash, last4 } = generateApiKey();
      // If a plan is chosen and no explicit commissionRate, inherit the plan's.
      let commissionRate = req.body.commissionRate;
      if (commissionRate == null && req.body.plan) {
        const plan = await Plan.findById(req.body.plan);
        commissionRate = plan?.commissionRate ?? 0;
      }
      const project = await Project.create({
        ...req.body,
        commissionRate: commissionRate ?? 0,
        apiKeyHash: hash,
        apiKeyLast4: last4,
      });
      const data = project.toObject();
      delete data.apiKeyHash;
      // Return the plaintext API key ONCE.
      res.status(201).json({ success: true, data, apiKey: key });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
);

router.get("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("plan");
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // Aggregate this project's revenue + commission.
    const [agg] = await Transaction.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: null,
          sales: { $sum: "$amount" },
          commission: { $sum: "$commissionAmount" },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json({
      success: true,
      data: project,
      totals: agg || { sales: 0, commission: 0, count: 0 },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put("/projects/:id", async (req, res) => {
  try {
    // Don't let these be overwritten via a normal update.
    const { apiKeyHash, apiKeyLast4, ...update } = req.body;
    const project = await Project.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate("plan", "name price interval");
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    res.json({ success: true, data: project });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post("/projects/:id/regenerate-key", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    const { key, hash, last4 } = generateApiKey();
    project.apiKeyHash = hash;
    project.apiKeyLast4 = last4;
    await project.save();
    res.json({ success: true, apiKey: key, last4 });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/projects/:id", async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  await Transaction.deleteMany({ project: req.params.id });
  res.json({ success: true, message: "Project deleted" });
});

/* ---- Transactions list (Sales feed) ---- */
router.get("/transactions", async (req, res) => {
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.from || req.query.to) {
    filter.occurredAt = {};
    if (req.query.from) filter.occurredAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.occurredAt.$lte = new Date(req.query.to);
  }
  const limit = Math.min(parseInt(req.query.limit) || 200, 500);
  const txns = await Transaction.find(filter)
    .populate("project", "name")
    .sort("-occurredAt")
    .limit(limit);
  res.json({ success: true, count: txns.length, data: txns });
});

/* ---- Billing / Invoices ----
   An invoice for a client = subscription fee + commission on the sales they
   reported during the period. */

// Generate an invoice for a project over a period.
router.post(
  "/invoices/generate",
  [
    body("project").notEmpty().withMessage("project is required"),
    body("periodStart").notEmpty().withMessage("periodStart is required"),
    body("periodEnd").notEmpty().withMessage("periodEnd is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });
    try {
      const project = await Project.findById(req.body.project).populate("plan");
      if (!project)
        return res.status(404).json({ success: false, message: "Project not found" });

      const periodStart = new Date(req.body.periodStart);
      const periodEnd = new Date(req.body.periodEnd);

      const [agg] = await Transaction.aggregate([
        {
          $match: {
            project: new mongoose.Types.ObjectId(req.body.project),
            occurredAt: { $gte: periodStart, $lte: periodEnd },
          },
        },
        {
          $group: {
            _id: null,
            salesTotal: { $sum: "$amount" },
            commissionTotal: { $sum: "$commissionAmount" },
          },
        },
      ]);

      const subscriptionFee = project.plan?.price || 0;
      const commissionTotal = +(agg?.commissionTotal || 0).toFixed(2);
      const salesTotal = +(agg?.salesTotal || 0).toFixed(2);
      const total = +(subscriptionFee + commissionTotal).toFixed(2);

      const invoice = await Invoice.create({
        project: project._id,
        periodStart,
        periodEnd,
        subscriptionFee,
        salesTotal,
        commissionTotal,
        total,
        currency: project.plan?.currency || "EGP",
        status: "draft",
      });
      res.status(201).json({ success: true, data: invoice });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }
);

router.get("/invoices", async (req, res) => {
  const filter = {};
  if (req.query.project) filter.project = req.query.project;
  if (req.query.status) filter.status = req.query.status;
  const invoices = await Invoice.find(filter)
    .populate("project", "name")
    .sort("-issuedAt");
  res.json({ success: true, count: invoices.length, data: invoices });
});

router.get("/invoices/:id", async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("project", "name contactEmail");
  if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
  res.json({ success: true, data: invoice });
});

// Update status (sent / paid / void). Marking paid stamps paidAt.
router.put("/invoices/:id", async (req, res) => {
  try {
    const update = {};
    if (req.body.status) {
      if (!["draft", "sent", "paid", "void"].includes(req.body.status))
        return res.status(400).json({ success: false, message: "Invalid status" });
      update.status = req.body.status;
      update.paidAt = req.body.status === "paid" ? new Date() : undefined;
    }
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).populate("project", "name");
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    res.json({ success: true, data: invoice });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete("/invoices/:id", async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Invoice deleted" });
});

/* ---- Platform dashboard stats ---- */
router.get("/stats", async (req, res) => {
  try {
    const [projects, plans] = await Promise.all([
      Project.find().populate("plan", "price interval"),
      Plan.find(),
    ]);

    const activeProjects = projects.filter((p) =>
      ["trial", "active"].includes(p.status)
    );

    // MRR from active projects' plan prices (yearly normalised to monthly).
    const mrr = activeProjects.reduce((sum, p) => {
      if (!p.plan) return sum;
      const monthly =
        p.plan.interval === "yearly" ? p.plan.price / 12 : p.plan.price;
      return sum + (monthly || 0);
    }, 0);

    const [commissionAgg] = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          commission: { $sum: "$commissionAmount" },
          sales: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        activeProjects: activeProjects.length,
        suspended: projects.filter((p) => p.status === "suspended").length,
        plans: plans.length,
        mrr: +mrr.toFixed(2),
        totalCommission: +(commissionAgg?.commission || 0).toFixed(2),
        totalSales: +(commissionAgg?.sales || 0).toFixed(2),
        transactions: commissionAgg?.count || 0,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
