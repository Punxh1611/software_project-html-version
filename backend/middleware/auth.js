// middleware/auth.js
const jwt  = require('jsonwebtoken');
const pool = require('../db');

const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
        }

        const token   = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            'SELECT id, username, email, role, is_banned FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'ไม่พบผู้ใช้งาน' });
        }

        if (result.rows[0].is_banned) {
            return res.status(403).json({ 
                message: 'บัญชีถูกระงับการใช้งาน',
                banned: true
            });
        }

        req.user = result.rows[0];
        next();

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
        }
        return res.status(401).json({ message: 'Token ไม่ถูกต้อง' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบก่อน' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `ไม่มีสิทธิ์เข้าถึง (ต้องการ: ${roles.join(' หรือ ')})`
            });
        }
        next();
    };
};

module.exports = { verifyToken, requireRole };