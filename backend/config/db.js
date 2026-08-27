import mongoose from "mongoose";
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config({
    path: join(dirname(fileURLToPath(import.meta.url)), '../.env')
});

const connectDb = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not configured');
        }

        const conn = await mongoose.connect(mongoUri);
        console.log(`Mongodb connected: ${conn.connection.host}`);
    }
    catch(error) {
        console.log("Connection failed : ", error.message);
        process.exit(1);
    }

};
export default connectDb;