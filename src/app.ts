import express from 'express';
import { errorHandler } from './lib/responses';
import cors from 'cors'
import config from './config';
import { sessionMiddleware } from './middlewares/session.middleware';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';

const app = express();

app.use(express.json());

app.use(sessionMiddleware);

app.use(cors({
    origin: config.allowedOrigins,
    credentials: true
}));

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

app.use(errorHandler);

export default app;