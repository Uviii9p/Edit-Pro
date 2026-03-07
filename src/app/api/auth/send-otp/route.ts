import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import otps from '@/lib/otp-store';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ message: 'Email is required.' }, { status: 400 });

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const now = Date.now();

        // Check cooldown (30s)
        const record = otps[email];
        if (record && now - record.lastSent < 30000) {
            return NextResponse.json({ message: 'Please wait 30 seconds before requesting another OTP.' }, { status: 429 });
        }

        // Store OTP
        otps[email] = {
            otp,
            expiresAt: now + 5 * 60 * 1000,
            attempts: 0,
            lastSent: now,
            verified: false
        };

        const EMAIL_USER = process.env.EMAIL_USER;
        const EMAIL_PASS = process.env.EMAIL_PASS;

        console.log(`[AUTH] Attempting OTP send for: ${email}`);
        console.log(`[AUTH] Configured Email: ${EMAIL_USER ? 'YES' : 'NO'}`);

        if (EMAIL_USER && EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: EMAIL_USER, pass: EMAIL_PASS }
            });

            await transporter.sendMail({
                from: `"EditPro Studio" <${EMAIL_USER}>`,
                to: email,
                subject: 'EditPro Password Reset OTP',
                html: `
                    <div style="font-family: sans-serif; max-width: 400px; padding: 20px; background: #0f172a; border-radius: 12px; color: #fff;">
                        <h2 style="color: #6366f1;">EditPro Recovery</h2>
                        <p>Your OTP is: <b style="font-size: 24px; color: #818cf8; letter-spacing: 4px;">${otp}</b></p>
                        <p style="font-size: 12px; color: #94a3b8;">Expires in 5 minutes.</p>
                    </div>
                `
            });
            return NextResponse.json({ message: 'OTP sent to your email.' });
        } else {
            // DEV FALLBACK
            console.log(`\n[VERCEL OTP DEV] Code for ${email}: ${otp}\n`);
            return NextResponse.json({
                message: 'OTP Sent! Please check your email inbox.'
            });
        }
    } catch (error) {
        console.error('OTP Send Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
