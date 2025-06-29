const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_TEAMS = 12;
const ADMIN_PASSWORD = 'sahil@roshan908'; // 🔐 Set your secret here
const SHEET_BEST_URL = 'https://api.sheetbest.com/sheets/25c6170a-c597-4a6d-a233-3221c1bbbc70'; // 🔁 Replace

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(session({
    secret: 'bgmi_secret_key', // 🔐 Change this for production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true only on HTTPS
}));

// ✅ Admin Login Route
app.post('/admin-login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        req.session.authenticated = true;
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Incorrect password' });
    }
});

// ✅ Auth Middleware
function isAuthenticated(req, res, next) {
    if (req.session.authenticated) return next();
    res.status(403).json({ message: 'Forbidden' });
}

// ✅ Register route (no login required)
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

// ✅ Delete route (protected)
app.delete('/delete/:bgmiId', isAuthenticated, async (req, res) => {
    const { bgmiId } = req.params;

    try {
        const deleteURL = `${SHEET_BEST_URL}/BGMI%20ID/${bgmiId}`;
        const response = await axios.delete(deleteURL);
        res.status(200).json({ message: 'Team deleted successfully.', deleted: response.data });
    } catch (err) {
        console.error("❌ Error deleting from Google Sheet:", err.message);
        res.status(500).json({ message: 'Failed to delete team.' });
    }
});

// ✅ Progress route
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

// ✅ Logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("❌ Error logging out:", err);
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // Optional: clear session cookie
        res.status(200).json({ message: 'Logged out successfully' });
    });
});
