import mongoose from "mongoose";
import config from "../config";


const connectToDB = async () => {
    try {
        await mongoose.connect(config.mongoUrl);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}


export { connectToDB }