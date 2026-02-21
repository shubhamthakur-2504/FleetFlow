import { body } from "express-validator";

const createVehicleValidators = () => {
  return [
    body("licensePlate")
      .trim()
      .notEmpty()
      .withMessage("License plate is required")
      .isLength({ min: 4, max: 20 })
      .withMessage("License plate must be between 4 and 20 characters"),

    body("model")
      .trim()
      .notEmpty()
      .withMessage("Vehicle model is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Model must be between 2 and 50 characters"),

    body("maxLoad")
      .notEmpty()
      .withMessage("Max load is required")
      .isFloat({ min: 0.1 })
      .withMessage("Max load must be a positive number"),

    body("type")
      .trim()
      .notEmpty()
      .withMessage("Vehicle type is required")
      .isIn(["Truck", "Van", "Bike"])
      .withMessage("Type must be Truck, Van, or Bike"),

    body("acquisitionCost")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Acquisition cost must be a positive number")
  ];
};

const updateVehicleValidators = () => {
  return [
    body("licensePlate")
      .optional()
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage("License plate must be between 4 and 20 characters"),

    body("model")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Model must be between 2 and 50 characters"),

    body("maxLoad")
      .optional()
      .isFloat({ min: 0.1 })
      .withMessage("Max load must be a positive number"),

    body("type")
      .optional()
      .trim()
      .isIn(["Truck", "Van", "Bike"])
      .withMessage("Type must be Truck, Van, or Bike"),

    body("acquisitionCost")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Acquisition cost must be a positive number")
  ];
};

export { createVehicleValidators, updateVehicleValidators };
