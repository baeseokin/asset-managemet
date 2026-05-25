const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load .env
const ENV_FILE = path.resolve(process.cwd(), ".env");
if (fs.existsSync(ENV_FILE)) dotenv.config({ path: ENV_FILE });

const ENV = (process.env.NODE_ENV || "development").toLowerCase();

/**
 * Priority environment picker:
 * 1) KEY__NODE_ENV (e.g., DB_HOST__development)
 * 2) KEY (generic)
 * 3) def (default value)
 */
function envPick(key, def = undefined) {
  const envKey = `${key}__${ENV}`;
  if (process.env[envKey] && process.env[envKey] !== "") return process.env[envKey];
  if (process.env[key] && process.env[key] !== "") return process.env[key];
  return def;
}

function envNumber(key, def) {
  const v = envPick(key);
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function envBool(key, def) {
  const v = envPick(key);
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["1","true","yes","on"].includes(s)) return true;
    if (["0","false","no","off"].includes(s)) return false;
  }
  return def;
}

module.exports = { envPick, envNumber, envBool, ENV };
