import { Request, Response } from "express";
import argon2 from "argon2"
import User from "../models/user.schema";
import EmailOtp from "../models/otps.schema";
import { emailService, MailTemplate } from "../lib/email";
import { AppError, AppResponse } from "../lib/responses";
import { registerSchema, verifyEmailSchema, loginSchema, verify2FASchema } from "../lib/validation";
import { z } from "zod";

const OTP_EXPIRY_MINUTES = 10;

const generateOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000);
    return String(code);
};

export const register = async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join(", ");
        throw new AppError(400, `Validation error: ${message}`);
    }

    const { firstname, lastname, email, password, address } = parsed.data;

    let user = await User.findOne({ email });

    if (user) {
        throw new AppError(400, "User already exist");
    }

    const hashedPass = await argon2.hash(password)

    user = new User({ firstname, lastname, email, password: hashedPass, address });

    await user.save();

    const otp = generateOtp();
    const hashedOtp = await argon2.hash(otp);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await EmailOtp.findOneAndUpdate(
        { email, type: "email_verification" },
        { email, otp: hashedOtp, type: "email_verification", expiresAt },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await emailService.sendMail({
        to: email,
        subject: "Verify your email",
        template: MailTemplate.VERIFICATION,
        data: {
            email,
            name: firstname,
            otp,
        },
    });

    return new AppResponse(201, "Registration successful. Please verify your email.", null).send(res);
};

export const verifyEmail = async (req: Request, res: Response) => {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join(", ");
        throw new AppError(400, `Validation error: ${message}`);
    }

    const { email, otp } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) throw new AppError(404, "User not found");

    if (user.emailVerified) {
        return new AppResponse(200, "Email already verified", null).send(res);
    }

    const otpDoc = await EmailOtp.findOne({ email, type: "email_verification" });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
        throw new AppError(400, "OTP expired or invalid");
    }

    const isMatch = await argon2.verify(otpDoc.otp, otp);
    if (!isMatch) {
        throw new AppError(400, "Invalid OTP");
    }

    user.emailVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
    await otpDoc.deleteOne();

    (req as any).session.user = { id: String(user._id), email: user.email };

    const data = {
        id: String(user._id),
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        address: user.address,
        emailVerified: user.emailVerified,
        updatadAt: user.updatedAt
    };

    return new AppResponse(200, "Email verified successfully", data).send(res);
};

export const sendVerifyEmail = async (req: Request, res: Response) => {
    const { email } = req.body;

    const validate = z.email("Invalid email address").safeParse(email);

    if (!validate.success) {
        const message = validate.error.issues.map((i) => i.message).join(", ");
        throw new AppError(400, `Validation error: ${message}`);
    }

    const user = await User.findOne({ email: validate.data });
    if (!user) throw new AppError(404, "User not found");

    if (user.emailVerified) {
        return new AppResponse(200, "Email already verified", null).send(res);
    }

    const otp = generateOtp();
    const hashedOtp = await argon2.hash(otp);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await EmailOtp.findOneAndUpdate(
        { email, type: "email_verification" },
        { email, otp: hashedOtp, type: "email_verification", expiresAt },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await emailService.sendMail({
        to: email,
        subject: "Verify your email",
        template: MailTemplate.VERIFICATION,
        data: {
            email,
            name: user.firstname,
            otp,
        },
    });

    return new AppResponse(200, "Verification email sent successfully", null).send(res);
}


export const login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join(", ");
        throw new AppError(400, `Validation error: ${message}`);
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) throw new AppError(401, "Invalid credentials");

    if (!user.emailVerified) {
        throw new AppError(403, "Please verify your email before logging in");
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
        throw new AppError(401, "Invalid credentials");
    }

    if (!user.twoFactorEnabled) {
        user.lastLoginAt = new Date();
        await user.save();

        const data = {
            id: String(user._id),
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            lastLoginAt: user.lastLoginAt,
            twoFactorEnabled: user.twoFactorEnabled,
            createdAt: user.createdAt,
            address: user.address,
            emailVerified: user.emailVerified,
            updatadAt: user.updatedAt
        };

        (req as any).session.user = { id: String(user._id), email: user.email };

        return new AppResponse(200, "Login successful", data).send(res);
    }

    // twoFactorEnabled == true
    const otp = generateOtp();
    const hashedOtp = await argon2.hash(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await EmailOtp.findOneAndUpdate(
        { email, type: "login_2fa" },
        { otp: hashedOtp, type: "login_2fa", expiresAt },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await user.save();

    await emailService.sendMail({
        to: email,
        subject: "Your login verification code",
        template: MailTemplate.LOGIN_2FA,
        data: {
            email,
            name: user.firstname,
            otp,
        },
    });

    return new AppResponse(200, "Code sent to your email", { twoFactorEnabled: true }).send(res);
};

export const verifyTwoFactor = async (req: Request, res: Response) => {
    const parsed = verify2FASchema.safeParse(req.body);
    if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join(", ");
        throw new AppError(400, `Validation error: ${message}`);
    }

    const { email, otp } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) throw new AppError(404, "User not found");

    if (!user.twoFactorEnabled) {
        throw new AppError(400, "2FA is not enabled for this account");
    }

    const otpDoc = await EmailOtp.findOne({ email, type: "login_2fa" });

    if (!otpDoc || otpDoc.expiresAt < new Date()) {
        throw new AppError(400, "OTP expired or invalid");
    }

    const isMatch = await argon2.verify(otpDoc.otp, otp);
    if (!isMatch) {
        await user.save();
        throw new AppError(400, "Invalid OTP");
    }

    await otpDoc.deleteOne();

    user.lastLoginAt = new Date();
    await user.save();

    (req as any).session.user = { id: String(user._id), email: user.email };

    const data = {
        id: String(user._id),
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        address: user.address,
        emailVerified: user.emailVerified,
        updatadAt: user.updatedAt
    };

    return new AppResponse(200, "2FA verified, login successful", data).send(res);
};

export const logout = async (req: Request, res: Response) => {
    const session = (req as any).session;
    if (!session) {
        return new AppResponse(200, "Logged out", null).send(res);
    }

    session.destroy((error: any) => {
        if (error) {
            throw new AppError(500, "Something went wrong")
        }

        return new AppResponse(200, "Logged out successfully", null).send(res);
    });
};
