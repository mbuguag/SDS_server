import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {

    private transporter;
    private logger = new Logger(MailService.name);

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.NODE_ENV === 'production', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendMail(to: string, subject: string, html: string) {


        const info = await this.transporter.sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            html,
        });

        this.logger.log(`Email sent to ${to}`);


        if (process.env.NODE_ENV !== 'production') {
            this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
    }
}
