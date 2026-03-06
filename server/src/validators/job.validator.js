import Joi from "joi";

export const jobSchema = Joi.object({
  positionTitle: Joi.string().required().min(3),
  positionCode: Joi.string().required(),
  description: Joi.string().required(),
  education: Joi.string().required(),
  experience: Joi.string().required(),
  trainings: Joi.string().required(),
  eligibility: Joi.string().required(),
  itemNumbers: Joi.array().items(Joi.string()).min(1).required(),
  salary: Joi.number().positive().required(),
  salaryGrade: Joi.number().integer().min(1).max(33).required(),
  placeOfAssignment: Joi.string().required(),
  employmentType: Joi.string().valid("permanent", "contractual", "job order", "casual"),
  hiringTrack: Joi.string().valid("teaching", "teaching_related", "non_teaching").required(),
  status: Joi.string().valid("draft", "published", "closed", "archived"),
  deadline: Joi.date().allow(null, ""),
});

export const jobUpdateSchema = Joi.object({
  positionTitle: Joi.string().min(3),
  positionCode: Joi.string(),
  description: Joi.string(),
  education: Joi.string(),
  experience: Joi.string(),
  trainings: Joi.string(),
  eligibility: Joi.string(),
  itemNumbers: Joi.array().items(Joi.string()).min(1),
  salary: Joi.number().positive(),
  salaryGrade: Joi.number().integer().min(1).max(33),
  placeOfAssignment: Joi.string(),
  employmentType: Joi.string().valid("permanent", "contractual", "job order", "casual"),
  hiringTrack: Joi.string().valid("teaching", "teaching_related", "non_teaching"),
  status: Joi.string().valid("draft", "published", "closed", "archived"),
  deadline: Joi.date().allow(null, ""),
});
