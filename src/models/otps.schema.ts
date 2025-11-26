import mongoose from "mongoose";

const EmailOtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        otp: {
            type: String,
            required: true,

        },

        type: {
            type: String,
            enum: ["email_verification", "login_2fa"],
            required: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Automatically delete expired OTPs
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("EmailOtp", EmailOtpSchema);
