/**
 * Seed (or update) an admin user.
 *
 * Usage:
 *   node seed-admin.js
 *
 * Reads credentials from env (set these in .env):
 *   ADMIN_NAME      (default: "Admin")
 *   ADMIN_EMAIL     (default: "admin@rk.com")
 *   ADMIN_PASSWORD  (default: "admin123")  <-- change in production!
 *
 * Safe to run repeatedly: if the email already exists, it is promoted to
 * role "admin" and its password is reset to ADMIN_PASSWORD.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const run = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Add it to backend/.env first.");
    process.exit(1);
  }

  const name = process.env.ADMIN_NAME || "Admin";
  const email = (process.env.ADMIN_EMAIL || "admin@rk.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";

  await mongoose.connect(process.env.MONGODB_URI);

  let user = await User.findOne({ email }).select("+password");
  if (user) {
    user.name = name;
    user.role = "super_admin";
    user.isActive = true;
    user.password = password; // re-hashed by the pre('save') hook
    await user.save();
    console.log(`Updated existing user "${email}" to super_admin (platform owner).`);
  } else {
    user = await User.create({ name, email, password, role: "super_admin" });
    console.log(`Created super_admin user "${email}".`);
  }

  console.log("Login with:");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log("Remember to change the password after first login in production.");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
