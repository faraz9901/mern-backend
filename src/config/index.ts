import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number;
    nodeEnv: string;
    allowedOrigins: string[];
    mongoUrl: string
    sessionSecret: string
    encryptionKey: string
    encryptionIV: string
    gmailUser: string
    gmailPass: string
}


const config: Config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    mongoUrl: process.env.MONGO_URI || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    encryptionIV: process.env.ENCRYPTION_IV || '',
    gmailUser: process.env.GMAIL_PASSWORD || '',
    gmailPass: process.env.GMAIL_ADDRESS || '',
};



Object.entries(config).forEach(([key, value]) => {
    if (!value) {
        console.error(`Missing environment variable: ${key}`);
        process.exit(1);
    }

    if (Array.isArray(value) && value.length === 0) {
        console.error(`Environment variable ${key} is empty`);
        process.exit(1);
    }
});



export default config;