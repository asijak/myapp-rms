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

    // 🔒 Master Lock: Unlimited edits allowed UNTIL this is true
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── Verification Checklist (HR vs Physical Copies) ──
    verificationChecklist: {
      education:   { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      training:    { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      experience:  { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      eligibility: { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
      performance: { checked: { type: Boolean, default: false }, note: { type: String, default: "" } },
    },

    /**
     * SECTION A: APPLICANT DATA (Snapshot from Profile)
     * These fields are filled from the Profile model but stored here.
     */
    applicantData: {
      personalInfo: { type: mongoose.Schema.Types.Mixed },
      education: [
        {
          level: {
            type: String,
            enum: ["Vocational", "Bachelor", "Masteral", "Doctorate"],
          },
          degree: String,
          units: Number,
          school: String,
          yearGraduated: Number,
        },
      ],
      eligibility: [
        {
          name:        String,
          placeOfExam: String,
          dateOfExam:  Date,
          rating:      String,
        },
      ],
      training: [
        {
          title: String,
          hours: Number,
          dateIssued: Date,
          provider: String,
        },
      ],
      experience: [
        {
          position: String,
          company: String,
          months: Number,
          isGovernment: { type: Boolean, default: false },
        },
      ],
      performanceRating: {
        score: Number, // e.g., 4.500
        adjective: String, // e.g., "Very Satisfactory"
        periodCovered: String,
      },
    },

    /**
     * SECTION B: HR RATING (Point System - DepEd MSP)
     */
    hrRating: {
      educationPoints: { type: Number, default: 0 },
      trainingPoints: { type: Number, default: 0 }, // Only last 5 years
      experiencePoints: { type: Number, default: 0 },
      performancePoints: { type: Number, default: 0 }, // Recent 1 year
      outstandingAccomplishments: { type: Number, default: 0 },
      appEducationPoints: { type: Number, default: 0 },
      appLearningPoints: { type: Number, default: 0 },
      potentialPoints: {
        writtenTest: { type: Number, default: 0 },
        bei: { type: Number, default: 0 }, // Behavioral Event Interview
        workSample: { type: Number, default: 0 },
      },
      remarks: String,
    },

    // ── Evaluation (HR Rating phase, post-verification) ──
    isEvaluated: { type: Boolean, default: false },
    evaluatedAt: Date,
    evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Per-item relevance flags set by the rater during evaluation
    itemRelevance: {
      education:   [{ index: Number, isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } }],
      eligibility: [{ index: Number, isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } }],
      training:    [{ index: Number, isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } }],
      experience:  [{ index: Number, isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } }],
      performance: { isRelevant: { type: Boolean, default: true }, note: { type: String, default: "" } },
    },

    totalScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "applied",
        "verifying",
        "comparative_assessment",
        "ranked",
        "disqualified",
      ],
      default: "applied",
    },
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

/**
 * 🔹 AUTO-INCREMENT CODE: APP-POSITIONCODE-<jobId4>-0001
 * jobId4 = last 4 hex chars of the job's _id, ensuring uniqueness
 * even when the same positionCode is reused across different job postings.
 */
applicationSchema.pre("save", async function () {
  if (this.isNew && !this.applicationCode) {
    const jobSuffix = this.submittedTo.toString().slice(-4).toUpperCase();

    const count = await mongoose.model("Application").countDocuments({
      submittedTo: this.submittedTo,
    });
    this.applicationCode = `APP-${jobSuffix}-${String(count + 1).padStart(4, "0")}`;
  }

  // AUTO-CALCULATE TOTAL SCORE
  const r = this.hrRating;
  if (r) {
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
