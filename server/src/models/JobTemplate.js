import mongoose from "mongoose";

const jobTemplateSchema = new mongoose.Schema(
  {
    positionTitle: { type: String, required: true, trim: true },
    positionCode:  { type: String, required: true, uppercase: true, trim: true },
    description:   { type: String, default: "" },

    qualifications: {
      education:             { type: String, default: "" },
      experience:            { type: String, default: "" },
      minExperienceMonths:   { type: Number, default: 0 },
      trainings:             { type: String, default: "" },
      minTrainingHours:      { type: Number, default: 0 },
      eligibility:           { type: String, default: "" },
      competencyRequirements: [{ type: String }],
    },

    salary:         { type: Number, default: 0 },
    salaryGrade:    { type: Number, default: 1 },
    employmentType: {
      type: String,
      enum: ["permanent", "contractual", "job order", "casual"],
      default: "permanent",
    },
    hiringTrack: {
      type: String,
      enum: ["teaching", "teaching_related", "non_teaching"],
      required: true,
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("JobTemplate", jobTemplateSchema);
