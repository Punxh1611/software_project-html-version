// routes/driver.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── GET /api/driver/schedules ─────────────────────────────
// ดึงรอบรถของ driver ที่ login อยู่ (วันนี้ + อนาคต)
router.get('/schedules', verifyToken, requireRole('driver'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.id,
                s.depart_time,
                s.total_seats,
                s.available_seats,
                s.status,
                r.origin,
                r.destination,
                r.price,
                v.plate_number
            FROM van_schedules s
            JOIN routes r ON r.id = s.route_id
            LEFT JOIN vans v ON v.id = s.van_id
            LEFT JOIN drivers d ON d.id = s.driver_id
            WHERE d.user_id = $1
            AND DATE(s.depart_time) >= CURRENT_DATE
            ORDER BY s.depart_time ASC
        `, [req.user.id]);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── GET /api/driver/schedules/:id/passengers ──────────────
// ดึงรายชื่อผู้โดยสารของรอบนั้น
router.get('/schedules/:id/passengers', verifyToken, requireRole('driver'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                b.id,
                b.ticket_code,
                b.status,
                u.username AS passenger_name
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            WHERE b.schedule_id = $1
            AND b.status = 'confirmed'
            ORDER BY b.id ASC
        `, [req.params.id]);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── PATCH /api/driver/schedules/:id/status ───────────────
// อัปเดตสถานะรอบรถ
router.patch('/schedules/:id/status', verifyToken, requireRole('driver'), async (req, res) => {
    const { status } = req.body;
    const allowed = ['scheduled', 'departed', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    try {
        const result = await pool.query(`
            UPDATE van_schedules s
            SET status = $1
            FROM drivers d
            WHERE s.id = $2
            AND s.driver_id = d.id
            AND d.user_id = $3
            RETURNING s.id, s.status
        `, [status, req.params.id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(403).json({ message: 'ไม่พบรอบนี้หรือไม่มีสิทธิ์' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── POST /api/driver/verify-ticket ───────────────────────
// ตรวจสอบตั๋วผู้โดยสารด้วย ticket_code
router.post('/verify-ticket', verifyToken, requireRole('driver'), async (req, res) => {
    const { ticket_code, schedule_id } = req.body;

    if (!ticket_code || !schedule_id) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
    }

    try {
        const result = await pool.query(`
            SELECT b.id, b.ticket_code, b.status, u.username AS passenger_name
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            WHERE b.ticket_code = $1 AND b.schedule_id = $2
        `, [ticket_code, schedule_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบตั๋วนี้' });
        }

        const booking = result.rows[0];
        if (booking.status !== 'confirmed') {
            return res.status(400).json({ message: 'ตั๋วนี้ยังไม่ได้รับการยืนยัน' });
        }

        res.json({ success: true, data: booking });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;