import { body } from "express-validator";

const createDriverValidators = () => {
  return [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Driver name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    body("licenseExpiry")
      .notEmpty()
      .withMessage("License expiry date is required")
      .isISO8601()
      .withMessage("License expiry must be a valid date"),
  ];
};

const updateDriverValidators = () => {
  return [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    body("safetyScore")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Safety score must be between 0 and 100"),

    body("licenseExpiry")
      .optional()
      .isISO8601()
      .withMessage("License expiry must be a valid date"),
  ];
};

const updateDriverStatusValidators = () => {
  return [
    body("status")
      .trim()
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["On Duty", "Off Duty", "Suspended"])
      .withMessage("Status must be 'On Duty', 'Off Duty', or 'Suspended'"),
  ];
};

export {
  createDriverValidators,
  updateDriverValidators,
  updateDriverStatusValidators
};
