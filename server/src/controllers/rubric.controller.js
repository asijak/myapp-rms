import Rubric from "../models/Rubric.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";

const CATEGORIES = ["teaching", "teaching_related", "non_teaching"];

// GET /api/v1/rubrics — return all three rubrics (create defaults if missing)
export const getAllRubrics = catchAsync(async (req, res) => {
  // Ensure all three categories exist
  await Promise.all(
    CATEGORIES.map((cat) =>
      Rubric.findOneAndUpdate(
        { category: cat },
        { $setOnInsert: { category: cat } },
        { upsert: true, new: true },
      ),
    ),
  );

  const rubrics = await Rubric.find({ category: { $in: CATEGORIES } });
  res.status(200).json({ status: "success", data: rubrics });
});

// GET /api/v1/rubrics/:category
export const getRubricByCategory = catchAsync(async (req, res, next) => {
  const { category } = req.params;

  if (!CATEGORIES.includes(category)) {
    return next(new AppError(`Invalid category. Must be one of: ${CATEGORIES.join(", ")}`, 400));
  }

  const rubric = await Rubric.findOneAndUpdate(
    { category },
    { $setOnInsert: { category } },
    { upsert: true, new: true },
  );

  res.status(200).json({ status: "success", data: rubric });
});

// PUT /api/v1/rubrics/:category — upsert weights for a category
export const upsertRubric = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const { weights, active } = req.body;

  if (!CATEGORIES.includes(category)) {
    return next(new AppError(`Invalid category. Must be one of: ${CATEGORIES.join(", ")}`, 400));
  }

  const updatePayload = {};
  if (weights !== undefined) updatePayload.weights = weights;
  if (active  !== undefined) updatePayload.active  = active;

  const rubric = await Rubric.findOneAndUpdate(
    { category },
    { $set: updatePayload },
    { upsert: true, new: true, runValidators: false },
  );

  res.status(200).json({ status: "success", data: rubric });
});
