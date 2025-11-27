import { z } from "zod";

const passwordValidation = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")

const otpValidation = z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only digits")

export const registerSchema = z.object({
    firstname: z.string().min(1, "First name is required"),
    lastname: z.string().optional(),
    email: z.email("Invalid email address"),
    password: passwordValidation,
    address: z.string().optional(),
});

export const verifyEmailSchema = z.object({
    email: z.email("Invalid email address"),
    otp: otpValidation,
});

export const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: passwordValidation,
});

export const verify2FASchema = z.object({
    email: z.email("Invalid email address"),
    otp: otpValidation,
});

export const updateProfileSchema = z
    .object({
        firstname: z.string().min(1, "First name is required").optional(),
        lastname: z.string().optional(),
        address: z.string().optional(),
    })

