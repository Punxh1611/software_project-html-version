// routes/admin.js
const express                    = require('express');
const router                     = express.Router();
const pool                       = require('../db');
const bcrypt                     = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

// ── GET /api/admin/dashboard ──────────────────────────
router.get('/dashboard', async (req, res) => {
    try {
        const [users, bookings, pendingSlips, schedules, revenue, popularRoutes] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM users WHERE role = 'user'"),
            pool.query("SELECT COUNT(*), status FROM bookings GROUP BY status"),
            pool.query("SELECT COUNT(*) FROM bookings WHERE status = 'slip_uploaded'"),
            pool.query("SELECT COUNT(*) FROM van_schedules WHERE status = 'available'"),
            pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM bookings WHERE status = 'confirmed'"),
            // สถิติเส้นทางยอดนิยมวันนี้
            pool.query(`
                SELECT r.origin, r.destination, COUNT(b.id) as passenger_count
                FROM bookings b
                JOIN van_schedules s ON s.id = b.schedule_id
                JOIN routes r ON r.id = s.route_id
                WHERE b.status = 'confirmed'
                AND DATE(s.depart_time) = CURRENT_DATE
                GROUP BY r.origin, r.destination
                ORDER BY passenger_count DESC
            `)
        ]);

        res.json({
            success: true,
            data: {
                total_users:      parseInt(users.rows[0].count),
                booking_summary:  bookings.rows,
                pending_slips:    parseInt(pendingSlips.rows[0].count),
                active_schedules: parseInt(schedules.rows[0].count),
                total_revenue:    parseFloat(revenue.rows[0].total),
                popular_routes:   popularRoutes.rows,
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── POST /api/admin/routes ────────────────────────────
router.post('/routes', async (req, res) => {
    try {
        const { origin, destination, destination_en, price, estimated_hours } = req.body;

        if (!origin || !destination || !price) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
        }
        if (price <= 0) {
            return res.status(400).json({ message: 'ราคาต้องมากกว่า 0' });
        }

        const result = await pool.query(`
            INSERT INTO routes (origin, destination, destination_en, price, estimated_hours)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [origin, destination, destination_en || null, price, estimated_hours || null]);

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
router.patch('/routes/:id', async (req, res) => {
    try {
        const { price, estimated_hours, is_active } = req.body;

        const result = await pool.query(`
            UPDATE routes SET
                price           = COALESCE($1, price),
                estimated_hours = COALESCE($2, estimated_hours),
                is_active       = COALESCE($3, is_active)
            WHERE id = $4
            RETURNING *
        `, [price, estimated_hours, is_active, req.params.id]);

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
router.post('/drivers', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { username, email, password, full_name, phone, license_no, plate_number, van_capacity } = req.body;

        if (!username || !email || !password || !license_no || !plate_number) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
        }

        // ตรวจ email ซ้ำ
        const exist = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        if (exist.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ message: 'Email นี้มีอยู่แล้ว' });
        }

        // สร้าง User (ไม่มี full_name, phone ใน users แล้ว)
        const hashed = await bcrypt.hash(password, 10);
        const userResult = await client.query(`
            INSERT INTO users (username, email, password, role)
            VALUES ($1, $2, $3, 'driver')
            RETURNING id, username, email, role
        `, [username, email, hashed]);

        // สร้าง Driver พร้อม full_name, phone
        const driverResult = await client.query(`
            INSERT INTO drivers (user_id, full_name, phone, license_no)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [userResult.rows[0].id, full_name || null, phone || null, license_no]);

        // สร้าง Van
        if (plate_number) {
            await client.query(`
                INSERT INTO vans (plate_number, capacity)
                VALUES ($1, $2)
            `, [plate_number, van_capacity || 14]);
        }

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
router.get('/drivers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                d.id,
                d.full_name,
                d.phone,
                d.license_no,
                u.username,
                u.email,
                u.is_banned,
                u.violation_count,
                (
                    SELECT v.plate_number
                    FROM van_schedules vs
                    JOIN vans v ON v.id = vs.van_id
                    WHERE vs.driver_id = d.id AND vs.van_id IS NOT NULL
                    ORDER BY vs.depart_time DESC
                    LIMIT 1
                ) AS plate_number
            FROM drivers d
            JOIN users u ON u.id = d.user_id
            ORDER BY d.full_name
        `);

        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── GET /api/admin/slips ──────────────────────────────
router.get('/slips', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                b.id,
                b.amount,
                b.status,
                b.slip_image,
                b.expires_at,
                b.reject_reason,
                b.ticket_code,
                u.username,
                r.origin,
                r.destination,
                s.depart_time
            FROM bookings b
            JOIN users u ON u.id = b.user_id
            JOIN van_schedules s ON s.id = b.schedule_id
            JOIN routes r ON r.id = s.route_id
            WHERE b.status = 'slip_uploaded'
            ORDER BY b.expires_at ASC
        `);

        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── GET /api/admin/bookings ───────────────────────────
router.get('/bookings', async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
            SELECT
                b.id,
                b.amount,
                b.status,
                b.slip_image,
                b.reject_reason,
                b.ticket_code,
                u.username,
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

        query += ' ORDER BY s.depart_time DESC';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ── GET /api/admin/stats/routes ──────────────────────
// สถิติเส้นทาง วันนี้มีคนไปที่ไหนมากที่สุด/น้อยที่สุด
router.get('/stats/routes', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || 'CURRENT_DATE';

        const result = await pool.query(`
            SELECT
                r.origin,
                r.destination,
                COUNT(b.id) as passenger_count
            FROM bookings b
            JOIN van_schedules s ON s.id = b.schedule_id
            JOIN routes r ON r.id = s.route_id
            WHERE b.status = 'confirmed'
            AND DATE(s.depart_time) = $1
            GROUP BY r.origin, r.destination
            ORDER BY passenger_count DESC
        `, [date || new Date().toISOString().slice(0, 10)]);

        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;