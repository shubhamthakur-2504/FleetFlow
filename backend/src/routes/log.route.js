import { Router } from "express";
import {
  createLog,
  getAllLogs,
  getLogById,
  updateLog,
  deleteLog,
  getFuelEfficiency
} from "../controllers/log.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { validatorMiddleware } from "../middlewares/validator.middleware.js";
import {
  createLogValidators,
  updateLogValidators
} from "../validators/log.validators.js";

const router = Router();

// All log routes require authentication
router.use(verifyJWT);

/**
 * POST /api/logs
 * Create a maintenance or fuel log (ADMIN, FLEET_MANAGER)
 * Fleet Manager manages vehicle health and maintenance intake
 * Maintenance logs auto-change vehicle status to "In Shop"
 */
router.post(
  "/",
  authorize("ADMIN", "FLEET_MANAGER"),
  createLogValidators(),
  validatorMiddleware,
  createLog
);

/**
 * GET /api/logs
 * Retrieve all logs with filtering options (All authenticated)
 * Fleet Manager has read-only access for oversight
 * Query params: vehicleId, type (Fuel/Maintenance), startDate, endDate
 */
router.get("/", getAllLogs);

/**
 * GET /api/logs/fuel/efficiency
 * Calculate fuel efficiency and cost metrics (All authenticated)
 * Must come before /:id route to avoid route conflicts
 */
router.get("/fuel/efficiency", getFuelEfficiency);

/**
 * GET /api/logs/:id
 * Retrieve a specific log entry (All authenticated)
 * Accessible to Fleet Manager, Safety Officer, Admin for audit trail
 */
router.get("/:id", getLogById);

/**
 * PATCH /api/logs/:id
 * Update log details (ADMIN, FLEET_MANAGER)
 * Fleet Manager can update maintenance records during service workflow
 */
router.patch(
  "/:id",
  authorize("ADMIN", "FLEET_MANAGER"),
  updateLogValidators(),
  validatorMiddleware,
  updateLog
);

/**
 * DELETE /api/logs/:id
 * Delete a log entry (ADMIN, FLEET_MANAGER)
 * Fleet Manager removes maintenance logs to restore vehicle availability
 * Deleting maintenance log restores vehicle status to "Available"
 */
router.delete(
  "/:id",
  authorize("ADMIN", "FLEET_MANAGER"),
  deleteLog
);

export default router;
