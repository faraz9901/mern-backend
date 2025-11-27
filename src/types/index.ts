import { Session } from "express-session"

interface AppSession extends Session {
    user?: {
        id: string,
        email: string
    }
}

export interface AppRequest extends Request {
    session: AppSession
}