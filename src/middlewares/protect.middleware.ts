import { RequestHandler } from "express";
import { AppError } from "../lib/responses";
import { getAppRequest } from "../lib/requestProvider";

export const protect: RequestHandler = (req, res, next) => {
    const { session } = getAppRequest(req);

    if (session.user?.id) return next();

    throw new AppError(401, "You are not logged in! Please log in to get access.")
};
