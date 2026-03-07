// Shared OTP store for Next.js API routes
// Using global to persist across hot reloads in development

let otps: Record<string, { otp: string, expiresAt: number, attempts: number, lastSent: number, verified: boolean }> = {};

if (typeof global !== 'undefined') {
    if (!(global as any).otps) {
        (global as any).otps = {};
    }
    otps = (global as any).otps;
}

export default otps;
