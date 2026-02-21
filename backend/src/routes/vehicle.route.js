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
import { authorize } from "../middlewares/authorize.middleware.js";
import { validatorMiddleware } from "../middlewares/validator.middleware.js";
import { createVehicleValidators, updateVehicleValidators } from "../validators/vehicle.validators.js";

const router = Router();

// All vehicle routes require authentication
router.use(verifyJWT);

// Create a new vehicle - Only ADMIN and FLEET_MANAGER
router.post(
  "/",
  authorize("ADMIN", "FLEET_MANAGER"),
  createVehicleValidators(),
  validatorMiddleware,
  createVehicle
);

// Get all vehicles - All authenticated users can read
router.get("/", getAllVehicles);

// Get a specific vehicle by ID - All authenticated users can read
router.get("/:id", getVehicleById);

// Update vehicle details - Only ADMIN and FLEET_MANAGER
router.patch(
  "/:id",
  authorize("ADMIN", "FLEET_MANAGER"),
  updateVehicleValidators(),
  validatorMiddleware,
  updateVehicle
);

// Toggle retirement status - ADMIN and FLEET_MANAGER only (asset lifecycle decision)
router.patch(
  "/:id/retire",
  authorize("ADMIN", "FLEET_MANAGER"),
  toggleVehicleRetirement
);

// Delete a vehicle - ADMIN and FLEET_MANAGER only (asset lifecycle decision)
router.delete(
  "/:id",
  authorize("ADMIN", "FLEET_MANAGER"),
  deleteVehicle
);

export default router;
