import { body } from "express-validator";

export const createTripValidators = () => {
  return [
    body("vehicleId")
      .notEmpty()
      .withMessage("Vehicle ID is required")
      .isInt({ min: 1 })
      .withMessage("Vehicle ID must be a positive integer"),

    body("driverId")
      .notEmpty()
      .withMessage("Driver ID is required")
      .isInt({ min: 1 })
      .withMessage("Driver ID must be a positive integer"),

    body("cargoWeight")
      .notEmpty()
      .withMessage("Cargo weight is required")
      .isFloat({ min: 0.01 })
      .withMessage("Cargo weight must be a positive number")
      .toFloat(),
  ];
};

export const dispatchTripValidators = () => {
  return [
    body("startOdo")
      .notEmpty()
      .withMessage("Start odometer reading is required")
      .isFloat({ min: 0 })
      .withMessage("Start odometer must be a non-negative number")
      .toFloat(),
  ];
};

export const completeTripValidators = () => {
  return [
    body("endOdo")
      .notEmpty()
      .withMessage("End odometer reading is required")
      .isFloat({ min: 0 })
      .withMessage("End odometer must be a non-negative number")
      .toFloat(),

    body("revenue")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Revenue must be a non-negative number")
      .toFloat(),
  ];
};

export const updateTripValidators = () => {
  return [
    body("cargoWeight")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Cargo weight must be a positive number")
      .toFloat(),

    body("status")
      .optional()
      .isIn(["Draft", "Dispatched", "Completed", "Cancelled"])
      .withMessage("Status must be one of: Draft, Dispatched, Completed, Cancelled"),
  ];
};
