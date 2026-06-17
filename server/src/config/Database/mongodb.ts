import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const uri = process.env.MongoDB_URI;
        if (!uri) throw new Error('MongoDB_URI environment variable is not set');
        await mongoose.connect(uri);
        console.log("Mongodb connected")

    } catch (error) {
        console.error("Mongodb failed to connect:", error);
        throw error;
    }
}

export default connectDB;