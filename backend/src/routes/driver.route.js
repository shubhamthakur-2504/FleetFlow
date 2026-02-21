import { Router } from "express";
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  updateDriverStatus,
  deleteDriver,
  getDriversNeedingRenewal
} from "../controllers/driver.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { validatorMiddleware } from "../middlewares/validator.middleware.js";
import {
  createDriverValidators,
  updateDriverValidators,
  updateDriverStatusValidators
} from "../validators/driver.validators.js";

const router = Router();

// All driver routes require authentication
router.use(verifyJWT);

/**
 * POST /api/drivers
 * Create a new driver (ADMIN, SAFETY_OFFICER only)
 * Safety Officer onboards drivers as part of compliance profile management
 * Fleet Manager has read-only access (no create permission)
 */
router.post(
  "/",
  authorize("ADMIN", "SAFETY_OFFICER"),
  createDriverValidators(),
  validatorMiddleware,
  createDriver
);

/**
 * GET /api/drivers
 * Retrieve all drivers (All authenticated users can read)
 */
router.get("/", getAllDrivers);

/**
 * GET /api/drivers/renewal
 * Get drivers needing license renewal (ADMIN, SAFETY_OFFICER, FLEET_MANAGER)
 * Fleet Manager has read-only access for oversight
 * Must come before /:id route
 */
router.get(
  "/renewal",
  authorize("ADMIN", "SAFETY_OFFICER", "FLEET_MANAGER"),
  getDriversNeedingRenewal
);

/**
 * GET /api/drivers/:id
 * Retrieve a specific driver's details (All authenticated users can read)
 */
router.get("/:id", getDriverById);

/**
 * PATCH /api/drivers/:id
 * Update driver details (ADMIN, SAFETY_OFFICER only)
 * Safety Officer updates licenseExpiry when drivers renew licenses for compliance
 * Fleet Manager has read-only access (no update permission)
 */
router.patch(
  "/:id",
  authorize("ADMIN", "SAFETY_OFFICER"),
  updateDriverValidators(),
  validatorMiddleware,
  updateDriver
);

/**
 * PATCH /api/drivers/:id/status
 * Update driver status (change On Duty, Off Duty, Suspended)
 * (ADMIN, SAFETY_OFFICER only)
 * Safety Officer manages compliance (suspend for violations)
 * Fleet Manager cannot change status (read-only access)
 */
router.patch(
  "/:id/status",
  authorize("ADMIN", "SAFETY_OFFICER"),
  updateDriverStatusValidators(),
  validatorMiddleware,
  updateDriverStatus
);

/**
 * DELETE /api/drivers/:id
 * Delete a driver (ADMIN only - destructive operation)
 */
router.delete(
  "/:id",
  authorize("ADMIN"),
  deleteDriver
);

export default router;
