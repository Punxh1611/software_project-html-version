// routes/auth.js
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    try {
        const exist = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (exist.rows.length > 0) {
            return res.status(409).json({ message: 'Email นี้ถูกใช้ไปแล้ว' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashed, 'user']
        );

        const user  = result.rows[0];
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ!', token, user });

    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// ─────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'ไม่พบ Email นี้ในระบบ' });
        }

        const user  = result.rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'เข้าสู่ระบบสำเร็จ!',
            token,
            user: {
                id:        user.id,
                username:  user.username,
                email:     user.email,
                role:      user.role,
                is_banned: user.is_banned,
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// ─────────────────────────────────────────
// POST /api/auth/forgot-password
// ค้นหาบัญชีจาก Email เท่านั้น
// ─────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    // เช็คว่าส่ง Email มาไหม
    if (!email) {
        return res.status(400).json({ message: 'กรุณากรอก Email' });
    }

    try {
        // ค้นหาในฐานข้อมูลด้วย Email
        const userResult = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        // ถ้าไม่เจอ Email นี้
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: 'ไม่พบ Email นี้ในระบบ',
                field: 'email'
            });
        }

        // ถ้าเจอ ส่ง user_id กลับไปให้ตั้งรหัสใหม่
        res.json({
            success: true,
            message: 'พบบัญชีแล้ว กรุณาตั้งรหัสผ่านใหม่',
            user_id: userResult.rows[0].id
        });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล' });
    }
});

// ─────────────────────────────────────────
// POST /api/auth/reset-password
// ตั้งรหัสผ่านใหม่โดยใช้ user_id
// ─────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
    const { user_id, new_password } = req.body;

    if (!user_id || !new_password) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
    }
    if (new_password.length < 6) {
        return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    try {
        const hashed = await bcrypt.hash(new_password, 10);
        const result = await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
            [hashed, user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบบัญชีนี้' });
        }

        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ!' });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

module.exports = router;