import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Drop legacy unique index on positionCode (allows multiple postings per position)
    try {
      await conn.connection.collection("jobs").dropIndex("positionCode_1");
      console.log("✅ Dropped legacy unique index: jobs.positionCode_1");
    } catch (_) {
      // Index doesn't exist or already dropped — safe to ignore
    }
  } catch (error) {
    console.error(`❌ DB Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
