import Application from "../models/Application.js";
import Profile from "../models/Profile.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const createApplication = catchAsync(async (req, res, next) => {
  const { jobId, category } = req.body;

  // 1. Fetch the user's Profile
  const profile = await Profile.findOne({ user: req.user._id });
  if (!profile) {
    return next(
      new AppError("Please complete your Profile before applying.", 400),
    );
  }

  // 2. Create the application using Profile data as the initial snapshot
  const newApplication = await Application.create({
    submittedBy: req.user._id,
    submittedTo: jobId,
    category,
    applicantData: {
      personalInfo: profile.toObject(), // Copies the data
      education: profile.education || [],
      training: profile.training || [],
      experience: profile.experience || [],
      performanceRating: profile.performanceRating || {},
    },
  });

  res.status(201).json({ status: "success", data: newApplication });
});
