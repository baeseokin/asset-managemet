const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Middlewares
const isLogged = (req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ success: false, message: "로그인이 필요합니다." });
};

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.roles.includes("관리자")) return next();
  res.status(403).json({ success: false, message: "관리자 권한이 필요합니다." });
};

/**
 * List all categories
 */
router.get("/", isLogged, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categories ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Create category (Admin only)
 */
router.post("/", isLogged, isAdmin, async (req, res) => {
  const { category_name, description } = req.body;
  if (!category_name) return res.status(400).json({ success: false, message: "카테고리 이름은 필수입니다." });

  try {
    const [result] = await pool.query(
      "INSERT INTO categories (category_name, description) VALUES (?, ?)",
      [category_name, description || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("Add category error:", err);
    res.status(500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? "이미 존재하는 카테고리입니다." : err.message });
  }
});

/**
 * Update category (Admin only)
 */
router.put("/:id", isLogged, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { category_name, description } = req.body;
  if (!category_name) return res.status(400).json({ success: false, message: "카테고리 이름은 필수입니다." });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [old] = await conn.query("SELECT category_name FROM categories WHERE id = ?", [id]);
    if (old.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: "카테고리를 찾을 수 없습니다." });
    }

    await conn.query(
      "UPDATE categories SET category_name = ?, description = ? WHERE id = ?",
      [category_name, description || null, id]
    );

    // Update mapped assets category name
    await conn.query("UPDATE assets SET category_name = ? WHERE category_name = ?", [category_name, old[0].category_name]);

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Update category error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

/**
 * Delete category (Admin only)
 */
router.delete("/:id", isLogged, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
