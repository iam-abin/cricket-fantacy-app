import mongoose from "mongoose";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("connected to mongodb...");
    } catch (error) {
        console.log(error);
        throw new Error("database connection failed!");
    }
};

export { connectDb };

