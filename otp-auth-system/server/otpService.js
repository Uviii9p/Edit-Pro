/**
 * OTP Service Module
 * Handles OTP generation, storage, validation, and cleanup.
 * All OTPs are stored in-memory with automatic expiration.
 */

// In-memory OTP store
// Structure: { "email@example.com": { otp, expiresAt, attempts, lastSent } }
const otpStore = {};

/**
 * Generate a cryptographically random 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and store an OTP for the given email
 * Enforces a 30-second cooldown between sends
 */
function createOTP(email) {
    const now = Date.now();
    const existing = otpStore[email];

    // 30-second cooldown check
    if (existing && now - existing.lastSent < 30000) {
        const waitSeconds = Math.ceil((30000 - (now - existing.lastSent)) / 1000);
        return { error: `Please wait ${waitSeconds} seconds before requesting another OTP.` };
    }

    const otp = generateOTP();
    otpStore[email] = {
        otp,
        expiresAt: now + 5 * 60 * 1000, // 5 minutes
        attempts: 0,
        lastSent: now,
        verified: false
    };

    return { otp };
}

/**
 * Verify the submitted OTP against the stored one
 * Enforces expiration and max 3 attempts
 */
function verifyOTP(email, submittedOtp) {
    const record = otpStore[email];

    if (!record) {
        return { valid: false, message: 'No OTP found. Please request a new one.' };
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
        deleteOTP(email);
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }

    // Check max attempts
    if (record.attempts >= 3) {
        deleteOTP(email);
        return { valid: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
    }

    // Check OTP match
    if (record.otp !== submittedOtp) {
        record.attempts += 1;
        const remaining = 3 - record.attempts;
        return { valid: false, message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` };
    }

    // OTP is valid — mark as verified
    record.verified = true;
    return { valid: true, message: 'OTP verified successfully.' };
}

/**
 * Check if an OTP has been verified for the given email
 */
function isVerified(email) {
    const record = otpStore[email];
    return record && record.verified === true;
}

/**
 * Delete OTP record for the given email
 */
function deleteOTP(email) {
    delete otpStore[email];
}

module.exports = { createOTP, verifyOTP, isVerified, deleteOTP };
