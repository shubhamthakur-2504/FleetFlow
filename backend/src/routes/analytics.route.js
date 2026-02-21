import express from "express";
import {
  getOverallAnalytics,
  getTimeSeriesAnalytics,
  getVehicleAnalytics,
  getDriverAnalytics,
  getFinancialSummary,
  getVehicleUtilization
} from "../controllers/analytics.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

/**
 * GET /api/analytics/overall
 * Get overall dashboard analytics
 * Query: month?, year?
 */
router.get("/overall", getOverallAnalytics);

/**
 * GET /api/analytics/timeseries
 * Get time series data for trends
 * Query: timeRange? (month, week, year)
 */
router.get("/timeseries", getTimeSeriesAnalytics);

/**
 * GET /api/analytics/vehicles
 * Get vehicle-wise analytics
 * Query: limit? (default: 5)
 */
router.get("/vehicles", getVehicleAnalytics);

/**
 * GET /api/analytics/drivers
 * Get driver-wise analytics
 */
router.get("/drivers", getDriverAnalytics);

/**
 * GET /api/analytics/financial
 * Get financial summary
 */
router.get("/financial", getFinancialSummary);

/**
 * GET /api/analytics/utilization
 * Get vehicle utilization stats
 */
router.get("/utilization", getVehicleUtilization);

export default router;
