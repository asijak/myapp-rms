import Joi from "joi";

export const jobSchema = Joi.object({
  positionTitle: Joi.string().required().min(3),
  positionCode: Joi.string().required(),
  description: Joi.string().allow("").default(""),

  // Qualification Standards (QS)
  education: Joi.string().allow("").default(""),
  experience: Joi.string().allow("").default(""),
  minExperienceMonths: Joi.number().min(0).default(0),
  trainings: Joi.string().allow("").default(""),
  minTrainingHours: Joi.number().min(0).default(0),
  eligibility: Joi.array().items(Joi.string()).default([]),
  competencyRequirements: Joi.array().items(Joi.string()).default([]),

  itemNumbers: Joi.array().items(Joi.string()).default([]),
  salary: Joi.number().positive().required(),
  salaryGrade: Joi.number().integer().min(1).max(33).required(),
  placeOfAssignment: Joi.array().items(Joi.string().trim()).min(1).required(),
  employmentType: Joi.string().valid("permanent", "contractual", "job order", "casual"),
  hiringTrack: Joi.string().valid("teaching", "teaching_related", "non_teaching").required(),
  hideVacancyCount: Joi.boolean().default(false),
  status: Joi.string().valid("draft", "published", "closed", "archived"),
  deadline: Joi.date().allow(null, ""),
});

export const jobUpdateSchema = Joi.object({
  positionTitle: Joi.string().min(3),
  positionCode: Joi.string(),
  description: Joi.string().allow(""),

  // Qualification Standards (QS)
  education: Joi.string().allow(""),
  experience: Joi.string().allow(""),
  minExperienceMonths: Joi.number().min(0),
  trainings: Joi.string().allow(""),
  minTrainingHours: Joi.number().min(0),
  eligibility: Joi.array().items(Joi.string()),
  competencyRequirements: Joi.array().items(Joi.string()),

  itemNumbers: Joi.array().items(Joi.string()),
  salary: Joi.number().positive(),
  salaryGrade: Joi.number().integer().min(1).max(33),
  placeOfAssignment: Joi.array().items(Joi.string().trim()),
  employmentType: Joi.string().valid("permanent", "contractual", "job order", "casual"),
  hiringTrack: Joi.string().valid("teaching", "teaching_related", "non_teaching"),
  hideVacancyCount: Joi.boolean(),
  status: Joi.string().valid("draft", "published", "closed", "archived"),
  deadline: Joi.date().allow(null, ""),
});
