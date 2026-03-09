import Joi from "joi";

export const userValidator = {
  toggleStatusSchema: Joi.object({
    isActive: Joi.boolean().required().messages({
      "any.required": "User status is required.",
      "boolean.base": "Status must be a valid true or false value.",
    }),
  }),
};
