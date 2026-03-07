const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const USERS_FILE = path.join(__dirname, 'users.json');
const otps = {};

const getUsers = () => fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) : [];
const saveUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'YOUR_EMAIL@gmail.com',
        pass: 'YOUR_APP_PASSWORD'
    }
});

app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'User with this email not found.' });

    const now = Date.now();
    const record = otps[email];

    if (record && now - record.lastSent < 30000) {
        return res.status(429).json({ error: 'Please wait 30 seconds before requesting another OTP.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otps[email] = {
        otp,
        expiresAt: now + 5 * 60 * 1000,
        attempts: 0,
        lastSent: now,
        verified: false
    };

    const mailOptions = {
        from: 'YOUR_EMAIL@gmail.com',
        to: email,
        subject: 'Password Reset OTP',
        text: `Hello,\n\nYour OTP for password reset is: ${otp}\nThis OTP will expire in 5 minutes.\n\nIf you did not request this, please ignore this email.`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'OTP securely dispatched to your email address.' });
    } catch (err) {
        console.error("Nodemailer Error:", err);
        res.status(500).json({ error: 'Failed to send OTP email.' });
    }
});

app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email & OTP are required.' });

    const record = otps[email];
    if (!record) return res.status(400).json({ error: 'No OTP currently requested.' });

    if (Date.now() > record.expiresAt) {
        delete otps[email];
        return res.status(400).json({ error: 'Your OTP has expired.' });
    }

    if (record.attempts >= 3) {
        delete otps[email];
        return res.status(429).json({ error: 'Maximum failure attempts reached.' });
    }

    if (record.otp !== otp) {
        record.attempts += 1;
        return res.status(400).json({ error: `Invalid OTP code. ${3 - record.attempts} attempts remaining.` });
    }

    record.verified = true;
    res.json({ message: 'OTP verified strongly! You can reset your password.' });
});

app.post('/reset-password', async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'Complete form parameters are required.' });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const record = otps[email];
    if (!record || !record.verified) {
        return res.status(403).json({ error: 'OTP unverified. Verify an OTP first.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex !== -1) {
        users[userIndex].password = hashedPassword;
        saveUsers(users);
    }

    delete otps[email];
    res.json({ message: 'Password has been safely reset.' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`OTP Backend safely active on http://localhost:${PORT}`));
