# 🔐 EditPro OTP Forgot Password System

A fully working **Email OTP authentication system** using Node.js, Express, Nodemailer, and a JSON file as the database. The OTP is sent **directly to the user's Gmail** — it is never displayed on screen.

## 📂 Project Structure

```
otp-auth-system/
├── package.json
├── .env.example
├── server/
│   ├── server.js          # Express server with 3 API routes
│   ├── otpService.js      # OTP generation, storage, and validation
│   └── users.json         # JSON flat-file database
└── public/
    ├── styles.css          # Dark theme professional CSS
    ├── script.js           # Shared client-side logic
    ├── forgot-password.html
    ├── verify-otp.html
    └── reset-password.html
```

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
cd otp-auth-system
npm install
```

### 2. Create Gmail App Password

> **Important:** You need a Gmail App Password, NOT your regular Gmail password.

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App Passwords** (search "App Passwords" in Google Account)
4. Select app: **Mail**, Select device: **Other** → type "EditPro"
5. Click **Generate** — copy the **16-character password**

### 3. Create `.env` File
```bash
cp .env.example .env
```
Edit `.env` and add your credentials:
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
PORT=3000
```

### 4. Add Users to Database
Edit `server/users.json` and add user entries:
```json
[
  {
    "id": "usr_001",
    "name": "Your Name",
    "email": "your-email@gmail.com",
    "password": "$2b$12$hashedPasswordHere"
  }
]
```

### 5. Run the Server
```bash
npm start
```

### 6. Open in Browser
Navigate to: **http://localhost:3000/forgot-password.html**

## 🔒 Security Features

| Feature | Implementation |
|---|---|
| OTP Generation | Random 6-digit number |
| OTP Expiry | 5 minutes |
| Max Attempts | 3 per OTP |
| Resend Cooldown | 30 seconds |
| OTP Exposure | Never shown on frontend |
| Password Storage | bcrypt hash (12 rounds) |
| OTP Cleanup | Deleted after verification or expiry |

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/send-otp` | Send OTP to user's email |
| POST | `/verify-otp` | Verify submitted OTP |
| POST | `/reset-password` | Reset password with bcrypt hash |

## 🚀 Dev Mode (No Gmail Configured)

If you run the server without configuring Gmail credentials, it operates in **Dev Mode** — the OTP is printed to the server console instead of being emailed. This lets you test the full flow locally without Gmail setup.

## 📧 Email Preview

The OTP email has a professional dark-themed HTML design matching EditPro Studio branding.
