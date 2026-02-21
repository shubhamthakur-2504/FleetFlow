import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/api-error.js";

/**
 * CREATE LOG - Record maintenance or fuel log for a vehicle
 * Fleet Manager can create logs for vehicle health tracking
 * Auto-logic: Maintenance logs change vehicle status to "In Shop"
 * Fuel logs do not change status
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

  // Prevent maintenance on vehicles already in shop (avoid duplicate entries)
  if (type === "Maintenance" && vehicle.status === "In Shop") {
    throw new apiError(
      "Vehicle is already in shop. Complete current maintenance before adding another service log.",
      400
    );
  }

  // Prevent maintenance on vehicles with active dispatched trips
  if (type === "Maintenance") {
    const activeTrip = await prisma.trip.findFirst({
      where: {
        vehicleId: parseInt(vehicleId),
        status: "Dispatched"
      }
    });

    if (activeTrip) {
      throw new apiError(
        "Cannot create maintenance log for vehicle with active trip. Complete or cancel the trip first.",
        400
      );
    }
  }

  // Use transaction to create log and optionally update vehicle status
  const log = await prisma.$transaction(async (tx) => {
    // Create the log entry
    const newLog = await tx.log.create({
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

    // If maintenance log, auto-update vehicle status to "In Shop"
    if (type === "Maintenance") {
      await tx.vehicle.update({
        where: { id: parseInt(vehicleId) },
        data: { status: "In Shop" }
      });
    }

    return newLog;
  });

  return res.status(201).json({
    success: true,
    message: type === "Maintenance" 
      ? `Maintenance log created. Vehicle status changed to "In Shop".` 
      : `${type} log created successfully`,
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
 * Fleet Manager and Admin can delete logs for maintenance workflow
 * Auto-logic: Deleting maintenance log restores vehicle status to "Available"
 * Careful operation - affects financial records and vehicle availability
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

  // Use transaction to delete log and optionally restore vehicle status
  const deletedLogInfo = await prisma.$transaction(async (tx) => {
    const logToDelete = await tx.log.findUnique({
      where: { id: parseInt(id) }
    });

    // Delete the log
    await tx.log.delete({
      where: { id: parseInt(id) }
    });

    // If maintenance log, check if there are other maintenance logs for this vehicle
    if (logToDelete.type === "Maintenance") {
      const otherMaintenanceLogs = await tx.log.findMany({
        where: {
          vehicleId: logToDelete.vehicleId,
          type: "Maintenance"
        }
      });

      // Only restore status to Available if no other maintenance logs exist
      if (otherMaintenanceLogs.length === 0) {
        await tx.vehicle.update({
          where: { id: logToDelete.vehicleId },
          data: { status: "Available" }
        });
      }
    }

    return logToDelete;
  });

  return res.status(200).json({
    success: true,
    message: deletedLogInfo.type === "Maintenance"
      ? "Maintenance log deleted. Vehicle status restored to Available."
      : "Fuel log deleted successfully",
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
