import { Response, RequestHandler, Request } from "express";
import User from "../models/user.schema";
import { AppError, AppResponse } from "../lib/responses";
import { updateProfileSchema } from "../lib/validation";
import { getAppRequest } from "../lib/requestProvider";

const getSessionUser = (req: Request) => getAppRequest(req).session.user

export const getMe: RequestHandler = async (req: Request, res: Response) => {
    const sessionUser = getSessionUser(req);

    if (!sessionUser) {
        throw new AppError(401, "Not authenticated");
    }

    const user = await User.findById(sessionUser.id);
    if (!user) {
        throw new AppError(404, "User not found");
    }

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

    return new AppResponse(200, "User fetched", data).send(res);
};


export const updateProfile = async (req: Request, res: Response) => {
    const sessionUser = getSessionUser(req);

    if (!sessionUser) {
        throw new AppError(401, "Not authenticated");
    }

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join(", ");
        throw new AppError(400, `Validation error: ${message}`);
    }

    const user = await User.findById(sessionUser.id);
    if (!user) {
        throw new AppError(404, "User not found");
    }

    const { firstname, lastname, address } = parsed.data;

    if (firstname !== undefined) user.firstname = firstname;
    if (lastname !== undefined) user.lastname = lastname;
    if (address !== undefined) user.address = address;

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

    return new AppResponse(200, "Profile updated", data).send(res);
};

export const enableTwoFactor = async (req: Request, res: Response) => {
    const sessionUser = getSessionUser(req);
    if (!sessionUser) {
        throw new AppError(401, "Not authenticated");
    }

    const user = await User.findById(sessionUser.id);
    if (!user) {
        throw new AppError(404, "User not found");
    }

    user.twoFactorEnabled = true;
    await user.save();

    return new AppResponse(200, "Two-factor authentication enabled", null).send(res);
};

export const disableTwoFactor = async (req: Request, res: Response) => {
    const sessionUser = getSessionUser(req);

    if (!sessionUser) {
        throw new AppError(401, "Not authenticated");
    }

    const user = await User.findById(sessionUser.id);
    if (!user) {
        throw new AppError(404, "User not found");
    }

    user.twoFactorEnabled = false;
    await user.save();

    return new AppResponse(200, "Two-factor authentication disabled", null).send(res);
};
