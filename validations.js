const Joi = require("joi");

const registerValidationSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  username: Joi.string().min(3).max(255).required(),
  email: Joi.string().min(6).required().email(),
  password: Joi.string().min(6).required(),
});

const loginValidationSchema = Joi.object({
  username: Joi.string().min(3).max(255).required(),
  password: Joi.string().min(6).required(),
});

module.exports.registerValidationSchema = registerValidationSchema;
module.exports.loginValidationSchema = loginValidationSchema;
