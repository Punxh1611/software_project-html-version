// routes/bookings.js
const express                    = require('express');
const router                     = express.Router();
const pool                       = require('../db');
const multer                     = require('multer');
const { createClient }           = require('@supabase/supabase-js');
const { verifyToken, requireRole } = require('../middleware/auth');

// ── Supabase Storage ──────────────────────────────────
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// ── Multer (เก็บในหน่วยความจำ ไม่บันทึกลงเครื่อง) ────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (/jpeg|jpg|png/.test(file.mimetype)) cb(null, true);
        else cb(new Error('ไฟล์ต้องเป็น JPG หรือ PNG เท่านั้น'));
    }
});

// ── อัปโหลดไปยัง Supabase Storage ───────────────────
async function uploadToSupabase(file) {
    const filename = `slip-${Date.now()}-${Math.round(Math.random() * 1e9)}.${file.mimetype === 'image/png' ? 'png' : 'jpg'}`;

    const { error } = await supabase.storage
        .from('slips')
        .upload(filename, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) throw new Error('อัปโหลดรูปไม่สำเร็จ: ' + error.message);

    // ดึง Public URL
    const { data } = supabase.storage
        .from('slips')
        .getPublicUrl(filename);

    return data.publicUrl;
}

// ── Ticket Code ───────────────────────────────────────
function generateTicketCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'VV-';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ══════════════════════════════════════════════════════
// POST /api/bookings/confirm
// สร้าง booking + อัปโหลดสลิปไป Supabase Storage
// ══════════════════════════════════════════════════════
router.post('/confirm', verifyToken, requireRole('user'), upload.single('slip'), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { schedule_id } = req.body;

        if (!schedule_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'กรุณาระบุรอบที่ต้องการจอง' });
        }
        if (!req.file) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'กรุณาแนบสลิปการโอนเงิน' });
        }

        // ดึงข้อมูลรอบ + Lock
        const schedResult = await client.query(
            'SELECT * FROM van_schedules WHERE id = $1 FOR UPDATE',
            [schedule_id]
        );

        if (schedResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'ไม่พบรอบนี้' });
        }

        const schedule = schedResult.rows[0];

        if (schedule.available_seats <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'ที่นั่งเต็มแล้ว กรุณาเลือกรอบอื่น' });
        }
        if (schedule.status !== 'available') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'รอบนี้ไม่สามารถจองได้' });
        }

        // ดึงราคา
        const routeResult = await client.query(
            'SELECT price FROM routes WHERE id = $1',
            [schedule.route_id]
        );
        const amount = routeResult.rows[0].price;

        // ✅ อัปโหลดสลิปไป Supabase Storage
        const slipUrl = await uploadToSupabase(req.file);

        // สร้าง booking พร้อม URL ของสลิป
        const bookingResult = await client.query(`
            INSERT INTO bookings
                (user_id, schedule_id, amount, status, slip_image, expires_at)
            VALUES ($1, $2, $3, 'slip_uploaded', $4, NOW() + INTERVAL '7 days')
            RETURNING *
        `, [req.user.id, schedule_id, amount, slipUrl]);

        // ลดที่นั่ง
        const newAvailable = schedule.available_seats - 1;
        await client.query(`
            UPDATE van_schedules
            SET available_seats = $1,
                status = CASE WHEN $1 = 0 THEN 'full' ELSE status END
            WHERE id = $2
        `, [newAvailable, schedule_id]);

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'จองสำเร็จ! รอ Admin ตรวจสอบสลิป',
            data: bookingResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: err.message || 'เกิดข้อผิดพลาด' });
    } finally {
        client.release();
    }
});

// ══════════════════════════════════════════════════════
// GET /api/bookings — ประวัติการจองของตัวเอง
// ══════════════════════════════════════════════════════
router.get('/', verifyToken, requireRole('user'), async (req, res) => {
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
                r.origin,
                r.destination,
                r.price,
                r.estimated_hours,
                s.depart_time,
                s.status AS schedule_status,
                d.full_name AS driver_name,
                v.plate_number
            FROM bookings b
            JOIN van_schedules s ON s.id = b.schedule_id
            JOIN routes r ON r.id = s.route_id
            LEFT JOIN drivers d ON d.id = s.driver_id
            LEFT JOIN vans v ON v.id = s.van_id
            WHERE b.user_id = $1
            ORDER BY s.depart_time DESC
        `, [req.user.id]);

        res.json({ success: true, data: result.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ══════════════════════════════════════════════════════
// POST /api/bookings/:id/verify — Admin ตรวจสลิป
// ══════════════════════════════════════════════════════
router.post('/:id/verify', verifyToken, requireRole('admin'), async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { action, reject_reason } = req.body;
        if (!action || !['approve', 'reject'].includes(action)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'action ต้องเป็น approve หรือ reject' });
        }

        const booking = await client.query(
            'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
            [req.params.id]
        );
        if (booking.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'ไม่พบการจองนี้' });
        }

        const b = booking.rows[0];
        if (b.status !== 'slip_uploaded') {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'การจองนี้ไม่มีสลิปรอตรวจสอบ' });
        }

        if (action === 'approve') {
            const ticketCode = generateTicketCode();
            const result = await client.query(`
                UPDATE bookings SET
                    status      = 'confirmed',
                    ticket_code = $1
                WHERE id = $2
                RETURNING *
            `, [ticketCode, req.params.id]);

            await client.query('COMMIT');
            res.json({
                success: true,
                message: 'ยืนยันสำเร็จ ออก E-Ticket แล้ว',
                data: result.rows[0]
            });

        } else {
            await client.query(`
                UPDATE bookings SET
                    status        = 'rejected',
                    reject_reason = $1
                WHERE id = $2
            `, [reject_reason || 'สลิปไม่ถูกต้อง', req.params.id]);

            await client.query(`
                UPDATE van_schedules
                SET available_seats = available_seats + 1,
                    status = 'available'
                WHERE id = $1
            `, [b.schedule_id]);

            await client.query('COMMIT');

            if (b.slip_image) {
                try {
                    const filename = b.slip_image.split('/').pop();
                    await supabase.storage.from('slips').remove([filename]);
                } catch (storageErr) {
                    console.error('ลบรูปไม่สำเร็จ:', storageErr.message);
                }
            }

            res.json({ success: true, message: 'ปฏิเสธการชำระเงินแล้ว' });
        }

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    } finally {
        client.release();
    }
});

module.exports = router;