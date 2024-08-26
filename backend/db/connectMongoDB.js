import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected : ${conn.connection.message}`);
  } catch (error) {
    console.error(`Error connecting to mongoDB: ${error.message}`);
  }
};

export default connectMongoDB;