import { Router } from "express";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  toggleVehicleRetirement,
  deleteVehicle
} from "../controllers/vehicle.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validatorMiddleware } from "../middlewares/validator.middleware.js";
import { createVehicleValidators, updateVehicleValidators } from "../validators/vehicle.validators.js";

const router = Router();

// All vehicle routes require authentication
router.use(verifyJWT);

// Create a new vehicle
router.post("/", createVehicleValidators(), validatorMiddleware, createVehicle);

// Get all vehicles with optional filters
router.get("/", getAllVehicles);

// Get a specific vehicle by ID
router.get("/:id", getVehicleById);

// Update vehicle details
router.patch("/:id", updateVehicleValidators(), validatorMiddleware, updateVehicle);

// Toggle retirement status (mark as Out of Service or reactivate)
router.patch("/:id/retire", toggleVehicleRetirement);

// Delete a vehicle
router.delete("/:id", deleteVehicle);

export default router;
