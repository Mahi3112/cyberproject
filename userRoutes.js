import express from "express";
import User from "./../models/userModel.js";
import { jwtAuthMiddleware, generateToken } from './../jwt.js';
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { sendEmail } from '../emailservice.js';
import fs from "fs";
import nodemailer from "nodemailer";

const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const data = req.body;
        const newUser = new User(data);
        const response = await newUser.save();

        const token = generateToken({ id: response.id });

        res.status(200).json({ response, token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login Route with 2FA
async function sendEmailWithQR(to, subject, htmlContent, qrPath) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: htmlContent,
        attachments: [
            {
                filename: "qrcode.png",
                path: qrPath,
                cid: "qrcode", // Content-ID to reference in email body
            },
        ],
    };

    await transporter.sendMail(mailOptions);
}
router.post('/login', async (req, res) => {
    try {
        const { aadharnumber, password } = req.body;
        const user = await User.findOne({ aadharnumber });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid aadharnumber or password' });
        }
        else {user.isMFA=true;}
        if (user.isMFA) {
            // Generate OTP Secret and QR Code
            const secret = speakeasy.generateSecret();
            user.twoFactorSecret = secret.base32;
            await user.save();

            const url = speakeasy.otpauthURL({
                secret: secret.base32,
                label: `${user.email}`,
                issuer: "Secure E-Voting System",
                encoding: "base32"
            });

            // Generate QR Code
            const qrPath = './qrcode.png';
            qrcode.toFile(qrPath, url, async (err) => {
                if (err) {
                    return res.status(500).json({ error: 'QR Code generation failed' });
                }

                // Email HTML with QR Code Image using CID
                const emailBody = `
                    <p>Scan this QR code in Google Authenticator or any TOTP app:</p>
                    <img src="cid:qrcode" alt="QR Code" />
                `;

                // Send Email
                await sendEmailWithQR(user.email, 'Your MFA QR Code', emailBody, qrPath);

                // Delete the QR Code file after sending email
                fs.unlinkSync(qrPath);

                res.status(200).json({ message: 'MFA enabled. Check your email for QR code' });
            });


        } else {
            const token = generateToken({ id: user.id });
            res.json({ token });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// 2FA Verification Route
router.post('/2fa/verify', async (req, res) => {
    try {
        const { aadharnumber, token } = req.body;
        const user = await User.findOne({ aadharnumber });

        if (!user || !user.twoFactorSecret) {
            return res.status(400).json({ error: 'User not found or 2FA is not enabled' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token
        });

        if (verified) {
            const jwtToken = generateToken({ id: user.id });
            res.status(200).json({ message: "2FA successful", token: jwtToken });
        } else {
            res.status(400).json({ message: "Invalid 2FA token" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Profile Route
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({ user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Change Password Route
router.put('/profile/password', jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(userId);

        // Corrected Password Check
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password updated' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Reset 2FA Route
router.post('/2fa/reset', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.twoFactorSecret = null;
        user.isMFA = false;
        await user.save();
        res.status(200).json({ message: "2FA reset successful" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;
