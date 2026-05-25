const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const { envPick, envNumber, ENV } = require("./env");
const pool = require("./config/db");

const app = express();
const PORT = envNumber("PORT", 3003); // Using 3003 for Asset Management

// CORS setup
const allowedOrigins = (envPick("CORS_ORIGIN", "") || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || ENV === "development") {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed: " + origin));
    }
  },
  credentials: true
}));

app.use(bodyParser.json());
if (ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    secret: envPick("SESSION_SECRET", "asset-secret-key"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: "auto",
      sameSite: "lax"
    }
  })
);

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const assetRoutes = require("./routes/assets");
const departmentRoutes = require("./routes/departments");
const adminRoutes = require("./routes/admins");
const locationRoutes = require("./routes/locations");
const categoryRoutes = require("./routes/categories");
const changeRequestRoutes = require("./routes/changeRequests");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/change-requests", changeRequestRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/health", (req, res) => res.send("OK"));

app.listen(PORT, () => {
  console.log(`🚀 Asset Management Server running on port ${PORT}`);
});
