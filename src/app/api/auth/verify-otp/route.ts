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
        const { email, otp } = await req.json();
        const record = otps[email];

        if (!record) return NextResponse.json({ message: 'No OTP requested for this email.' }, { status: 400 });
        if (Date.now() > record.expiresAt) return NextResponse.json({ message: 'OTP has expired.' }, { status: 400 });
        if (record.attempts >= 3) return NextResponse.json({ message: 'Max attempts exceeded.' }, { status: 429 });

        if (record.otp !== otp) {
            record.attempts += 1;
            return NextResponse.json({ message: 'Invalid OTP code.' }, { status: 400 });
        }

        record.verified = true;
        return NextResponse.json({ message: 'OTP verified successfully.' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
