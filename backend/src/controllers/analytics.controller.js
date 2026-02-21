import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/api-error.js";

/**
 * GET OVERALL ANALYTICS - Dashboard summary metrics
 */
export const getOverallAnalytics = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  let dateFilter = {};
  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    dateFilter.date = { gte: startDate, lte: endDate };
  }

  // Get all trips
  const trips = await prisma.trip.findMany({
    where: { status: "Completed", ...dateFilter }
  });

  // Get all logs
  const fuelLogs = await prisma.log.findMany({
    where: { type: "Fuel", ...dateFilter }
  });

  const maintenanceLogs = await prisma.log.findMany({
    where: { type: "Maintenance", ...dateFilter }
  });

  // Calculate metrics
  const totalTrips = trips.length;
  const totalRevenue = trips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalExpense = totalFuelCost + totalMaintenanceCost;
  const netProfit = totalRevenue - totalExpense;
  const roi = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

  // Get unique vehicles used
  const uniqueVehicles = new Set(trips.map((t) => t.vehicleId)).size;

  return res.status(200).json({
    success: true,
    message: "Overall analytics retrieved successfully",
    data: {
      totalTrips,
      totalRevenue,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpense,
      netProfit,
      roi,
      uniqueVehicles,
      averageRevenuePerTrip: totalTrips > 0 ? (totalRevenue / totalTrips).toFixed(2) : 0,
      averageExpensePerTrip: totalTrips > 0 ? (totalExpense / totalTrips).toFixed(2) : 0
    }
  });
});

/**
 * GET TIME SERIES DATA - Trends by month/week/year
 */
export const getTimeSeriesAnalytics = asyncHandler(async (req, res) => {
  const { timeRange = "month" } = req.query; // month, week, year

  try {
    // Get all trips and logs
    const trips = await prisma.trip.findMany({
      where: { status: "Completed" }
    });

    const fuelLogs = await prisma.log.findMany({
      where: { type: "Fuel" }
    });

    const maintenanceLogs = await prisma.log.findMany({
      where: { type: "Maintenance" }
    });

    // Group data by time range
    const timeSeriesMap = {};

    // Helper to get period label
    const getPeriodLabel = (date, range) => {
      const d = new Date(date);
      if (range === "week") {
        const weekNum = Math.ceil((d.getDate()) / 7);
        return `W${weekNum}`;
      } else if (range === "year") {
        return d.getFullYear().toString();
      } else {
        // month
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return monthNames[d.getMonth()];
      }
    };

    // Process trips
    trips.forEach((trip) => {
      const period = getPeriodLabel(trip.createdAt, timeRange);
      if (!timeSeriesMap[period]) {
        timeSeriesMap[period] = {
          period,
          fuelCost: 0,
          maintenanceCost: 0,
          revenue: 0,
          roi: 0
        };
      }
      timeSeriesMap[period].revenue += trip.revenue || 0;
    });

    // Process fuel logs
    fuelLogs.forEach((log) => {
      const period = getPeriodLabel(log.date, timeRange);
      if (!timeSeriesMap[period]) {
        timeSeriesMap[period] = {
          period,
          fuelCost: 0,
          maintenanceCost: 0,
          revenue: 0,
          roi: 0
        };
      }
      timeSeriesMap[period].fuelCost += log.cost;
    });

    // Process maintenance logs
    maintenanceLogs.forEach((log) => {
      const period = getPeriodLabel(log.date, timeRange);
      if (!timeSeriesMap[period]) {
        timeSeriesMap[period] = {
          period,
          fuelCost: 0,
          maintenanceCost: 0,
          revenue: 0,
          roi: 0
        };
      }
      timeSeriesMap[period].maintenanceCost += log.cost;
    });

    // Calculate ROI and convert to array
    const timeSeries = Object.values(timeSeriesMap).map((period) => ({
      ...period,
      roi: period.revenue > 0 ? Math.round(((period.revenue - period.fuelCost - period.maintenanceCost) / period.revenue) * 100) : 0
    }));

    return res.status(200).json({
      success: true,
      message: "Time series analytics retrieved successfully",
      data: timeSeries.length > 0 ? timeSeries : []
    });
  } catch (error) {
    throw new apiError(`Error fetching time series analytics: ${error.message}`, 500);
  }
});

