import { body } from "express-validator";

const createLogValidators = () => {
  return [
    body("vehicleId")
      .notEmpty()
      .withMessage("Vehicle ID is required")
      .isInt({ min: 1 })
      .withMessage("Vehicle ID must be a positive integer"),

    body("type")
      .trim()
      .notEmpty()
      .withMessage("Log type is required")
      .isIn(["Fuel", "Maintenance"])
      .withMessage("Type must be 'Fuel' or 'Maintenance'"),

    body("cost")
      .notEmpty()
      .withMessage("Cost is required")
      .isFloat({ min: 0.01 })
      .withMessage("Cost must be a positive number")
      .toFloat(),

    body("liters")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Liters must be a positive number")
      .toFloat()
  ];
};

const updateLogValidators = () => {
  return [
    body("type")
      .optional()
      .trim()
      .isIn(["Fuel", "Maintenance"])
      .withMessage("Type must be 'Fuel' or 'Maintenance'"),

    body("cost")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Cost must be a positive number")
      .toFloat(),

    body("liters")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Liters must be a non-negative number")
      .toFloat()
  ];
};

export {
  createLogValidators,
  updateLogValidators
};
