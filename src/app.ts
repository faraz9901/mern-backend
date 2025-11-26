import express from 'express';
import { errorHandler } from './lib/responses';
import cors from 'cors'
import config from './config';
import { sessionMiddleware } from './middlewares/session.middleware';
import helmet from 'helmet';

const app = express();

app.use(express.json());
app.use(helmet());

app.use(sessionMiddleware);

app.use(cors({
    origin: config.allowedOrigins,
    credentials: true
}));


app.use(errorHandler);

export default app;