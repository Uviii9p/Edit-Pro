import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import { JWT_SECRET } from '@/lib/constants';

export async function POST(req: Request) {
    try {
        const { email, otp, otpToken } = await req.json();
        console.log(`[VERIFY-OTP] Start for: ${email}`);

        if (!otpToken) {
            console.error('[VERIFY-OTP] Missing otpToken');
            return NextResponse.json({ message: 'Missing session token. Please request a new OTP.' }, { status: 400 });
        }

        try {
            console.log(`[VERIFY-OTP] Verifying token for ${email}...`);
            const decoded: any = jwt.verify(otpToken, JWT_SECRET);
            console.log(`[VERIFY-OTP] Token decoded. Email in token: ${decoded.email}`);

            // Security checks
            if (decoded.email !== email) {
                return NextResponse.json({ message: 'Session mismatch. Please try again.' }, { status: 400 });
            }

            if (decoded.otp !== otp) {
                return NextResponse.json({ message: 'Invalid OTP code. Please check your email.' }, { status: 400 });
            }

            // Valid! Now grant a reset token
            const resetToken = jwt.sign(
                { email, verified: true },
                JWT_SECRET,
                { expiresIn: '10m' }
            );

            return NextResponse.json({
                message: 'OTP verified successfully.',
                resetToken
            });

        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                return NextResponse.json({ message: 'OTP has expired. Please request a new one.' }, { status: 400 });
            }
            return NextResponse.json({ message: 'Invalid or corrupted session. Please try again.' }, { status: 400 });
        }

    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
