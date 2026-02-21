import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/api-error.js";

/**
 * GET ALL EXPENSES - Calculate expenses from trips and fuel logs
 * Returns vehicle expenses, driver expenses, and status
 */
export const getAllExpenses = asyncHandler(async (req, res) => {
  const { vehicleId, driverId, startDate, endDate } = req.query;

  let tripWhere = {};
  let logWhere = {};

  if (vehicleId) {
    tripWhere.vehicleId = parseInt(vehicleId);
    logWhere.vehicleId = parseInt(vehicleId);
  }

  if (driverId) {
    tripWhere.driverId = parseInt(driverId);
  }

  if (startDate || endDate) {
    logWhere.date = {};
    if (startDate) {
      logWhere.date.gte = new Date(startDate);
    }
    if (endDate) {
      logWhere.date.lte = new Date(endDate);
    }
  }

  // Get completed trips
  const trips = await prisma.trip.findMany({
    where: {
      ...tripWhere,
      status: "Completed"
    },
    include: {
      vehicle: true,
      driver: true
    }
  });

  // Get fuel logs
  const fuelLogs = await prisma.log.findMany({
    where: {
      ...logWhere,
      type: "Fuel"
    },
    include: {
      vehicle: true
    }
  });

  // Get maintenance logs
  const maintenanceLogs = await prisma.log.findMany({
    where: {
      ...logWhere,
      type: "Maintenance"
    },
    include: {
      vehicle: true
    }
  });

  // Group by vehicle and calculate totals
  const vehicleExpenses = {};

  // Add fuel costs
  fuelLogs.forEach((log) => {
    if (!vehicleExpenses[log.vehicleId]) {
      vehicleExpenses[log.vehicleId] = {
        vehicleId: log.vehicleId,
        vehicle: log.vehicle,
        fuelCost: 0,
        maintenanceCost: 0,
        totalExpense: 0,
        trips: 0,
        date: log.date
      };
    }
    vehicleExpenses[log.vehicleId].fuelCost += log.cost;
  });

  // Add maintenance costs
  maintenanceLogs.forEach((log) => {
    if (!vehicleExpenses[log.vehicleId]) {
      vehicleExpenses[log.vehicleId] = {
        vehicleId: log.vehicleId,
        vehicle: log.vehicle,
        fuelCost: 0,
        maintenanceCost: 0,
        totalExpense: 0,
        trips: 0,
        date: log.date
      };
    }
    vehicleExpenses[log.vehicleId].maintenanceCost += log.cost;
  });

  // Add trip expenses/revenue
  trips.forEach((trip) => {
    if (!vehicleExpenses[trip.vehicleId]) {
      vehicleExpenses[trip.vehicleId] = {
        vehicleId: trip.vehicleId,
        vehicle: trip.vehicle,
        fuelCost: 0,
        maintenanceCost: 0,
        totalExpense: 0,
        trips: 0,
        date: new Date()
      };
    }
    vehicleExpenses[trip.vehicleId].trips += 1;
  });

  // Calculate totals
  Object.keys(vehicleExpenses).forEach((key) => {
    vehicleExpenses[key].totalExpense =
      vehicleExpenses[key].fuelCost + vehicleExpenses[key].maintenanceCost;
  });

  return res.status(200).json({
    success: true,
    message: "Expenses retrieved successfully",
    data: Object.values(vehicleExpenses),
    total: Object.values(vehicleExpenses).length
  });
});

/**
 * GET VEHICLE EXPENSES - Get expense breakdown for a specific vehicle
 */
export const getVehicleExpenses = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  const { startDate, endDate } = req.query;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: parseInt(vehicleId) }
  });

  if (!vehicle) {
    throw new apiError("Vehicle not found", 404);
  }

  let logWhere = { vehicleId: parseInt(vehicleId) };
  if (startDate || endDate) {
    logWhere.date = {};
    if (startDate) {
      logWhere.date.gte = new Date(startDate);
    }
    if (endDate) {
      logWhere.date.lte = new Date(endDate);
    }
  }

  const fuelLogs = await prisma.log.findMany({
    where: { ...logWhere, type: "Fuel" }
  });

  const maintenanceLogs = await prisma.log.findMany({
    where: { ...logWhere, type: "Maintenance" }
  });

  const trips = await prisma.trip.findMany({
    where: { vehicleId: parseInt(vehicleId), status: "Completed" }
  });

  const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalExpense = fuelCost + maintenanceCost;
  const tripCount = trips.length;

  return res.status(200).json({
    success: true,
    message: "Vehicle expenses retrieved successfully",
    data: {
      vehicleId,
      vehicle,
      fuelCost,
      maintenanceCost,
      totalExpense,
      tripCount,
      costPerKm: vehicle.odometer > 0 ? (totalExpense / vehicle.odometer).toFixed(2) : 0
    }
  });
});

/**
 * GET DRIVER EXPENSES - Get expense summary for trips driven by a specific driver
 */
export const getDriverExpenses = asyncHandler(async (req, res) => {
  const { driverId } = req.params;

  const driver = await prisma.driver.findUnique({
    where: { id: parseInt(driverId) }
  });

  if (!driver) {
    throw new apiError("Driver not found", 404);
  }

  const trips = await prisma.trip.findMany({
    where: { driverId: parseInt(driverId), status: "Completed" },
    include: { vehicle: true }
  });

  const totalTrips = trips.length;
  const totalRevenue = trips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);

  // Get fuel costs for vehicles this driver has used
  const vehicleIds = [...new Set(trips.map((t) => t.vehicleId))];
  let fuelCost = 0;
  let maintenanceCost = 0;

  if (vehicleIds.length > 0) {
    const fuelLogs = await prisma.log.findMany({
      where: { vehicleId: { in: vehicleIds }, type: "Fuel" }
    });
    const maintenanceLogs = await prisma.log.findMany({
      where: { vehicleId: { in: vehicleIds }, type: "Maintenance" }
    });

    fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  }

  return res.status(200).json({
    success: true,
    message: "Driver expenses retrieved successfully",
    data: {
      driverId,
      driver: { id: driver.id, name: driver.name },
      totalTrips,
      totalRevenue,
      fuelCost,
      maintenanceCost,
      netProfit: totalRevenue - (fuelCost + maintenanceCost)
    }
  });
});

/**
 * GET EXPENSE SUMMARY - Dashboard summary of all expenses
 */
export const getExpenseSummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  let dateFilter = {};
  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    dateFilter.date = { gte: startDate, lte: endDate };
  }

  const fuelLogs = await prisma.log.findMany({
    where: { type: "Fuel", ...dateFilter }
  });

  const maintenanceLogs = await prisma.log.findMany({
    where: { type: "Maintenance", ...dateFilter }
  });

  const trips = await prisma.trip.findMany({
    where: { status: "Completed", ...dateFilter }
  });

  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalRevenue = trips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);

  return res.status(200).json({
    success: true,
    message: "Expense summary retrieved successfully",
    data: {
      period: month && year ? `${month}/${year}` : "All Time",
      totalFuelCost,
      totalMaintenanceCost,
      totalExpense: totalFuelCost + totalMaintenanceCost,
      totalRevenue,
      netProfit: totalRevenue - (totalFuelCost + totalMaintenanceCost),
      tripCount: trips.length
    }
  });
});
