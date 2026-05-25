const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = "uploads/assets/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Auth middlewares
const isLogged = (req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ success: false, message: "로그인이 필요합니다." });
};

const hasWriteAccess = (req, res, next) => {
  const user = req.session.user;
  if (user && (user.roles.includes("관리자") || user.roles.includes("자산담당"))) {
    return next();
  }
  res.status(403).json({ success: false, message: "자산 수정 권한이 없습니다." });
};

/**
 * List all assets with optional search/filtering
 */
router.get("/", isLogged, async (req, res) => {
  try {
    const { type, status, search, useful_life_expired, location, dept_name } = req.query;
    let query = "SELECT * FROM assets WHERE 1=1";
    const params = [];

    if (type) {
      query += " AND category_name = ?";
      params.push(type);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (location) {
      query += " AND location = ?";
      params.push(location);
    }
    if (dept_name) {
      query += " AND dept_name = ?";
      params.push(dept_name);
    }
    if (search) {
      query += " AND (asset_name LIKE ? OR serial_number LIKE ? OR item_code LIKE ? OR manager_name LIKE ? OR location LIKE ?)";
      const wild = `%${search}%`;
      params.push(wild, wild, wild, wild, wild);
    }
    if (useful_life_expired === 'true') {
      // Calculate: purchase_date + useful_life_years <= current date
      query += " AND purchase_date IS NOT NULL AND DATE_ADD(purchase_date, INTERVAL useful_life_years YEAR) <= CURDATE()";
    }

    query += " ORDER BY id DESC";
    const [assets] = await pool.query(query, params);
    res.json(assets);
  } catch (err) {
    console.error("Fetch assets error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get manager dashboard statistics (department-wise summary, alerts)
 */
router.get("/manager-stats", isLogged, async (req, res) => {
  const user = req.session.user;
  const dept = user.deptName || '관리부';

  try {
    // 1. Department assets summary grouped by category
    const [deptAssetsSummary] = await pool.query(
      "SELECT IFNULL(category_name, '미지정') as name, COUNT(*) as count FROM assets WHERE dept_name = ? GROUP BY category_name",
      [dept]
    );

    // 2. Low stock consumables (stock <= 5)
    const [lowStockConsumables] = await pool.query(
      "SELECT * FROM assets WHERE dept_name = ? AND is_consumable = 1 AND stock_quantity <= 5",
      [dept]
    );

    // 3. Maintenance assets list
    const [maintenanceAssets] = await pool.query(
      "SELECT * FROM assets WHERE dept_name = ? AND status = 'under_maintenance' ORDER BY updated_at DESC",
      [dept]
    );

    res.json({
      dept,
      deptAssetsSummary,
      lowStockConsumables,
      maintenanceAssets
    });
  } catch (err) {
    console.error("Fetch manager stats error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get single asset details, loan history, and A/S maintenance logs
 */
router.get("/:id", isLogged, async (req, res) => {
  const { id } = req.params;
  try {
    const [assets] = await pool.query("SELECT * FROM assets WHERE id = ?", [id]);
    if (assets.length === 0) return res.status(404).json({ success: false, message: "자산을 찾을 수 없습니다." });

    const [history] = await pool.query("SELECT * FROM asset_history WHERE asset_id = ? ORDER BY action_date DESC", [id]);
    const [maintenance] = await pool.query("SELECT * FROM asset_maintenance WHERE asset_id = ? ORDER BY maintenance_date DESC", [id]);
    
    res.json({
      asset: assets[0],
      history,
      maintenance
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Add a new asset
 * - Admins (재정부) insert directly.
 * - Asset Managers (관리부) create an approval request instead.
 */
router.post("/", isLogged, hasWriteAccess, upload.single("image"), async (req, res) => {
  const user = req.session.user;
  const image_url = req.file ? `/uploads/assets/${req.file.filename}` : null;

  const {
    asset_name, category_name, serial_number, item_code, purchase_date,
    purchase_price, purchase_source, receipt_image_url, useful_life_years,
    is_consumable, stock_quantity, location, dept_name, manager_name, manager_contact, description
  } = req.body;

  const data = {
    asset_name,
    category_name,
    serial_number,
    item_code: item_code || `ITM-${Date.now().toString().slice(-6)}`, // Auto generate code if empty
    purchase_date: purchase_date || null,
    purchase_price: purchase_price ? parseFloat(purchase_price) : null,
    purchase_source: purchase_source || null,
    receipt_image_url: receipt_image_url || null,
    useful_life_years: useful_life_years ? parseInt(useful_life_years) : 5,
    is_consumable: is_consumable === "true" || is_consumable === "1" ? 1 : 0,
    stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
    location,
    dept_name: dept_name || '관리부',
    manager_name: manager_name || user.userName,
    manager_contact: manager_contact || user.phone,
    image_url,
    description
  };

  if (user.roles.includes("관리자")) {
    // Admin: direct insert
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO assets (
          asset_name, category_name, serial_number, item_code, purchase_date, 
          purchase_price, purchase_source, receipt_image_url, useful_life_years, 
          is_consumable, stock_quantity, location, dept_name, manager_name, 
          manager_contact, image_url, description, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
        [
          data.asset_name, data.category_name, data.serial_number, data.item_code, data.purchase_date,
          data.purchase_price, data.purchase_source, data.receipt_image_url, data.useful_life_years,
          data.is_consumable, data.stock_quantity, data.location, data.dept_name, data.manager_name,
          data.manager_contact, data.image_url, data.description
        ]
      );
      
      const newId = result.insertId;

      await conn.query(
        "INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description) VALUES (?, ?, ?, 'created', ?)",
        [newId, user.id, user.userName, "자산이 최고 관리자에 의해 신규 등록되었습니다."]
      );

      await conn.commit();
      res.json({ success: true, id: newId, direct: true });
    } catch (err) {
      await conn.rollback();
      console.error("Add asset error:", err);
      res.status(500).json({ success: false, message: err.code === 'ER_DUP_ENTRY' ? "이미 등록된 시리얼 번호 혹은 물품 코드입니다." : err.message });
    } finally {
      conn.release();
    }
  } else {
    // Asset Manager: insert as pending approval request
    try {
      const [result] = await pool.query(
        "INSERT INTO asset_change_requests (request_type, asset_id, requester_id, requested_data, status) VALUES ('register', NULL, ?, ?, 'pending')",
        [user.id, JSON.stringify(data)]
      );
      res.json({ success: true, id: result.insertId, direct: false, message: "등록 결재 요청이 재정부에 제출되었습니다." });
    } catch (err) {
      console.error("Create registration request error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

/**
 * Update an asset
 * - Admins update directly.
 * - Asset Managers submit a change request.
 */
router.put("/:id", isLogged, hasWriteAccess, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const user = req.session.user;
  const { remove_image } = req.body;

  const {
    asset_name, category_name, serial_number, item_code, purchase_date,
    purchase_price, purchase_source, receipt_image_url, useful_life_years,
    is_consumable, stock_quantity, location, dept_name, manager_name, manager_contact, description, status
  } = req.body;

  // Retrieve current asset state to check for changes
  const [current] = await pool.query("SELECT * FROM assets WHERE id = ?", [id]);
  if (current.length === 0) return res.status(404).json({ success: false, message: "자산을 찾을 수 없습니다." });

  let image_url = current[0].image_url;
  if (req.file) {
    image_url = `/uploads/assets/${req.file.filename}`;
  } else if (remove_image === "true") {
    image_url = null;
  }

  const data = {
    asset_name: asset_name || current[0].asset_name,
    category_name: category_name || current[0].category_name,
    serial_number: serial_number !== undefined ? serial_number : current[0].serial_number,
    item_code: item_code !== undefined ? item_code : current[0].item_code,
    purchase_date: purchase_date !== undefined ? (purchase_date || null) : current[0].purchase_date,
    purchase_price: purchase_price !== undefined ? (purchase_price ? parseFloat(purchase_price) : null) : current[0].purchase_price,
    purchase_source: purchase_source !== undefined ? purchase_source : current[0].purchase_source,
    receipt_image_url: receipt_image_url !== undefined ? receipt_image_url : current[0].receipt_image_url,
    useful_life_years: useful_life_years !== undefined ? (useful_life_years ? parseInt(useful_life_years) : 5) : current[0].useful_life_years,
    is_consumable: is_consumable !== undefined ? (is_consumable === "true" || is_consumable === "1" ? 1 : 0) : current[0].is_consumable,
    stock_quantity: stock_quantity !== undefined ? (stock_quantity ? parseInt(stock_quantity) : 0) : current[0].stock_quantity,
    location: location !== undefined ? location : current[0].location,
    dept_name: dept_name !== undefined ? dept_name : current[0].dept_name,
    manager_name: manager_name !== undefined ? manager_name : current[0].manager_name,
    manager_contact: manager_contact !== undefined ? manager_contact : current[0].manager_contact,
    image_url,
    description: description !== undefined ? description : current[0].description,
    status: status || current[0].status
  };

  if (user.roles.includes("관리자")) {
    // Admin: direct update
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE assets SET 
          asset_name = ?, category_name = ?, serial_number = ?, item_code = ?, purchase_date = ?, 
          purchase_price = ?, purchase_source = ?, receipt_image_url = ?, useful_life_years = ?, 
          is_consumable = ?, stock_quantity = ?, location = ?, dept_name = ?, manager_name = ?, 
          manager_contact = ?, image_url = ?, description = ?, status = ?
         WHERE id = ?`,
        [
          data.asset_name, data.category_name, data.serial_number, data.item_code, data.purchase_date,
          data.purchase_price, data.purchase_source, data.receipt_image_url, data.useful_life_years,
          data.is_consumable, data.stock_quantity, data.location, data.dept_name, data.manager_name,
          data.manager_contact, data.image_url, data.description, data.status, id
        ]
      );

      // Log status changes or update info
      if (current[0].status !== data.status) {
        await conn.query(
          "INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description) VALUES (?, ?, ?, 'status_changed', ?)",
          [id, user.id, user.userName, `자산 상태 변경: ${current[0].status} ➔ ${data.status}`]
        );
      } else {
        await conn.query(
          "INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description) VALUES (?, ?, ?, 'updated', ?)",
          [id, user.id, user.userName, "자산 정보가 최고 관리자에 의해 직접 수정되었습니다."]
        );
      }

      await conn.commit();
      res.json({ success: true, direct: true });
    } catch (err) {
      await conn.rollback();
      console.error("Update asset error:", err);
      res.status(500).json({ success: false, error: err.message });
    } finally {
      conn.release();
    }
  } else {
    // Asset Manager: request modification approval
    try {
      const [result] = await pool.query(
        "INSERT INTO asset_change_requests (request_type, asset_id, requester_id, requested_data, status) VALUES ('modify', ?, ?, ?, 'pending')",
        [id, user.id, JSON.stringify(data)]
      );
      res.json({ success: true, id: result.insertId, direct: false, message: "수정 결재 요청이 재정부에 제출되었습니다." });
    } catch (err) {
      console.error("Create modification request error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

/**
 * Delete or request disposal/deletion of an asset
 */
router.delete("/:id", isLogged, hasWriteAccess, async (req, res) => {
  const { id } = req.params;
  const { request_type } = req.query; // 'dispose' or 'delete'
  const user = req.session.user;

  if (user.roles.includes("관리자")) {
    try {
      if (request_type === 'dispose') {
        await pool.query("UPDATE assets SET status = 'disposed' WHERE id = ?", [id]);
        await pool.query(
          "INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description) VALUES (?, ?, ?, 'disposed', '자산 폐기 완료')",
          [id, user.id, user.userName]
        );
      } else {
        await pool.query("DELETE FROM assets WHERE id = ?", [id]);
      }
      res.json({ success: true, direct: true });
    } catch (err) {
      console.error("Delete/Dispose asset error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  } else {
    // Asset Manager: submit disposal/deletion request
    const type = request_type === 'dispose' ? 'dispose' : 'delete';
    try {
      const [result] = await pool.query(
        "INSERT INTO asset_change_requests (request_type, asset_id, requester_id, requested_data, status) VALUES (?, ?, ?, ?, 'pending')",
        [type, id, user.id, JSON.stringify({ asset_id: id })]
      );
      res.json({ success: true, id: result.insertId, direct: false, message: `${type === 'dispose' ? '폐기' : '삭제'} 결재 요청이 재정부에 제출되었습니다.` });
    } catch (err) {
      console.error("Create delete request error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

/**
 * GET /api/assets/:id/maintenance
 * Get maintenance logs
 */
router.get("/:id/maintenance", isLogged, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM asset_maintenance WHERE asset_id = ? ORDER BY maintenance_date DESC", [id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/assets/:id/maintenance
 * Add A/S Maintenance log (Admin/Manager only)
 */
router.post("/:id/maintenance", isLogged, hasWriteAccess, async (req, res) => {
  const { id } = req.params;
  const { maintenance_date, maintenance_type, cost, description, handler_name } = req.body;
  if (!maintenance_date) return res.status(400).json({ success: false, message: "정비 일자는 필수 입력입니다." });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO asset_maintenance (asset_id, maintenance_date, maintenance_type, cost, description, handler_name)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, maintenance_date, maintenance_type || 'repair', cost ? parseFloat(cost) : 0, description || null, handler_name || null]
    );

    // Write to asset_history
    await conn.query(
      `INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description)
       VALUES (?, ?, ?, 'repaired', ?)`,
      [id, req.session.user.id, req.session.user.userName, `A/S 정비 기록 등록: ${maintenance_type || '수리'} (${maintenance_date}) - 비용: ${cost || 0}원`]
    );

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Add maintenance error:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

/**
 * DELETE /api/assets/:id/maintenance/:mId
 * Delete A/S Maintenance log
 */
router.delete("/:id/maintenance/:mId", isLogged, hasWriteAccess, async (req, res) => {
  const { id, mId } = req.params;
  try {
    await pool.query("DELETE FROM asset_maintenance WHERE id = ? AND asset_id = ?", [mId, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete maintenance error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
