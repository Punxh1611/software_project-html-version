// server.js
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app = express();

// ── สร้างโฟลเดอร์ uploads ถ้ายังไม่มี ─────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// ── Middleware ─────────────────────────────────────────
app.use(cors());
app.use(express.json());

// เปิดให้เข้าถึงไฟล์สลิปที่อัปโหลด
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/routes',    require('./routes/routes'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/bookings',  require('./routes/bookings'));
app.use('/api/admin',     require('./routes/admin'));

// ── Health Check ──────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ 
        message: '🚐 VanVan API ทำงานอยู่!',
        version: '1.0.0'
    });
});

// ── Start Server ──────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server รันที่ http://localhost:${PORT}`);
});
