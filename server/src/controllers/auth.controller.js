import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/token.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already used" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({ name, email, password: hashed });
  const token = generateToken(user._id);

  res.json({ user, token });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password || "");
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = generateToken(user._id);
  res.json({ user, token });
};

export const googleSuccess = (req, res) => {
  if (!req.user) {
    console.error("Google OAuth failed: req.user is undefined");
    return res.redirect(`${process.env.CLIENT_URL}/auth/login`);
  }

  const token = generateToken(req.user._id);

  console.log("Google OAuth success → redirecting to Vue app");

  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
};
