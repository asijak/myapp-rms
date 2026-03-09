import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicationCode: { type: String, unique: true, index: true },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    category: {
      type: String,
      enum: ["teaching", "teaching_related", "non_teaching"],
      required: true,
    },

    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    verificationChecklist: {
      education:   { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      training:    { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      experience:  { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      eligibility: { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      performance: { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
    },

    applicantData: {
      personalInfo: { type: mongoose.Schema.Types.Mixed },
      education: [],
      eligibility: [],
      training: [],
      experience: [],
      performanceRating: {},
    },

    hrRating: {
      educationPoints: { type: Number, default: 0 },
      trainingPoints: { type: Number, default: 0 },
      experiencePoints: { type: Number, default: 0 },
      performancePoints: { type: Number, default: 0 },
      outstandingAccomplishments: { type: Number, default: 0 },
      appEducationPoints: { type: Number, default: 0 },
      appLearningPoints: { type: Number, default: 0 },
      potentialPoints: {
        writtenTest: { type: Number, default: 0 },
        bei: { type: Number, default: 0 },
        workSample: { type: Number, default: 0 },
      },
      remarks: String,
    },

    isEvaluated: { type: Boolean, default: false },
    evaluatedAt: Date,
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    totalScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "applied",
        "verifying",
        "comparative_assessment",
        "ranked",
        "disqualified",
        "appointed",
      ],
      default: "applied",
    },
    appointmentData: {
      dateAppointed: Date,
      effectiveDate: Date,
      itemNumber: String,
      remarks: String,
    },
    attachments: [
      {
        type: { type: String, enum: ["transcript", "diploma", "eligibility", "training", "experience", "pds_signed", "id_proof"] },
        fileUrl: String,
        fileName: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    isQualified: { type: Boolean, default: true },
    disqualificationReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

applicationSchema.pre("save", async function () {
  if (this.isNew && !this.applicationCode) {
    const jobSuffix = this.submittedTo.toString().slice(-4).toUpperCase();
    const count = await mongoose.model("Application").countDocuments({
      submittedTo: this.submittedTo,
    });
    this.applicationCode = `APP-${jobSuffix}-${String(count + 1).padStart(4, "0")}`;
  }

  if (this.hrRating) {
    const r = this.hrRating;
    this.totalScore =
      (r.educationPoints || 0) +
      (r.trainingPoints || 0) +
      (r.experiencePoints || 0) +
      (r.performancePoints || 0) +
      (r.outstandingAccomplishments || 0) +
      (r.appEducationPoints || 0) +
      (r.appLearningPoints || 0) +
      (r.potentialPoints?.writtenTest || 0) +
      (r.potentialPoints?.bei || 0) +
      (r.potentialPoints?.workSample || 0);
  }
});

export default mongoose.model("Application", applicationSchema);
