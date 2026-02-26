import * as authService from "../services/auth.service.js";
import sendEmail from "../services/email.service.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const sendTokenCookie = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req, res, next) => {
  try {
    const { user, rawOtp } = await authService.registerUserLogic(req.body);
    await sendEmail({
      email: user.email,
      subject: "Verify Your Account",
      html: `<h2>Your OTP is: ${rawOtp}</h2><p>Valid for 10 minutes.</p>`,
    });
    res.status(201).json({ message: "OTP sent to email" });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req, res, next) => {
  try {
    const user = await authService.verifyOTPLogic(req.body.email, req.body.otp);
    const populatedUser = await User.findById(user._id).populate("roles");

    sendTokenCookie(res, populatedUser);
    res.status(200).json({
      message: "Success",
      user: {
        id: populatedUser._id,
        username: populatedUser.username,
        email: populatedUser.email,
        roles: populatedUser.roles.map((r) => r.name),
        avatar: populatedUser.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUserLogic(email, password);
    sendTokenCookie(res, user);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles.map((r) => r.name),
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuthCallback = (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/auth/login?error=auth_failed`,
      );
    }

    sendTokenCookie(res, req.user);

    const roleNames = req.user.roles.map((r) => r.name);
    const redirectTarget = roleNames.some((name) => name !== "user")
      ? "admin"
      : "user";

    res.redirect(`${process.env.CLIENT_URL}/${redirectTarget}/dashboard`);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not logged in" });
    }

    res.status(200).json({
      status: "success",
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        roles: req.user.roles.map((r) => r.name),
        avatar: req.user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  try {
    res.cookie("token", "loggedout", {
      httpOnly: true,
      expires: new Date(Date.now() + 10 * 1000),
    });
    res.status(200).json({ message: "Logged out" });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { username } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { username },
      { new: true, runValidators: true },
    ).populate("roles");

    res.status(200).json({
      status: "success",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        roles: updatedUser.roles.map((r) => r.name),
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};
