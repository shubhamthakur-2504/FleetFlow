import express from "express";
import {
  getAllExpenses,
  getVehicleExpenses,
  getDriverExpenses,
  getExpenseSummary
} from "../controllers/expense.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

/**
 * GET /api/expenses
 * Get all expenses (with optional filters by vehicle, driver, date)
 * Query: vehicleId?, driverId?, startDate?, endDate?
 * Access: All authenticated users
 */
router.get("/", getAllExpenses);

/**
 * GET /api/expenses/summary
 * Get expense summary dashboard
 * Query: month?, year?
 * Access: All authenticated users
 */
router.get("/summary", getExpenseSummary);

/**
 * GET /api/expenses/vehicle/:vehicleId
 * Get expenses for a specific vehicle
 * Query: startDate?, endDate?
 * Access: All authenticated users
 */
router.get("/vehicle/:vehicleId", getVehicleExpenses);

/**
 * GET /api/expenses/driver/:driverId
 * Get expenses for a specific driver
 * Access: All authenticated users
 */
router.get("/driver/:driverId", getDriverExpenses);

export default router;
