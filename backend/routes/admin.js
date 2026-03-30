// routes/admin.js
// หน้าที่: จัดการระบบสำหรับ Admin เท่านั้น
// - เพิ่ม/แก้ไข/ปิดเส้นทาง
// - สร้างบัญชีคนขับ
// - ดูรายการรอตรวจสลิป
// - ดู Dashboard

const express                    = require('express');
const router                     = express.Router();
const pool                       = require('../db');
const bcrypt                     = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');

// ทุก route ต้องเป็น Admin
router.use(verifyToken, requireRole('admin'));

// ── GET /api/admin/dashboard ──────────────────────────
// ดูภาพรวมระบบ
router.get('/dashboard', async (req, res) => {
    try {
        const [users, bookings, pendingSlips, schedules] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM users WHERE role = 'user'"),
            pool.query("SELECT COUNT(*), status FROM bookings GROUP BY status"),
            pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'slip_uploaded'"),
            pool.query("SELECT COUNT(*) FROM van_schedules WHERE status = 'available'"),
        ]);

        const revenue = await pool.query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM bookings WHERE status = 'confirmed'"
        );

        res.json({
            success: true,
            data: {
                total_users:      parseInt(users.rows[0].count),
                booking_summary:  bookings.rows,
                pending_slips:    parseInt(pendingSlips.rows[0].count),
                active_schedules: parseInt(schedules.rows[0].count),
                total_revenue:    parseFloat(revenue.rows[0].total),
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── POST /api/admin/routes ────────────────────────────
// เพิ่มเส้นทางใหม่
router.post('/routes', async (req, res) => {
    try {
        const { origin, destination, price } = req.body;

        if (!origin || !destination || !price) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
        }
        if (price <= 0) {
            return res.status(400).json({ message: 'ราคาต้องมากกว่า 0' });
        }

        const result = await pool.query(`
            INSERT INTO routes (origin, destination, price, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [origin, destination, price, req.user.id]);

        res.status(201).json({
            success: true,
            message: 'เพิ่มเส้นทางสำเร็จ',
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── PATCH /api/admin/routes/:id ───────────────────────
// แก้ไขราคา หรือปิดเส้นทาง
router.patch('/routes/:id', async (req, res) => {
    try {
        const { price, is_active } = req.body;

        const result = await pool.query(`
            UPDATE routes SET
                price     = COALESCE($1, price),
                is_active = COALESCE($2, is_active)
            WHERE id = $3
            RETURNING *
        `, [price, is_active, req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบเส้นทางนี้' });
        }

        res.json({
            success: true,
            message: 'แก้ไขเส้นทางสำเร็จ',
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── POST /api/admin/drivers ───────────────────────────
// สร้างบัญชีคนขับใหม่
router.post('/drivers', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { username, email, password, full_name, phone, license_no, plate_number, van_capacity } = req.body;

        if (!username || !email || !password || !license_no || !plate_number) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
        }

        // ตรวจสอบซ้ำ
        const exist = await client.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );
        if (exist.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Username หรือ Email นี้มีอยู่แล้ว' });
        }

        // สร้าง User
        const hashed = await bcrypt.hash(password, 10);
        const userResult = await client.query(`
            INSERT INTO users (username, email, password, role, full_name, phone)
            VALUES ($1, $2, $3, 'driver', $4, $5)
            RETURNING id, username, email, role
        `, [username, email, hashed, full_name, phone]);

        // สร้าง Driver Profile
        const driverResult = await client.query(`
            INSERT INTO drivers (user_id, license_no, plate_number, van_capacity)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [userResult.rows[0].id, license_no, plate_number, van_capacity || 13]);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'สร้างบัญชีคนขับสำเร็จ',
            data: {
                user:   userResult.rows[0],
                driver: driverResult.rows[0]
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    } finally {
        client.release();
    }
});

// ── GET /api/admin/drivers ────────────────────────────
// ดูรายชื่อคนขับทั้งหมด
router.get('/drivers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                d.*,
                u.username,
                u.email,
                u.full_name,
                u.phone,
                u.is_active
            FROM drivers d
            JOIN users u ON u.id = d.user_id
            ORDER BY d.created_at DESC
        `);

        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── GET /api/admin/slips ──────────────────────────────
// ดูรายการสลิปที่รอตรวจสอบ
router.get('/slips', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.*,
                u.username,
                u.full_name,
                u.email,
                r.origin,
                r.destination,
                s.depart_time
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            JOIN van_schedules s ON s.id = b.schedule_id
            JOIN routes r ON r.id = s.route_id
            WHERE b.status = 'slip_uploaded'
            ORDER BY b.created_at ASC
        `);

        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── GET /api/admin/bookings ───────────────────────────
// ดูการจองทั้งหมด
router.get('/bookings', async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT 
                b.*,
                u.username,
                u.full_name,
                r.origin,
                r.destination,
                s.depart_time
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            JOIN van_schedules s ON s.id = b.schedule_id
            JOIN routes r ON r.id = s.route_id
        `;

        const params = [];
        if (status) {
            query += ' WHERE b.status = $1';
            params.push(status);
        }

        query += ' ORDER BY b.created_at DESC';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
