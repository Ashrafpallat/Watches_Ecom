const mongoose = require('mongoose')
const userOTPVerificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: null
    },
    otp: String,
    recipient_email: String,
    createdAt: Date,
    expiresAt: Date,
});

const userOTPVerification = mongoose.model(
    "UserOTPVerification",
    userOTPVerificationSchema
);

module.exports = userOTPVerification;