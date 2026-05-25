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

const isManager = (req, res, next) => {
  if (req.session.user && req.session.user.roles.includes("자산담당")) return next();
  res.status(403).json({ success: false, message: "자산담당 권한이 필요합니다." });
};

/**
 * GET /api/change-requests
 * List all asset change requests (Admin sees all, Asset Manager sees their own requests)
 */
router.get("/", isLogged, async (req, res) => {
  const { status } = req.query;
  const user = req.session.user;
  try {
    let query = `
      SELECT cr.*, u.user_name as requester_name, a.asset_name as original_asset_name
      FROM asset_change_requests cr
      JOIN users u ON cr.requester_id = u.id
      LEFT JOIN assets a ON cr.asset_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += " AND cr.status = ?";
      params.push(status);
    }

    if (!user.roles.includes("관리자")) {
      // Asset managers only see their own requests
      query += " AND cr.requester_id = ?";
      params.push(user.id);
    }

    query += " ORDER BY cr.created_at DESC";
    const [rows] = await pool.query(query, params);
    
    // Parse JSON requested_data for frontend convenience
    const parsedRows = rows.map(r => ({
      ...r,
      requested_data: JSON.parse(r.requested_data)
    }));

    res.json(parsedRows);
  } catch (err) {
    console.error("Fetch change requests error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/change-requests
 * Submit a new asset change request (Asset Manager only)
 */
router.post("/", isLogged, isManager, async (req, res) => {
  const { request_type, asset_id, requested_data } = req.body;
  if (!request_type || !requested_data) {
    return res.status(400).json({ success: false, message: "필수 정보가 누락되었습니다." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO asset_change_requests (request_type, asset_id, requester_id, requested_data, status) VALUES (?, ?, ?, ?, 'pending')",
      [request_type, asset_id || null, req.session.user.id, JSON.stringify(requested_data)]
    );

    // Log history if asset_id is provided
    if (asset_id) {
      await pool.query(
        "INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description) VALUES (?, ?, ?, 'change_requested', ?)",
        [asset_id, req.session.user.id, req.session.user.userName, `자산 정보 변경 결재 요청 (${request_type === 'modify' ? '수정' : request_type === 'dispose' ? '폐기' : '삭제'})`]
      );
    }

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("Submit change request error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/change-requests/:id/approve
 * Approve an asset change request (Admin only)
 */
router.patch("/:id/approve", isLogged, isAdmin, async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT * FROM asset_change_requests WHERE id = ?", [id]);
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: "요청 건을 찾을 수 없습니다." });
    }

    const request = rows[0];
    if (request.status !== 'pending') {
      conn.release();
      return res.status(400).json({ success: false, message: "이미 처리된 요청입니다." });
    }

    const data = JSON.parse(request.requested_data);

    if (request.request_type === 'register') {
      // Insert new asset
      const [result] = await conn.query(
        `INSERT INTO assets (
          asset_name, category_name, serial_number, item_code, purchase_date, 
          purchase_price, purchase_source, receipt_image_url, useful_life_years, 
          is_consumable, stock_quantity, location, dept_name, manager_name, 
          manager_contact, image_url, description, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
        [
          data.asset_name, data.category_name, data.serial_number || null, data.item_code || null, data.purchase_date || null,
          data.purchase_price ? parseFloat(data.purchase_price) : null, data.purchase_source || null, data.receipt_image_url || null, 
          data.useful_life_years ? parseInt(data.useful_life_years) : 5, data.is_consumable ? 1 : 0, data.stock_quantity ? parseInt(data.stock_quantity) : 0,
          data.location || null, data.dept_name || '관리부', data.manager_name || '', data.manager_contact || '',
          data.image_url || null, data.description || null
        ]
      );
      
      const newAssetId = result.insertId;

      // Update change request to include new asset ID
      await conn.query("UPDATE asset_change_requests SET asset_id = ? WHERE id = ?", [newAssetId, id]);

      // Log in history
      await conn.query(
        "INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description) VALUES (?, ?, ?, 'created', '재정부장 승인에 의한 자산 신규 등록 완료')",
        [newAssetId, req.session.user.id, req.session.user.userName]
      );

    } else if (request.request_type === 'modify') {
      // Update existing asset
      await conn.query(
        `UPDATE assets SET 
          asset_name = ?, category_name = ?, serial_number = ?, item_code = ?, purchase_date = ?, 
          purchase_price = ?, purchase_source = ?, receipt_image_url = ?, useful_life_years = ?, 
          is_consumable = ?, stock_quantity = ?, location = ?, dept_name = ?, manager_name = ?, 
          manager_contact = ?, image_url = ?, description = ?
         WHERE id = ?`,
        [
          data.asset_name, data.category_name, data.serial_number || null, data.item_code || null, data.purchase_date || null,
          data.purchase_price ? parseFloat(data.purchase_price) : null, data.purchase_source || null, data.receipt_image_url || null, 
          data.useful_life_years ? parseInt(data.useful_life_years) : 5, data.is_consumable ? 1 : 0, data.stock_quantity ? parseInt(data.stock_quantity) : 0,
          data.location || null, data.dept_name || '관리부', data.manager_name || '', data.manager_contact || '',
          data.image_url || null, data.description || null, request.asset_id
        ]
      );

      // Log in history
      await conn.query(
        "INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description) VALUES (?, ?, ?, 'updated', '재정부장 승인에 의한 자산 정보 변경 완료')",
        [request.asset_id, req.session.user.id, req.session.user.userName]
      );

    } else if (request.request_type === 'dispose') {
      // Update status to 'disposed'
      await conn.query("UPDATE assets SET status = 'disposed' WHERE id = ?", [request.asset_id]);

      // Log in history
      await conn.query(
        "INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description) VALUES (?, ?, ?, 'disposed', '재정부장 승인에 의한 자산 폐기 완료')",
        [request.asset_id, req.session.user.id, req.session.user.userName]
      );

    } else if (request.request_type === 'delete') {
      // Delete asset
      await conn.query("DELETE FROM assets WHERE id = ?", [request.asset_id]);
      // Note: asset_history has CASCADE foreign key on asset_id, so its logs will be cleaned up
    }

    // Update status to approved
    await conn.query("UPDATE asset_change_requests SET status = 'approved' WHERE id = ?", [id]);

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Approve change request error:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

/**
 * PATCH /api/change-requests/:id/reject
 * Reject an asset change request with reason (Admin only)
 */
router.patch("/:id/reject", isLogged, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { reject_reason } = req.body;
  if (!reject_reason) {
    return res.status(400).json({ success: false, message: "반려 사유를 입력하세요." });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT * FROM asset_change_requests WHERE id = ?", [id]);
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: "요청 건을 찾을 수 없습니다." });
    }

    const request = rows[0];
    if (request.status !== 'pending') {
      conn.release();
      return res.status(400).json({ success: false, message: "이미 처리된 요청입니다." });
    }

    await conn.query(
      "UPDATE asset_change_requests SET status = 'rejected', reject_reason = ? WHERE id = ?",
      [reject_reason, id]
    );

    if (request.asset_id) {
      await conn.query(
        "INSERT INTO asset_history (asset_id, user_id, user_name, action_type, description) VALUES (?, ?, ?, 'status_changed', ?)",
        [request.asset_id, req.session.user.id, req.session.user.userName, `자산 변경 요청 반려: 사유 (${reject_reason})`]
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Reject change request error:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
