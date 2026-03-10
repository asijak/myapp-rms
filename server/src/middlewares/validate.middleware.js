import AppError from "../utils/AppError.js";

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    // 🎨 Format Joi error messages to be human-friendly for Toasts
    const errors = error.details.map((el) => {
      // Convert "personalInfo.firstName" to "Personal Info First Name"
      const field = el.path
        .map(p => typeof p === 'string' 
          ? p.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
          : `[${p}]`
        )
        .join(' ');
      
      // Remove double quotes from Joi's default message and replace key with pretty field name
      const cleanMsg = el.message.replace(/"/g, '');
      const finalMsg = cleanMsg.replace(el.context.key, field);
      
      return finalMsg;
    });

    return next(new AppError(errors[0], 400)); // Return only the first error for cleaner Toasts
  }

  req.body = value;
  next();
};

export default validate;
