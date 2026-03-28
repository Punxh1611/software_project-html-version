const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));

// Test
app.get('/', (req, res) => {
    res.json({ message: '🚐 VanVan API ทำงานอยู่!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server รันที่ http://localhost:${PORT}`);
});