/**
 * GET VEHICLE ANALYTICS - Cost by vehicle
 */
export const getVehicleAnalytics = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const vehicles = await prisma.vehicle.findMany({
    include: {
      logs: true,
      trips: true
    }
  });

  const vehicleAnalytics = vehicles.map((vehicle) => {
    const fuelCost = vehicle.logs.filter((log) => log.type === "Fuel").reduce((sum, log) => sum + log.cost, 0);
    const maintenanceCost = vehicle.logs.filter((log) => log.type === "Maintenance").reduce((sum, log) => sum + log.cost, 0);
    const tripCount = vehicle.trips.filter((t) => t.status === "Completed").length;
    const revenue = vehicle.trips.filter((t) => t.status === "Completed").reduce((sum, trip) => sum + (trip.revenue || 0), 0);

    return {
      vehicleId: vehicle.id,
      licensePlate: vehicle.licensePlate,
      model: vehicle.model,
      fuelCost,
      maintenanceCost,
      totalCost: fuelCost + maintenanceCost,
      tripCount,
      revenue,
      netProfit: revenue - (fuelCost + maintenanceCost),
      cost: fuelCost + maintenanceCost
    };
  });

  // Sort by total cost and limit
  const topCostly = vehicleAnalytics.sort((a, b) => b.totalCost - a.totalCost).slice(0, parseInt(limit));

  return res.status(200).json({
    success: true,
    message: "Vehicle analytics retrieved successfully",
    data: topCostly
  });
});

/**
 * GET DRIVER ANALYTICS - Performance by driver
 */
export const getDriverAnalytics = asyncHandler(async (req, res) => {
  const drivers = await prisma.driver.findMany({
    include: {
      trips: {
        include: {
          vehicle: true
        }
      }
    }
  });

  const driverAnalytics = drivers.map((driver) => {
    const completedTrips = driver.trips.filter((t) => t.status === "Completed");
    const totalRevenue = completedTrips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);
    const tripCount = completedTrips.length;

    return {
      driverId: driver.id,
      name: driver.name,
      tripCount,
      totalRevenue,
      averageRevenuePerTrip: tripCount > 0 ? (totalRevenue / tripCount).toFixed(2) : 0,
      safetyScore: driver.safetyScore || 0,
      status: driver.status
    };
  });

  return res.status(200).json({
    success: true,
    message: "Driver analytics retrieved successfully",
    data: driverAnalytics
  });
});

/**
 * GET FINANCIAL SUMMARY - Overall profit/loss
 */
export const getFinancialSummary = asyncHandler(async (req, res) => {
  const trips = await prisma.trip.findMany({
    where: { status: "Completed" }
  });

  const fuelLogs = await prisma.log.findMany({
    where: { type: "Fuel" }
  });

  const maintenanceLogs = await prisma.log.findMany({
    where: { type: "Maintenance" }
  });

  const totalRevenue = trips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalExpense = totalFuelCost + totalMaintenanceCost;
  const netProfit = totalRevenue - totalExpense;

  return res.status(200).json({
    success: true,
    message: "Financial summary retrieved successfully",
    data: {
      totalRevenue,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpense,
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
    }
  });
});

/**
 * GET VEHICLE UTILIZATION - Idle vs utilized
 */
export const getVehicleUtilization = asyncHandler(async (req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: true
    }
  });

  let utilized = 0;
  let idle = 0;

  vehicles.forEach((vehicle) => {
    const completedTrips = vehicle.trips.filter((t) => t.status === "Completed");
    if (completedTrips.length > 0) {
      utilized += 1;
    } else {
      idle += 1;
    }
  });

  return res.status(200).json({
    success: true,
    message: "Vehicle utilization retrieved successfully",
    data: [
      { name: "Utilized", value: utilized, color: "#10b981" },
      { name: "Idle", value: idle, color: "#ef4444" }
    ]
  });
});
