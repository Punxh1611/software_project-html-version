const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/routes — ดูเส้นทางทั้งหมด
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM routes WHERE is_active = true ORDER BY origin'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
