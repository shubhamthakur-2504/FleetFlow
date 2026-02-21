import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/api-error.js";

/**
 * CREATE LOG - Record maintenance or fuel log for a vehicle
 * Safety Officer and Admin can create logs for compliance/maintenance tracking
 */
export const createLog = asyncHandler(async (req, res) => {
  const { vehicleId, type, cost, liters } = req.body;

  // Validate vehicle exists
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: parseInt(vehicleId) }
  });

  if (!vehicle) {
    throw new apiError("Vehicle not found", 404);
  }

  // Validate log type
  const validTypes = ["Fuel", "Maintenance"];
  if (!validTypes.includes(type)) {
    throw new apiError(
      `Log type must be one of: ${validTypes.join(", ")}`,
      400
    );
  }

  // Validate cost
  if (cost <= 0) {
    throw new apiError("Cost must be a positive number", 400);
  }

  // For fuel logs, liters is required
  if (type === "Fuel" && (!liters || liters <= 0)) {
    throw new apiError("Liters consumed must be provided for fuel logs", 400);
  }

  const log = await prisma.log.create({
    data: {
      vehicleId: parseInt(vehicleId),
      type,
      cost: parseFloat(cost),
      liters: type === "Fuel" ? parseFloat(liters) : null,
      date: new Date()
    },
    include: {
      vehicle: { select: { licensePlate: true, model: true } }
    }
  });

  return res.status(201).json({
    success: true,
    message: `${type} log created successfully`,
    data: log
  });
});

/**
 * GET ALL LOGS - Retrieve maintenance and fuel logs
 * Accessible to all authenticated users (Safety Officer, Fleet Manager, Admin)
 */
export const getAllLogs = asyncHandler(async (req, res) => {
  const { vehicleId, type, startDate, endDate } = req.query;

  const whereClause = {};

  if (vehicleId) {
    whereClause.vehicleId = parseInt(vehicleId);
  }

  if (type) {
    if (!["Fuel", "Maintenance"].includes(type)) {
      throw new apiError("Type must be 'Fuel' or 'Maintenance'", 400);
    }
    whereClause.type = type;
  }

  // Date range filtering
  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) {
      whereClause.date.gte = new Date(startDate);
    }
    if (endDate) {
      whereClause.date.lte = new Date(endDate);
    }
  }

  const logs = await prisma.log.findMany({
    where: whereClause,
    orderBy: { date: "desc" },
    include: {
      vehicle: {
        select: {
          id: true,
          licensePlate: true,
          model: true,
          type: true,
          status: true
        }
      }
    }
  });

  // Calculate summary statistics
  const fuelLogs = logs.filter((log) => log.type === "Fuel");
  const maintenanceLogs = logs.filter((log) => log.type === "Maintenance");

  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalFuelLiters = fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  const fuelEfficiency = totalFuelLiters > 0 ? (totalFuelCost / totalFuelLiters).toFixed(2) : 0;

  return res.status(200).json({
    success: true,
    message: "Logs retrieved successfully",
    data: logs,
    total: logs.length,
    summary: {
      totalLogs: logs.length,
      fuelLogs: fuelLogs.length,
      maintenanceLogs: maintenanceLogs.length,
      totalCost: (totalFuelCost + totalMaintenanceCost).toFixed(2),
      fuelCost: totalFuelCost.toFixed(2),
      fuelLiters: totalFuelLiters.toFixed(2),
      maintenanceCost: totalMaintenanceCost.toFixed(2),
      costPerLiter: fuelEfficiency
    }
  });
});

/**
 * GET LOG BY ID - Retrieve a specific log entry
 * Accessible to all authenticated users for audit trail viewing
 */
export const getLogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const log = await prisma.log.findUnique({
    where: { id: parseInt(id) },
    include: {
      vehicle: {
        select: {
          id: true,
          licensePlate: true,
          model: true,
          type: true,
          status: true,
          odometer: true
        }
      }
    }
  });

  if (!log) {
    throw new apiError("Log not found", 404);
  }

  return res.status(200).json({
    success: true,
    message: "Log retrieved successfully",
    data: log
  });
});

/**
 * UPDATE LOG - Modify an existing log entry
 * Only Safety Officer and Admin can update logs for compliance management
 * Cannot update date - logs are immutable once created
 */
export const updateLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, cost, liters } = req.body;

  // Verify log exists
  const log = await prisma.log.findUnique({
    where: { id: parseInt(id) }
  });

  if (!log) {
    throw new apiError("Log not found", 404);
  }

  const updateData = {};

  if (type !== undefined) {
    if (!["Fuel", "Maintenance"].includes(type)) {
      throw new apiError("Type must be 'Fuel' or 'Maintenance'", 400);
    }
    updateData.type = type;
  }

  if (cost !== undefined) {
    if (cost <= 0) {
      throw new apiError("Cost must be a positive number", 400);
    }
    updateData.cost = parseFloat(cost);
  }

  if (liters !== undefined) {
    if (liters < 0) {
      throw new apiError("Liters cannot be negative", 400);
    }
    updateData.liters = liters > 0 ? parseFloat(liters) : null;
  }

  const updatedLog = await prisma.log.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      vehicle: { select: { licensePlate: true, model: true } }
    }
  });

  return res.status(200).json({
    success: true,
    message: "Log updated successfully",
    data: updatedLog
  });
});

/**
 * DELETE LOG - Remove a log entry
 * Only Safety Officer and Admin can delete logs
 * Careful operation - affects financial records and compliance audit trail
 */
export const deleteLog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify log exists
  const log = await prisma.log.findUnique({
    where: { id: parseInt(id) }
  });

  if (!log) {
    throw new apiError("Log not found", 404);
  }

  await prisma.log.delete({
    where: { id: parseInt(id) }
  });

  return res.status(200).json({
    success: true,
    message: "Log deleted successfully",
    data: { id: parseInt(id) }
  });
});

/**
 * GET FUEL EFFICIENCY - Analytics for financial reporting
 * Calculate cost per km and fuel efficiency metrics
 * Accessible to all authenticated users for transparency
 */
export const getFuelEfficiency = asyncHandler(async (req, res) => {
  const { vehicleId, startDate, endDate } = req.query;

  let whereClause = { type: "Fuel" };

  if (vehicleId) {
    whereClause.vehicleId = parseInt(vehicleId);
  }

  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) {
      whereClause.date.gte = new Date(startDate);
    }
    if (endDate) {
      whereClause.date.lte = new Date(endDate);
    }
  }

  const fuelLogs = await prisma.log.findMany({
    where: whereClause,
    include: {
      vehicle: { select: { licensePlate: true, model: true, odometer: true } }
    }
  });

  if (fuelLogs.length === 0) {
    return res.status(200).json({
      success: true,
      message: "No fuel logs found",
      data: [],
      metrics: {
        totalFuelCost: 0,
        totalLiters: 0,
        averageCostPerLiter: 0,
        totalEntries: 0
      }
    });
  }

  const totalCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
  const totalLiters = fuelLogs.reduce((sum, log) => sum + (log.liters || 0), 0);
  const costPerLiter = totalLiters > 0 ? (totalCost / totalLiters).toFixed(2) : 0;

  return res.status(200).json({
    success: true,
    message: "Fuel efficiency metrics calculated",
    data: fuelLogs,
    metrics: {
      totalFuelCost: totalCost.toFixed(2),
      totalLiters: totalLiters.toFixed(2),
      averageCostPerLiter: costPerLiter,
      totalEntries: fuelLogs.length
    }
  });
});
