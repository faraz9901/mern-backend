import { NextFunction, Request, Response } from "express";
import { AppRequest } from "../types";
import { AppError } from "../lib/responses";

export const protect = (req: AppRequest, res: Response, next: NextFunction) => {
    if (req.session.user) {
        next();
    } else {
        throw new AppError(401, 'You are not logged in! Please log in to get access.');
    }
};
