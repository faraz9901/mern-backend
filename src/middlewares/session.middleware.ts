import session from "express-session";
import MongoStore from "connect-mongo";
import config from "../config";

export const sessionMiddleware = session({
    secret: config.sessionSecret,
    resave: false, // avoids rewriting session if not changed
    saveUninitialized: false, // don’t create empty sessions
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: config.nodeEnv === "production",
        sameSite: "lax",
    },
    store: MongoStore.create({
        mongoUrl: config.mongoUrl,
        collectionName: "sessions",
        ttl: 60 * 60 * 24, // 1 day
    }),
});
