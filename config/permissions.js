// Single source of truth for the admin permission system.
// Roles:
//   owner    - full access, manages staff & permissions (bypasses every check)
//   staff    - employee; access is exactly the `permissions` assigned to them
//   customer - store buyer; no admin access
//
// Permission keys follow "resource.action".

export const PERMISSION_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    permissions: [{ key: "dashboard.view", label: "View dashboard" }],
  },
  {
    key: "products",
    label: "Products",
    permissions: [
      { key: "products.view", label: "View products" },
      { key: "products.create", label: "Create products" },
      { key: "products.edit", label: "Edit products" },
      { key: "products.delete", label: "Delete products" },
    ],
  },
  {
    key: "categories",
    label: "Categories",
    permissions: [
      { key: "categories.view", label: "View categories" },
      { key: "categories.create", label: "Create categories" },
      { key: "categories.edit", label: "Edit categories" },
      { key: "categories.delete", label: "Delete categories" },
    ],
  },
  {
    key: "orders",
    label: "Orders",
    permissions: [
      { key: "orders.view", label: "View orders" },
      { key: "orders.create", label: "Create orders" },
      { key: "orders.edit", label: "Update order status" },
      { key: "orders.delete", label: "Delete orders" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    permissions: [
      { key: "customers.view", label: "View customers" },
      { key: "customers.manage", label: "Manage customers" },
    ],
  },
  {
    key: "discounts",
    label: "Discounts",
    permissions: [
      { key: "discounts.view", label: "View discounts" },
      { key: "discounts.manage", label: "Manage discounts" },
    ],
  },
  {
    key: "staff",
    label: "Staff & permissions",
    permissions: [
      { key: "staff.view", label: "View staff" },
      { key: "staff.manage", label: "Manage staff & permissions" },
    ],
  },
];

export const ROLES = ["owner", "staff", "customer"];

// Flat list of every valid permission key.
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

const pick = (...prefixes) =>
  ALL_PERMISSIONS.filter((k) => prefixes.some((p) => k.startsWith(p)));

// Quick-assign bundles surfaced in the staff editor UI.
export const PRESETS = [
  {
    key: "manager",
    label: "Manager (everything except staff)",
    permissions: ALL_PERMISSIONS.filter((k) => !k.startsWith("staff.")),
  },
  {
    key: "catalog",
    label: "Catalog editor",
    permissions: ["dashboard.view", ...pick("products.", "categories.")],
  },
  {
    key: "orders",
    label: "Order manager",
    permissions: ["dashboard.view", ...pick("orders."), "customers.view"],
  },
  {
    key: "viewer",
    label: "Read-only viewer",
    permissions: ALL_PERMISSIONS.filter((k) => k.endsWith(".view")),
  },
];

export const isOwner = (user) => user?.role === "owner";
export const isStaff = (user) => user?.role === "owner" || user?.role === "staff";

// The core access check: owner can do anything; staff need the explicit key.
export const can = (user, permission) =>
  isOwner(user) || (Array.isArray(user?.permissions) && user.permissions.includes(permission));

// Keep only keys that exist in the catalog (defends against junk input).
export const sanitizePermissions = (perms = []) =>
  [...new Set(perms)].filter((p) => ALL_PERMISSIONS.includes(p));
