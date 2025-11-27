import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
    status: number;
    success: boolean
    constructor(status: number, message: string) {
        super(message);
        this.success = false
        this.status = status;
    }
}


export class AppResponse {
    success: boolean
    status: number
    message: string
    data: any


    constructor(status: number, message: string, data: any) {
        this.success = true
        this.status = status
        this.message = message
        this.data = data
    }

    send(res: Response) {
        return res.status(this.status).json({
            success: this.success,
            status: this.status,
            message: this.message,
            content: this.data
        });
    }
}


export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    console.log(err);

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: err.issues.map((i) => i.message).join(", "),
        });
    }

    if (err instanceof AppError) {
        return res.status(err.status).json({
            success: err.success,
            status: err.status,
            message: err.message,
        });
    }

    res.status(500).json({
        success: false,
        message: 'Something went wrong! Please try again',
        status: 500
    });
};