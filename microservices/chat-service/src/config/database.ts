import mongoose from "mongoose";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const connectDB = async (attempts = 5) => {
    const uri = process.env.MongoDB_URI;
    if (!uri) throw new Error("MongoDB_URI environment variable is not set");

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 10000,
            });
            console.log("✅ MongoDB connected");
            return;
        } catch (error) {
            if (attempt === attempts) {
                console.error(`❌ MongoDB failed to connect after ${attempts} attempts:`, error);
                throw error;
            }
            console.warn(`⚠️ MongoDB connection attempt ${attempt}/${attempts} failed, retrying in ${attempt * 2}s...`);
            await sleep(attempt * 2000);
        }
    }
};

export default connectDB;