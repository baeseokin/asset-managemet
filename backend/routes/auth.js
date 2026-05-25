const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const axios = require("axios");
const pool = require("../config/db");

/**
 * Register (ID + Password)
 */
router.post("/register", async (req, res) => {
  const { userId, password, userName, phone, email, deptName } = req.body;
  if (!userId || !password || !userName || !phone) {
    return res.status(400).json({ success: false, message: "필수 정보를 모두 입력하세요." });
  }

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE user_id = ?", [userId]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "이미 존재하는 ID입니다." });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (user_id, user_name, password_hash, phone, email, dept_name, is_approved) VALUES (?, ?, ?, ?, ?, ?, FALSE)",
      [userId, userName, hash, phone, email, deptName]
    );

    const newId = result.insertId;
    
    // Assign '사용자' role by default
    const [roleRows] = await pool.query("SELECT id FROM roles WHERE role_name = '사용자'");
    if (roleRows.length > 0) {
      await pool.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [newId, roleRows[0].id]);
    }

    res.json({ success: true, message: "회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다." });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "회원가입 중 오류가 발생했습니다." });
  }
});

/**
 * Check ID Duplication
 */
router.get("/check-id", async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, message: "ID를 입력하세요." });

  try {
    const [existing] = await pool.query("SELECT id FROM users WHERE user_id = ?", [userId]);
    res.json({ success: true, available: existing.length === 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: "중복 체크 중 오류가 발생했습니다." });
  }
});

/**
 * Login (ID + Password)
 */
router.post("/login", async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password)
    return res.status(400).json({ success: false, message: "ID와 비밀번호를 입력하세요." });

  try {
    const [users] = await pool.query("SELECT * FROM users WHERE user_id = ?", [userId]);
    if (users.length === 0)
      return res.status(401).json({ success: false, message: "ID 또는 비밀번호가 올바르지 않습니다." });

    const user = users[0];

    // Check approval
    if (!user.is_approved) {
      return res.status(403).json({ success: false, message: "관리자의 승인이 필요한 계정입니다. 잠시만 기다려주세요." });
    }

    // Check password
    if (!user.password_hash)
      return res.status(401).json({ success: false, message: "비밀번호가 설정되지 않은 계정입니다." });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: "ID 또는 비밀번호가 올바르지 않습니다." });

    // Check roles
    const [userRoles] = await pool.query(
      "SELECT r.role_name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?",
      [user.id]
    );
    const roles = userRoles.map((r) => r.role_name);

    req.session.user = {
      id: user.id,
      userId: user.user_id,
      userName: user.user_name,
      email: user.email,
      phone: user.phone,
      deptName: user.dept_name,
      roles,
      mustChangePassword: !!user.must_change_password
    };

    res.json({ success: true, user: req.session.user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "로그인 중 오류가 발생했습니다." });
  }
});

/**
 * Kakao OAuth Login
 */
router.post("/kakao", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false });

  try {
    // 1. Get Access Token
    const tokenRes = await axios.post("https://kauth.kakao.com/oauth/token", null, {
      params: {
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    const accessToken = tokenRes.data.access_token;

    // 2. Get User Info
    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const kakaoUser = userRes.data;
    const kakaoId = String(kakaoUser.id);
    const userName = kakaoUser.kakao_account?.profile?.nickname || "사용자";

    // 3. Find or Create User
    const [existing] = await pool.query("SELECT * FROM users WHERE kakao_id = ?", [kakaoId]);
    let user;

    if (existing.length > 0) {
      user = existing[0];
      if (!user.is_approved) {
        return res.status(403).json({ success: false, message: "관리자의 승인이 필요한 계정입니다. 잠시만 기다려주세요." });
      }
    } else {
      // Create new user if not exists (Unapproved by default)
      const [result] = await pool.query(
        "INSERT INTO users (user_id, user_name, kakao_id, is_approved) VALUES (?, ?, ?, FALSE)",
        [`kakao_${kakaoId}`, userName, kakaoId]
      );
      const newId = result.insertId;
      
      // Assign '사용자' role by default
      const [roleRows] = await pool.query("SELECT id FROM roles WHERE role_name = '사용자'");
      if (roleRows.length > 0) {
        await pool.query("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [newId, roleRows[0].id]);
      }

      return res.status(403).json({ success: false, message: "회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다." });
    }

    // 4. Set Session
    const [userRoles] = await pool.query(
      "SELECT r.role_name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = ?",
      [user.id]
    );
    const roles = userRoles.map((r) => r.role_name);

    req.session.user = {
      id: user.id,
      userId: user.user_id,
      userName: user.user_name,
      email: user.email,
      phone: user.phone,
      deptName: user.dept_name,
      roles,
    };

    res.json({ success: true, user: req.session.user });
  } catch (err) {
    console.error("Kakao login error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "카카오 로그인 중 오류가 발생했습니다." });
  }
});

/**
 * Session check
 */
router.get("/session", (req, res) => {
  if (req.session.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.json({ success: false, user: null });
  }
});

/**
 * Change Password
 */
router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const sessionUser = req.session.user;

  if (!sessionUser) return res.status(401).json({ success: false, message: "로그인이 필요합니다." });
  if (!newPassword) return res.status(400).json({ success: false, message: "새 비밀번호를 입력하세요." });

  try {
    const [users] = await pool.query("SELECT password_hash FROM users WHERE id = ?", [sessionUser.id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });

    const user = users[0];
    
    // If they have a password, check it
    if (user.password_hash && currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) return res.status(401).json({ success: false, message: "현재 비밀번호가 일치하지 않습니다." });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?", [hash, sessionUser.id]);
    
    // Update session
    req.session.user.mustChangePassword = false;
    
    res.json({ success: true, message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "비밀번호 변경 중 오류가 발생했습니다." });
  }
});

/**
 * Logout
 */
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;
