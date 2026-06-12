import crypto from "crypto";

// Generate a client API key (shown once) and its storable SHA-256 hash.
export const generateApiKey = () => {
  const key = "rk_" + crypto.randomBytes(24).toString("hex");
  return { key, hash: hashApiKey(key), last4: key.slice(-4) };
};

export const hashApiKey = (key) =>
  crypto.createHash("sha256").update(key).digest("hex");
