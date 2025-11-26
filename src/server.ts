import app from './app';
import config from './config';
import { connectToDB } from './lib/db';

app.listen(config.port, () => {
    connectToDB().then(() => {
        console.log(`Server running on port ${config.port}`);
    });
})