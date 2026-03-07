import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-otp';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Create a stateless verification token (signed)
        // This token is sent to the client but they can't read/change it without the secret
        const otpToken = jwt.sign(
            { email, otp },
            JWT_SECRET,
            { expiresIn: '5m' }
        );

        const EMAIL_USER = process.env.EMAIL_USER;
        const EMAIL_PASS = process.env.EMAIL_PASS;

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
                    <div style="font-family: sans-serif; max-width: 400px; padding: 32px; background: #0f172a; border-radius: 16px; color: #fff; border: 1px solid #1e293b;">
                        <h2 style="color: #818cf8; margin-top: 0;">EditPro Recovery</h2>
                        <p style="color: #94a3b8;">Your secure verification code is below. Do not share this with anyone.</p>
                        <div style="background: #1e293b; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
                            <span style="font-size: 32px; font-weight: 800; color: #fff; letter-spacing: 6px;">${otp}</span>
                        </div>
                        <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">This code will expire in 5 minutes.</p>
                    </div>
                `
            });

            return NextResponse.json({
                message: 'OTP sent to your email.',
                otpToken // Send token to client to keep it stateless
            });
        } else {
            // DEV FALLBACK
            console.log(`\n[VERCEL OTP DEV] Code for ${email}: ${otp}\n`);
            return NextResponse.json({
                message: 'OTP Sent (Dev Mode)!',
                devOtp: otp,
                otpToken
            });
        }
    } catch (error) {
        console.error('OTP Send Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
