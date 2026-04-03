// driver/backend/routes/driver.js
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── GET /api/driver/profile ───────────────────────────────
router.get('/profile', verifyToken, requireRole('driver'), async (req, res) => {
    try {
        const driverResult = await pool.query(`
            SELECT d.id, d.full_name, d.phone, d.license_no,
                   u.username, u.email
            FROM drivers d
            JOIN users u ON u.id = d.user_id
            WHERE d.user_id = $1
        `, [req.user.id]);

        if (driverResult.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลคนขับ' });
        }

        const driver = driverResult.rows[0];
        let trips_today = 0, passengers_today = 0, total_trips = 0, plate_number = null;

        try {
            const statsResult = await pool.query(`
                SELECT
                    COUNT(CASE WHEN s.status = 'completed' THEN 1 END)                        AS total_trips,
                    COUNT(CASE WHEN DATE(s.depart_time) = CURRENT_DATE THEN 1 END)             AS trips_today,
                    COALESCE(SUM(CASE WHEN DATE(s.depart_time) = CURRENT_DATE
                        THEN s.total_seats - s.available_seats END), 0)                        AS passengers_today,
                    MAX(v.plate_number)                                                        AS plate_number
                FROM van_schedules s
                LEFT JOIN vans v ON v.id = s.van_id
                WHERE s.driver_id = $1
            `, [driver.id]);

            if (statsResult.rows.length > 0) {
                trips_today      = statsResult.rows[0].trips_today      || 0;
                passengers_today = statsResult.rows[0].passengers_today || 0;
                total_trips      = statsResult.rows[0].total_trips      || 0;
                plate_number     = statsResult.rows[0].plate_number     || null;
            }
        } catch (statsErr) {
            console.error("stats error:", statsErr.message);
        }

        res.json({ success: true, data: { ...driver, trips_today, passengers_today, total_trips, plate_number } });
    } catch (err) {
        console.error("profile error:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + err.message });
    }
});

// ── GET /api/driver/schedules ─────────────────────────────
router.get('/schedules', verifyToken, requireRole('driver'), async (req, res) => {
    try {
        const { date } = req.query;
        const dateFilter = date === 'today'
            ? `AND DATE(s.depart_time) = CURRENT_DATE`
            : `AND DATE(s.depart_time) >= CURRENT_DATE - INTERVAL '90 days'`;

        const result = await pool.query(`
            SELECT s.id, s.depart_time, s.total_seats, s.available_seats,
                   s.status, r.origin, r.destination, r.price, v.plate_number
            FROM van_schedules s
            JOIN routes r ON r.id = s.route_id
            LEFT JOIN vans v ON v.id = s.van_id
            LEFT JOIN drivers d ON d.id = s.driver_id
            WHERE d.user_id = $1 ${dateFilter}
            ORDER BY s.depart_time DESC
        `, [req.user.id]);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── GET /api/driver/schedules/:id/passengers ──────────────
// (คนที่ยืนยันแล้ว - สีเขียว)
router.get('/schedules/:id/passengers', verifyToken, requireRole('driver'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.id, b.ticket_code, b.status, COALESCE(u.full_name, u.username) AS passenger_name
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            WHERE b.schedule_id = $1 AND b.status = 'confirmed'
            ORDER BY b.id ASC
        `, [req.params.id]);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── GET /api/driver/schedules/:id/pending ─────────────────
// (คนที่รอแอดมินยืนยัน - สีเหลือง)
router.get('/schedules/:id/pending', verifyToken, requireRole('driver'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT b.id, b.status, COALESCE(u.full_name, u.username) AS passenger_name
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            WHERE b.schedule_id = $1
            AND b.status IN ('pending', 'slip_uploaded')
            ORDER BY b.id ASC
        `, [req.params.id]);

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── PATCH /api/driver/schedules/:id/status ───────────────
router.patch('/schedules/:id/status', verifyToken, requireRole('driver'), async (req, res) => {
    const { status } = req.body;
    const allowed = ['available', 'traveling', 'completed', 'cancelled'];

    if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    try {
        if (status === 'traveling') {
            const scheduleRes = await pool.query(
                `SELECT depart_time FROM van_schedules WHERE id = $1`,
                [req.params.id]
            );
            if (scheduleRes.rows.length > 0) {
                const depart  = new Date(scheduleRes.rows[0].depart_time);
                const now     = new Date();
                const diffMin = (depart - now) / 60000;

                if (diffMin > 15) {
                    return res.status(400).json({
                        message: `ยังออกรถไม่ได้ เหลืออีก ${Math.round(diffMin)} นาที (ออกได้เมื่อเหลือไม่เกิน 15 นาที)`
                    });
                }
            }
        }

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
router.post('/verify-ticket', verifyToken, requireRole('driver'), async (req, res) => {
    const { ticket_code, schedule_id } = req.body;

    if (!ticket_code || !schedule_id) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบ' });
    }

    try {
        const result = await pool.query(`
            SELECT b.id, b.ticket_code, b.status, COALESCE(u.full_name, u.username) AS passenger_name
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