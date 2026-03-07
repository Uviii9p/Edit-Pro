require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createOTP, verifyOTP, isVerified, deleteOTP } = require('./otpService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- Config ---
const USERS_FILE = path.join(__dirname, 'users.json');
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

// --- Helpers ---
const getUsers = () => {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
};
const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// --- Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
    }
});

// =============================================
// ROUTE 1: POST /send-otp
// =============================================
app.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    // Check user exists in JSON DB
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email.' });

    // Generate OTP (with 30s cooldown check)
    const result = createOTP(email);
    if (result.error) return res.status(429).json({ success: false, message: result.error });

    // Send email via Nodemailer
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        console.log(`\n[DEV MODE] OTP for ${email}: ${result.otp}\n`);
        return res.json({
            success: true,
            message: 'OTP has been sent to your email. Please check your inbox.',
            dev_note: 'Gmail credentials not configured. Check server console for OTP.'
        });
    }

    const mailOptions = {
        from: `"EditPro Studio" <${GMAIL_USER}>`,
        to: email,
        subject: 'EditPro Password Reset OTP',
        html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 16px; color: #e2e8f0;">
                <h1 style="font-size: 24px; font-weight: 800; color: #818cf8; margin: 0 0 8px 0;">EditPro Studio</h1>
                <p style="color: #94a3b8; font-size: 13px; margin: 0 0 24px 0;">Password Recovery Request</p>
                <hr style="border: none; border-top: 1px solid #1e293b; margin: 0 0 24px 0;">
                <p style="margin: 0 0 16px 0; line-height: 1.6;">Hello,</p>
                <p style="margin: 0 0 24px 0; line-height: 1.6;">Your password reset OTP is:</p>
                <div style="text-align: center; background: #1e293b; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
                    <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #818cf8;">${result.otp}</span>
                </div>
                <p style="margin: 0 0 8px 0; color: #f59e0b; font-size: 13px; font-weight: 600;">⏱ This code will expire in 5 minutes.</p>
                <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">If you did not request this reset, please ignore this email. Your account remains secure.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] OTP sent to ${email}`);
        res.json({ success: true, message: 'OTP has been sent to your email. Please check your inbox.' });
    } catch (err) {
        console.error('[EMAIL ERROR]', err.message);
        res.status(500).json({ success: false, message: 'Failed to send OTP email. Check server configuration.' });
    }
});

// =============================================
// ROUTE 2: POST /verify-otp
// =============================================
app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required.' });

    const result = verifyOTP(email, otp);
    if (!result.valid) {
        return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, message: result.message });
});

// =============================================
// ROUTE 3: POST /reset-password
// =============================================
app.post('/reset-password', async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (!isVerified(email)) {
        return res.status(403).json({ success: false, message: 'OTP verification required before resetting password.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const users = getUsers();
        const index = users.findIndex(u => u.email === email);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        users[index].password = hashedPassword;
        saveUsers(users);
        deleteOTP(email); // Clean up

        res.json({ success: true, message: 'Password reset successfully! Redirecting to login...' });
    } catch (err) {
        console.error('[RESET ERROR]', err.message);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});

// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🔐 OTP Auth Server running at http://localhost:${PORT}`);
    console.log(`📧 Gmail: ${GMAIL_USER || '(not configured — dev mode)'}`);
    console.log(`📂 Users DB: ${USERS_FILE}\n`);
});
