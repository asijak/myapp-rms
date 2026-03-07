import Profile from "../models/Profile.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const getMyProfile = catchAsync(async (req, res) => {
  const profile = await Profile.findOne({ user: req.user._id });
  res.status(200).json({ status: "success", data: profile || null });
});

export const upsertMyProfile = catchAsync(async (req, res) => {
  const { name } = req.body;

  if (!name?.firstName?.trim() || !name?.lastName?.trim()) {
    throw new AppError("First name and last name are required.", 400);
  }

  const profile = await Profile.findOneAndUpdate(
    { user: req.user._id },
    { $set: { ...req.body, user: req.user._id } },
    { new: true, upsert: true, runValidators: false },
  );

  res.status(200).json({ status: "success", data: profile });
});
