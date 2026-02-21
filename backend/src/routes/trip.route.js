import { Router } from "express";
import {
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip
} from "../controllers/trip.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { validatorMiddleware } from "../middlewares/validator.middleware.js";
import { 
  createTripValidators, 
  dispatchTripValidators, 
  completeTripValidators,
  updateTripValidators 
} from "../validators/trip.validators.js";

const router = Router();

// All trip routes require authentication
router.use(verifyJWT);

/**
 * POST / - Create a new trip in Draft status
 * Requires: DISPATCHER, ADMIN
 * Fleet Managers oversee but don't dispatch; Dispatchers execute
 */
router.post(
  "/",
  authorize("ADMIN", "DISPATCHER"),
  createTripValidators(),
  validatorMiddleware,
  createTrip
);

/**
 * GET / - Get all trips with optional filtering
 * Accessible to: All authenticated users (read-only)
 */
router.get("/", getAllTrips);

/**
 * GET /:id - Get a specific trip by ID
 * Accessible to: All authenticated users (read-only)
 */
router.get("/:id", getTripById);

/**
 * PATCH /:id - Update trip details (only for Draft trips)
 * Requires: DISPATCHER, ADMIN, FLEET_MANAGER
 */
router.patch(
  "/:id",
  authorize("ADMIN", "FLEET_MANAGER", "DISPATCHER"),
  updateTripValidators(),
  validatorMiddleware,
  updateTrip
);

/**
 * PATCH /:id/dispatch - Move trip from Draft to Dispatched
 * Updates Vehicle and Driver status to "On Trip"/"On Duty"
 * Requires: DISPATCHER, ADMIN, FLEET_MANAGER
 */
router.patch(
  "/:id/dispatch",
  authorize("ADMIN", "FLEET_MANAGER", "DISPATCHER"),
  dispatchTripValidators(),
  validatorMiddleware,
  dispatchTrip
);

/**
 * PATCH /:id/complete - Move trip from Dispatched to Completed
 * Updates Vehicle and Driver status back to "Available"/"Off Duty"
 * Requires: DISPATCHER, ADMIN, FLEET_MANAGER
 */
router.patch(
  "/:id/complete",
  authorize("ADMIN", "FLEET_MANAGER", "DISPATCHER"),
  completeTripValidators(),
  validatorMiddleware,
  completeTrip
);

/**
 * PATCH /:id/cancel - Cancel a trip (Draft or Dispatched only)
 * Requires: ADMIN, FLEET_MANAGER only (management override, prevents Dispatcher abuse)
 */
router.patch(
  "/:id/cancel",
  authorize("ADMIN", "FLEET_MANAGER"),
  cancelTrip
);

/**
 * DELETE /:id - Hard delete a trip
 * Requires: ADMIN, FLEET_MANAGER only (prevents Dispatcher from deleting)
 */
router.delete(
  "/:id",
  authorize("ADMIN", "FLEET_MANAGER"),
  deleteTrip
);

export default router;
