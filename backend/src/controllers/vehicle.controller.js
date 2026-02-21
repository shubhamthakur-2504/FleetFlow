import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/api-error.js";

// Create a new vehicle
export const createVehicle = asyncHandler(async (req, res) => {
  const { licensePlate, model, maxLoad, type, acquisitionCost } = req.body;

  // Check for duplicate license plate
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { licensePlate }
  });

  if (existingVehicle) {
    throw new apiError("Vehicle with this license plate already exists", 409);
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      licensePlate,
      model,
      maxLoad: parseFloat(maxLoad),
      type,
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : 0.0,
      status: "Available",
      odometer: 0,
      isRetired: false
    }
  });

  return res.status(201).json({
    success: true,
    message: "Vehicle created successfully",
    data: vehicle
  });
});

// Get all vehicles
export const getAllVehicles = asyncHandler(async (req, res) => {
  const { status, type, isRetired } = req.query;

  const whereClause = {};

  if (status) {
    whereClause.status = status;
  }

  if (type) {
    whereClause.type = type;
  }

  if (isRetired !== undefined) {
    whereClause.isRetired = isRetired === "true";
  }

  const vehicles = await prisma.vehicle.findMany({
    where: whereClause,
    orderBy: { id: "asc" },
    include: {
      trips: {
        select: { id: true, status: true }
      },
      logs: {
        select: { id: true, type: true, cost: true, date: true }
      }
    }
  });

  return res.status(200).json({
    success: true,
    message: "Vehicles retrieved successfully",
    data: vehicles,
    total: vehicles.length
  });
});

// Get a single vehicle by ID
export const getVehicleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: parseInt(id) },
    include: {
      trips: {
        select: { id: true, status: true, cargoWeight: true, revenue: true }
      },
      logs: {
        select: { id: true, type: true, cost: true, date: true, liters: true }
      }
    }
  });

  if (!vehicle) {
    throw new apiError("Vehicle not found", 404);
  }

  return res.status(200).json({
    success: true,
    message: "Vehicle retrieved successfully",
    data: vehicle
  });
});

// Update vehicle details
export const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { licensePlate, model, maxLoad, type, acquisitionCost, status, odometer } = req.body;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vehicle) {
    throw new apiError("Vehicle not found", 404);
  }

  // Check for duplicate license plate if updating it
  if (licensePlate && licensePlate !== vehicle.licensePlate) {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { licensePlate }
    });

    if (existingVehicle) {
      throw new apiError("Vehicle with this license plate already exists", 409);
    }
  }

  const updateData = {};

  if (licensePlate) updateData.licensePlate = licensePlate;
  if (model) updateData.model = model;
  if (maxLoad) updateData.maxLoad = parseFloat(maxLoad);
  if (type) updateData.type = type;
  if (acquisitionCost !== undefined) updateData.acquisitionCost = parseFloat(acquisitionCost);
  if (status) updateData.status = status;
  if (odometer !== undefined) updateData.odometer = parseFloat(odometer);

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: parseInt(id) },
    data: updateData
  });

  return res.status(200).json({
    success: true,
    message: "Vehicle updated successfully",
    data: updatedVehicle
  });
});

// Toggle vehicle retirement status
export const toggleVehicleRetirement = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vehicle) {
    throw new apiError("Vehicle not found", 404);
  }

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: parseInt(id) },
    data: {
      isRetired: !vehicle.isRetired,
      status: !vehicle.isRetired ? "Out of Service" : "Available"
    }
  });

  return res.status(200).json({
    success: true,
    message: `Vehicle ${updatedVehicle.isRetired ? "retired" : "reactivated"} successfully`,
    data: updatedVehicle
  });
});

// Delete a vehicle (soft delete by retiring)
export const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: parseInt(id) }
  });

  if (!vehicle) {
    throw new apiError("Vehicle not found", 404);
  }

  // Check if vehicle has active trips
  const activeTrips = await prisma.trip.findMany({
    where: {
      vehicleId: parseInt(id),
      status: { in: ["Draft", "Dispatched"] }
    }
  });

  if (activeTrips.length > 0) {
    throw new apiError("Cannot delete vehicle with active trips", 400);
  }

  // Soft delete by retiring
  const deletedVehicle = await prisma.vehicle.update({
    where: { id: parseInt(id) },
    data: {
      isRetired: true,
      status: "Out of Service"
    }
  });

  return res.status(200).json({
    success: true,
    message: "Vehicle deleted successfully",
    data: deletedVehicle
  });
});
