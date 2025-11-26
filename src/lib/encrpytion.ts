import crypto from "crypto";
import config from "../config";

export class Encryption {
    public static encrypt(value: string): string {
        if (!value) return value;
        const cipher = crypto.createCipheriv(
            "aes-256-ctr",
            Buffer.from(config.encryptionKey, "hex"),
            Buffer.from(config.encryptionIV, "hex")
        );
        const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
        return encrypted.toString("hex");
    }

    public static decrypt = (value: string) => {
        if (!value) return value;
        const decipher = crypto.createDecipheriv(
            "aes-256-ctr",
            Buffer.from(config.encryptionKey, "hex"),
            Buffer.from(config.encryptionIV, "hex")
        );
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(value, "hex")),
            decipher.final(),
        ]);
        return decrypted.toString();
    };
}

