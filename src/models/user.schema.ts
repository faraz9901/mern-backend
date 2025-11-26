import mongoose from "mongoose";
import { Encryption } from "../lib/encrpytion";

const UserSchema = new mongoose.Schema(
    {
        firstname: {
            type: String,
            required: true,
            trim: true,
            set: Encryption.encrypt,
            get: Encryption.decrypt,
        },

        lastname: {
            type: String,
            default: "",
            trim: true,
            set: Encryption.encrypt,
            get: Encryption.decrypt,
        },

        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true,
        },

        password: { type: String, required: true },

        emailVerified: {
            type: Boolean,
            default: false,
        },

        twoFactorEnabled: {
            type: Boolean,
            default: false,
        },

        // profile fields
        address: { type: String, default: "", set: Encryption.encrypt, get: Encryption.decrypt },

        lastLoginAt: { type: Date },

    },
    {
        timestamps: true,
    }
);


UserSchema.index({ email: 1 });

export default mongoose.model("User", UserSchema);
