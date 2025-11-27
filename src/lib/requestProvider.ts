import { AppRequest } from "../types";

const getAppRequest = (req: unknown): AppRequest => {

    if (typeof req === "object" && req !== null && "session" in req) {
        return req as AppRequest;
    }

    throw new Error("Invalid request");
}

export { getAppRequest }