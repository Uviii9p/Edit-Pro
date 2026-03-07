/**
 * Shared client-side logic for the OTP Auth System.
 * Handles API calls, UI state, resend cooldowns, and page transitions.
 */

const API_BASE = window.location.origin;

// ---- Utility Helpers ----
function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = `msg ${type}`;
}

function hideMsg(id) {
    const el = document.getElementById(id);
    el.className = 'msg';
    el.style.display = 'none';
}

function setLoading(btnId, loading, originalText) {
    const btn = document.getElementById(btnId);
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> Processing...';
    } else {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function getEmail() {
    return sessionStorage.getItem('reset_email') || '';
}

// ========================================
// PAGE 1: Forgot Password — Send OTP
// ========================================
async function handleSendOtp(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('email')?.value?.trim();
    if (!email) return showMsg('msg', 'Please enter your email address.', 'error');

    hideMsg('msg');
    setLoading('submitBtn', true, 'Send OTP Code');

    try {
        const res = await fetch(`${API_BASE}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            showMsg('msg', data.message || 'Something went wrong.', 'error');
            return;
        }

        // Save email for subsequent pages
        sessionStorage.setItem('reset_email', email);
        showMsg('msg', 'OTP has been sent to your email. Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = 'verify-otp.html';
        }, 1500);
    } catch (err) {
        showMsg('msg', 'Network error. Please try again.', 'error');
    } finally {
        setLoading('submitBtn', false, 'Send OTP Code');
    }
}

// ========================================
// PAGE 2: Verify OTP
// ========================================
async function handleVerifyOtp(e) {
    if (e) e.preventDefault();
    const email = getEmail();
    const otp = document.getElementById('otp')?.value?.trim();

    if (!email) {
        showMsg('msg', 'Session expired. Redirecting...', 'error');
        setTimeout(() => window.location.href = 'forgot-password.html', 1500);
        return;
    }
    if (!otp || otp.length !== 6) return showMsg('msg', 'Please enter the full 6-digit OTP.', 'error');

    hideMsg('msg');
    setLoading('submitBtn', true, 'Verify Code');

    try {
        const res = await fetch(`${API_BASE}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            showMsg('msg', data.message || 'Verification failed.', 'error');
            return;
        }

        showMsg('msg', 'OTP verified! Setting up password reset...', 'success');
        setTimeout(() => {
            window.location.href = 'reset-password.html';
        }, 1500);
    } catch (err) {
        showMsg('msg', 'Network error. Please try again.', 'error');
    } finally {
        setLoading('submitBtn', false, 'Verify Code');
    }
}

// ========================================
// PAGE 2: Resend OTP with 30s Cooldown
// ========================================
function initResendCooldown() {
    const btn = document.getElementById('resendBtn');
    const timerEl = document.getElementById('cooldownTimer');
    if (!btn) return;

    let remaining = 30;
    btn.disabled = true;

    const interval = setInterval(() => {
        remaining--;
        if (timerEl) timerEl.textContent = `Resend available in ${remaining}s`;

        if (remaining <= 0) {
            clearInterval(interval);
            btn.disabled = false;
            if (timerEl) timerEl.textContent = '';
        }
    }, 1000);

    btn.addEventListener('click', async () => {
        const email = getEmail();
        if (!email) return;

        btn.disabled = true;
        try {
            const res = await fetch(`${API_BASE}/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (data.success) {
                showMsg('msg', 'New OTP sent to your email!', 'success');
                // Restart cooldown
                remaining = 30;
                const newInterval = setInterval(() => {
                    remaining--;
                    if (timerEl) timerEl.textContent = `Resend available in ${remaining}s`;
                    if (remaining <= 0) {
                        clearInterval(newInterval);
                        btn.disabled = false;
                        if (timerEl) timerEl.textContent = '';
                    }
                }, 1000);
            } else {
                showMsg('msg', data.message || 'Could not resend.', 'error');
                btn.disabled = false;
            }
        } catch {
            showMsg('msg', 'Network error.', 'error');
            btn.disabled = false;
        }
    });
}

// ========================================
// PAGE 3: Reset Password
// ========================================
async function handleResetPassword(e) {
    if (e) e.preventDefault();
    const email = getEmail();
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (!email) {
        showMsg('msg', 'Session expired. Redirecting...', 'error');
        setTimeout(() => window.location.href = 'forgot-password.html', 1500);
        return;
    }
    if (!newPassword || newPassword.length < 6) return showMsg('msg', 'Password must be at least 6 characters.', 'error');
    if (newPassword !== confirmPassword) return showMsg('msg', 'Passwords do not match.', 'error');

    hideMsg('msg');
    setLoading('submitBtn', true, 'Reset Password');

    try {
        const res = await fetch(`${API_BASE}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, newPassword, confirmPassword })
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            showMsg('msg', data.message || 'Reset failed.', 'error');
            return;
        }

        sessionStorage.removeItem('reset_email');
        showMsg('msg', data.message || 'Password reset successfully!', 'success');

        setTimeout(() => {
            // Redirect to login (adjust URL as needed for your app)
            window.location.href = '/login';
        }, 2000);
    } catch (err) {
        showMsg('msg', 'Network error. Please try again.', 'error');
    } finally {
        setLoading('submitBtn', false, 'Reset Password');
    }
}
