export interface AppRequest extends Request {
    session: {
        user: {
            id: string,
            email: string
        }
    }
}