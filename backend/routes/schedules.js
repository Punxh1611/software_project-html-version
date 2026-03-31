// routes/schedules.js
const express                    = require('express');
const router                     = express.Router();
const pool                       = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── GET /api/schedules ─────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { origin, destination, date } = req.query;

        let query = `
            SELECT 
                s.id,
                s.depart_time,
                s.total_seats,
                s.available_seats,
                s.status,
                r.origin,
                r.destination,
                r.destination_en,
                r.price,
                r.estimated_hours,
                d.full_name AS driver_name,
                v.plate_number
            FROM van_schedules s
            JOIN routes r ON r.id = s.route_id
            LEFT JOIN drivers d ON d.id = s.driver_id
            LEFT JOIN vans v ON v.id = s.van_id
            WHERE s.status = 'available'
            AND s.depart_time > NOW()
            AND s.depart_time <= NOW() + INTERVAL '7 days'
            AND s.driver_id IS NOT NULL
        `;

        const params = [];
        let idx = 1;

        if (origin) {
            query += ` AND r.origin ILIKE $${idx++}`;
            params.push(`%${origin}%`);
        }
        if (destination) {
            query += ` AND r.destination ILIKE $${idx++}`;
            params.push(`%${destination}%`);
        }
        if (date) {
            query += ` AND DATE(s.depart_time) = $${idx++}`;
            params.push(date);
        }

        query += ' ORDER BY s.depart_time ASC';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── GET /api/schedules/:id ────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.*,
                r.origin,
                r.destination,
                r.destination_en,
                r.price,
                r.estimated_hours,
                d.full_name AS driver_name,
                v.plate_number
            FROM van_schedules s
            JOIN routes r ON r.id = s.route_id
            LEFT JOIN drivers d ON d.id = s.driver_id
            LEFT JOIN vans v ON v.id = s.van_id
            WHERE s.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบรอบนี้' });
        }
        res.json({ success: true, data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── POST /api/schedules ───────────────────────────────
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { route_id, driver_id, depart_time, total_seats } = req.body;

        if (!route_id || !depart_time) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ (เส้นทาง, วันเวลา)' });
        }

        const routeCheck = await pool.query(
            'SELECT id, price FROM routes WHERE id = $1 AND is_active = true',
            [route_id]
        );
        if (routeCheck.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบเส้นทางนี้' });
        }

        const seats = total_seats || 13;

        const result = await pool.query(`
            INSERT INTO van_schedules 
                (route_id, driver_id, depart_time, total_seats, available_seats, assigned_by)
            VALUES ($1, $2, $3, $4, $4, $5)
            RETURNING *
        `, [route_id, driver_id || null, depart_time, seats, req.user.id]);

        res.status(201).json({
            success: true,
            message: 'สร้างรอบรถสำเร็จ',
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── PATCH /api/schedules/:id/driver ──────────────────
router.patch('/:id/driver', verifyToken, requireRole('admin'), async (req, res) => {
    try {
        const { driver_id } = req.body;
        if (!driver_id) {
            return res.status(400).json({ message: 'กรุณาระบุ driver_id' });
        }

        const driverCheck = await pool.query(
            'SELECT id FROM drivers WHERE id = $1',
            [driver_id]
        );
        if (driverCheck.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบคนขับนี้' });
        }

        const result = await pool.query(`
            UPDATE van_schedules 
            SET driver_id = $1, assigned_by = $2
            WHERE id = $3
            RETURNING *
        `, [driver_id, req.user.id, req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'ไม่พบรอบนี้' });
        }

        res.json({
            success: true,
            message: 'กำหนดคนขับสำเร็จ',
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;