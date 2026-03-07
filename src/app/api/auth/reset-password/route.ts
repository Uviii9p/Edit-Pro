import { NextResponse } from 'next/server';

let otps: Record<string, { otp: string, expiresAt: number, attempts: number, lastSent: number, verified: boolean }> = {};

if (process.env.NODE_ENV !== 'production') {
    if (!(global as any).otps) {
        (global as any).otps = {};
    }
    otps = (global as any).otps;
}

export async function POST(req: Request) {
    try {
        const { email, newPassword } = await req.json();
        const record = otps[email];

        if (!record || !record.verified) {
            return NextResponse.json({ message: 'OTP not verified.' }, { status: 403 });
        }

        // Clean up
        delete otps[email];

        return NextResponse.json({ message: 'Password reset successfully!' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
