const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_TEAMS = 12;

// 🔗 Replace with your Sheet.best API URL
const SHEET_BEST_URL = 'https://api.sheetbest.com/sheets/25c6170a-c597-4a6d-a233-3221c1bbbc70';

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// ✅ Register route (store to Google Sheet)
app.post('/register', async (req, res) => {
    const { name, email, phone, bgmiId, team } = req.body;

    if (!name || !email || !phone || !bgmiId) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    try {
        await axios.post(SHEET_BEST_URL, {
            Name: name,
            Email: email,
            Phone: phone,
            "BGMI ID": bgmiId,
            Team: team,
            Timestamp: new Date().toISOString()
        });

        res.status(200).json({ message: 'Registration successful!' });
    } catch (err) {
        console.error("❌ Error posting to Google Sheet:", err.message);
        res.status(500).json({ message: 'Failed to register' });
    }
});

// ✅ Progress bar endpoint
app.get('/progress', async (req, res) => {
    try {
        const response = await axios.get(SHEET_BEST_URL);
        const rows = response.data;

        const count = rows.filter(row => row.Name && row.Name.trim() !== '').length;

        res.json({ current: count, max: MAX_TEAMS });
    } catch (err) {
        console.error("❌ Error fetching progress:", err.message);
        res.status(500).json({ current: 0, max: MAX_TEAMS });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
