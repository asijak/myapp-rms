import Job from "../models/Job.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

export const createJob = catchAsync(async (req, res, next) => {
  // QS fields are nested in the model but flat in the validator/req.body
  const jobData = {
    ...req.body,
    qualifications: {
      education: req.body.education,
      experience: req.body.experience,
      trainings: req.body.trainings,
      eligibility: req.body.eligibility,
    },
    publishedBy: req.user._id,
  };

  const newJob = await Job.create(jobData);
  res.status(201).json({ status: "success", data: newJob });
});

export const getAllJobs = catchAsync(async (req, res, next) => {
  // Advanced Filtering (Category, Status, Search)
  const queryObj = { ...req.query };
  const excludeFields = ["page", "sort", "limit", "fields", "search"];
  excludeFields.forEach((el) => delete queryObj[el]);

  let query = Job.find(queryObj);

  // Text Search for Position Title
  if (req.query.search) {
    query = query.find({
      positionTitle: { $regex: req.query.search, $options: "i" },
    });
  }

  const jobs = await query.populate("publishedBy", "username");
  res.status(200).json({ status: "success", results: jobs.length, data: jobs });
});

export const getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate("applications");
  if (!job) return next(new AppError("Job not found", 404));
  res.status(200).json({ status: "success", data: job });
});

export const updateJob = catchAsync(async (req, res, next) => {
  const updateData = { ...req.body };

  // Re-nest qualifications if any QS fields are present
  const qsFields = ["education", "experience", "trainings", "eligibility"];
  const hasQs = qsFields.some((f) => updateData[f] !== undefined);
  if (hasQs) {
    updateData.qualifications = {};
    qsFields.forEach((f) => {
      if (updateData[f] !== undefined) {
        updateData.qualifications[f] = updateData[f];
        delete updateData[f];
      }
    });
  }

  const job = await Job.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!job) return next(new AppError("Job not found", 404));
  res.status(200).json({ status: "success", data: job });
});

export const deleteJob = catchAsync(async (req, res, next) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) return next(new AppError("Job not found", 404));
  res.status(204).send();
});
