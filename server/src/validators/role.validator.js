import Joi from "joi";

export const roleValidator = {
  createOrUpdateSchema: Joi.object({
    name: Joi.string()
      .min(3)
      .max(30)
      .trim()
      .lowercase()
      .replace(/\s+/g, "_")
      .required()
      .messages({
        "string.min": "Role name must be at least 3 characters long.",
        "string.empty": "Role name cannot be empty.",
        "any.required": "Role name is required.",
      }),
    permissions: Joi.array().items(Joi.string().trim()).default([]),
  }),
};
