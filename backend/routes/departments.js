const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.roles.includes("관리자")) return next();
  res.status(403).json({ success: false, message: "관리자 권한이 필요합니다." });
};

/**
 * List all departments
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM departments ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("Fetch departments error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Add Department
 */
router.post("/", isAdmin, async (req, res) => {
  const { dept_name, parent_dept_id } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO departments (dept_name, parent_dept_id) VALUES (?, ?)",
      [dept_name, parent_dept_id || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("Add department error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Update Department
 */
router.put("/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const { dept_name, parent_dept_id } = req.body;
  try {
    await pool.query(
      "UPDATE departments SET dept_name = ?, parent_dept_id = ? WHERE id = ?",
      [dept_name, parent_dept_id || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Update department error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Delete Department
 */
router.delete("/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM departments WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete department error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
