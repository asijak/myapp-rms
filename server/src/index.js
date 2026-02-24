import dotenv from "dotenv";
dotenv.config();

console.log("ENV CHECK:", {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_URL: process.env.CLIENT_URL,
  PORT: process.env.PORT,
});
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import "./config/passport.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);

connectDB();

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});
