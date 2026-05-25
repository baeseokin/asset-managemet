const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const isLogged = (req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ success: false, message: "로그인이 필요합니다." });
};

const isAdmin = (req, res, next) => {
  if (req.session.user?.roles?.includes("관리자")) return next();
  res.status(403).json({ success: false, message: "관리자 권한이 필요합니다." });
};

/**
 * GET /api/admins/stats — Dashboard statistics summary
 */
router.get("/stats", isLogged, isAdmin, async (req, res) => {
  try {
    const [[assetsCount]] = await pool.query("SELECT COUNT(*) as count FROM assets");
    const [[usersCount]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE is_approved = 1");
    const [[pendingUsers]] = await pool.query("SELECT COUNT(*) as count FROM users WHERE is_approved = 0");
    const [[pendingChangeRequests]] = await pool.query("SELECT COUNT(*) as count FROM asset_change_requests WHERE status = 'pending'");

    // 1. Category stats
    const [categoryStats] = await pool.query(
      "SELECT IFNULL(category_name, '미지정') as name, COUNT(*) as count, IFNULL(SUM(purchase_price), 0) as total_value FROM assets GROUP BY category_name"
    );

    // 2. Department stats
    const [deptStats] = await pool.query(
      "SELECT IFNULL(dept_name, '소속없음') as name, COUNT(*) as count, IFNULL(SUM(purchase_price), 0) as total_value FROM assets GROUP BY dept_name"
    );

    res.json({
      totalAssets: assetsCount.count,
      totalUsers: usersCount.count,
      pendingUsers: pendingUsers.count,
      pendingChangeRequests: pendingChangeRequests.count,
      categoryStats,
      deptStats
    });
  } catch (err) {
    console.error("Fetch admin stats error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/admins — List all users with '관리자' role
 */
router.get("/", isLogged, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.user_id, u.user_name, u.email, u.phone, u.created_at,
              GROUP_CONCAT(r.role_name) as roles
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE r.role_name = '관리자'
       GROUP BY u.id
       ORDER BY u.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admins — Create a new administrator
 */
router.post("/", isLogged, isAdmin, async (req, res) => {
  const { user_id, user_name, email, phone, password } = req.body;
  if (!user_id || !user_name || !password)
    return res.status(400).json({ success: false, message: "ID, 이름, 비밀번호는 필수 항목입니다." });

  try {
    const [exists] = await pool.query("SELECT id FROM users WHERE user_id = ?", [user_id]);
    if (exists.length > 0)
      return res.status(409).json({ success: false, message: "이미 사용 중인 ID입니다." });

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (user_id, user_name, email, phone, password_hash, is_approved) VALUES (?, ?, ?, ?, ?, TRUE)",
      [user_id, user_name, email || null, phone || null, passwordHash]
    );

    // Assign admin role
    const [adminRole] = await pool.query("SELECT id FROM roles WHERE role_name = '관리자'");
    if (adminRole.length > 0) {
      await pool.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [
        result.insertId,
        adminRole[0].id,
      ]);
    }

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/admins/:id — Update an administrator's profile/password
 */
router.put("/:id", isLogged, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { user_name, email, phone, password } = req.body;

  try {
    if (password && password.trim()) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET user_name=?, email=?, phone=?, password_hash=? WHERE id=?",
        [user_name, email || null, phone || null, hash, id]
      );
    } else {
      await pool.query(
        "UPDATE users SET user_name=?, email=?, phone=? WHERE id=?",
        [user_name, email || null, phone || null, id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/admins/:id — Remove administrator role or account
 */
router.delete("/:id", isLogged, isAdmin, async (req, res) => {
  const { id } = req.params;
  const selfId = req.session.user.id;

  if (String(id) === String(selfId))
    return res.status(400).json({ success: false, message: "본인 계정은 삭제할 수 없습니다." });

  try {
    await pool.query("DELETE FROM user_roles WHERE user_id = ?", [id]);
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
