const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../db');

// ─────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Validate
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
    }

    try {
        // ตรวจ username และ email ซ้ำ
        const exist = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (exist.rows.length > 0) {
            return res.status(409).json({ message: 'Username หรือ Email นี้ถูกใช้ไปแล้ว' });
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // บันทึกลง Database
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
        // หา user จาก username หรือ email
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'ไม่พบ Username หรือ Email นี้ในระบบ' });
        }

        const user = result.rows[0];

        // ตรวจรหัสผ่าน
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
                id:       user.id,
                username: user.username,
                email:    user.email,
                role:     user.role,
                photo_url: user.photo_url,
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

module.exports = router;
