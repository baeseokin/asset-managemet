const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Middlewares
const isLogged = (req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ success: false, message: "로그인이 필요합니다." });
};

const isManagerOrAdmin = (req, res, next) => {
  if (req.session.user && (req.session.user.roles.includes("관리자") || req.session.user.roles.includes("자산담당"))) {
    return next();
  }
  res.status(403).json({ success: false, message: "권한이 없습니다." });
};

/**
 * List all locations
 */
router.get("/", isLogged, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM locations ORDER BY location_name ASC");
    res.json(rows);
  } catch (err) {
    console.error("Fetch locations error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Create location
 */
router.post("/", isLogged, isManagerOrAdmin, async (req, res) => {
  const { location_name, description } = req.body;
  if (!location_name) return res.status(400).json({ success: false, message: "보관 위치 명칭은 필수입니다." });
  
  try {
    const [result] = await pool.query(
      "INSERT INTO locations (location_name, description) VALUES (?, ?)",
      [location_name, description || null]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("Add location error:", err);
    res.status(500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? "이미 존재하는 보관 위치입니다." : err.message });
  }
});

/**
 * Update location
 */
router.put("/:id", isLogged, isManagerOrAdmin, async (req, res) => {
  const { id } = req.params;
  const { location_name, description } = req.body;
  if (!location_name) return res.status(400).json({ success: false, message: "보관 위치 명칭은 필수입니다." });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Get current name to update child assets
    const [old] = await conn.query("SELECT location_name FROM locations WHERE id = ?", [id]);
    if (old.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: "위치를 찾을 수 없습니다." });
    }

    await conn.query(
      "UPDATE locations SET location_name = ?, description = ? WHERE id = ?",
      [location_name, description || null, id]
    );

    // Update mapped assets location name
    await conn.query("UPDATE assets SET location = ? WHERE location = ?", [location_name, old[0].location_name]);

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Update location error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

/**
 * Delete location
 */
router.delete("/:id", isLogged, isManagerOrAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM locations WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete location error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
