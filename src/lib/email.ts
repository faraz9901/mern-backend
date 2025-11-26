import nodemailer, { Transporter } from "nodemailer";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import ejs from "ejs";
import config from "../config";


export enum MailTemplate {
    VERIFICATION = "verification",
    LOGIN_2FA = "login_2fa",
}

export type MailDataMap = {
    [MailTemplate.VERIFICATION]: z.infer<typeof mailSchemas[MailTemplate.VERIFICATION]>;
    [MailTemplate.LOGIN_2FA]: z.infer<typeof mailSchemas[MailTemplate.LOGIN_2FA]>;
};

const otpMailSchema = z.object({
    email: z.email("Invalid email address"),
    name: z.string("Name is required"),
    otp: z.string().length(6, "OTP must be 6 digits"),
})


export const mailSchemas = {
    [MailTemplate.VERIFICATION]: otpMailSchema,
    [MailTemplate.LOGIN_2FA]: otpMailSchema,
};


interface EmailOptions<T extends MailTemplate> {
    to: string;
    subject: string;
    template: T;
    data: MailDataMap[T];
}

export class EmailService {
    private transporter: Transporter | null = null;
    private isDev: boolean;

    constructor() {
        this.isDev = config.nodeEnv !== "production";
        this.init();
    }

    async init(): Promise<Transporter> {
        if (this.transporter) this.transporter

        if (this.isDev) {
            const testAccount = await nodemailer.createTestAccount();
            const transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });

            console.log("📬 EmailService running in DEV mode (Ethereal)");
            this.transporter = transporter;
            return transporter

        } else {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: config.gmailUser,
                    pass: config.gmailPass,
                },
            });
            console.log("📨 EmailService running in PROD mode (Gmail SMTP)");
            this.transporter = transporter;
            return transporter
        }
    }

    private async renderTemplate(templateName: MailTemplate, data: Record<string, any>) {
        const templatePath = path.join(__dirname, "..", "templates", `${templateName}.ejs`);
        const template = await fs.readFile(templatePath, "utf8");
        return ejs.render(template, data);
    }


    async sendMail<T extends MailTemplate>({ to, subject, template, data }: EmailOptions<T>) {
        let transporter = await this.init()

        // ✅ Validate template data
        const schema = mailSchemas[template];
        const parsed = schema.safeParse(data);

        if (!parsed.success) {
            const errMsg = parsed.error.issues.map((e) => e.message).join(", ");
            throw new Error(`Invalid data for template '${template}': ${errMsg}`);
        }

        const html = await this.renderTemplate(template, parsed.data);

        const info = await transporter.sendMail({
            from: `MERN-PROJECT <${config.gmailUser}>`,
            to,
            subject,
            html,
        });

        if (this.isDev) console.log("📩 Preview URL:", nodemailer.getTestMessageUrl(info));

        return info;
    }
}

export const emailService = new EmailService();
