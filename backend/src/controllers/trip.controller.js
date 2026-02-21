import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/api-error.js";

/**
 * CREATE TRIP - Create a new trip in Draft status
 * Validates: CargoWeight < Vehicle.MaxLoad, Vehicle is Available, Driver exists
 */
export const createTrip = asyncHandler(async (req, res) => {
  const { vehicleId, driverId, cargoWeight } = req.body;

  // Validate vehicle exists and check capacity
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: parseInt(vehicleId) }
  });

  if (!vehicle) {
    throw new apiError("Vehicle not found", 404);
  }

  if (vehicle.isRetired) {
    throw new apiError("Cannot create trip with a retired vehicle", 400);
  }

  if (cargoWeight > vehicle.maxLoad) {
    throw new apiError(
      `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoad}kg)`,
      400
    );
  }

  if (vehicle.status !== "Available") {
    throw new apiError(
      `Vehicle is not available. Current status: ${vehicle.status}`,
      400
    );
  }

  // Validate driver exists
  const driver = await prisma.driver.findUnique({
    where: { id: parseInt(driverId) }
  });

  if (!driver) {
    throw new apiError("Driver not found", 404);
  }

  // Check driver compliance - License must not be expired
  const today = new Date();
  if (new Date(driver.licenseExpiry) < today) {
    throw new apiError(
      `Cannot assign driver with expired license. License expired on ${driver.licenseExpiry.toLocaleDateString()}`,
      400
    );
  }

  if (driver.status === "Suspended") {
    throw new apiError("Cannot assign suspended driver to trip", 400);
  }

  // Create trip in Draft status
  const trip = await prisma.trip.create({
    data: {
      vehicleId: parseInt(vehicleId),
      driverId: parseInt(driverId),
      cargoWeight: parseFloat(cargoWeight),
      status: "Draft",
      startOdo: vehicle.odometer 
    },
    include: {
      vehicle: true,
      driver: true
    }
  });

  return res.status(201).json({
    success: true,
    message: "Trip created successfully in Draft status",
    data: trip
  });
});

/**
 * DISPATCH TRIP - Move trip from Draft to Dispatched
 * Updates Vehicle and Driver status to "On Trip"
 * Uses transaction to ensure atomicity
 */
export const dispatchTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startOdo } = req.body;

  // Find trip
  const trip = await prisma.trip.findUnique({
    where: { id: parseInt(id) },
    include: { vehicle: true, driver: true }
  });

  if (!trip) {
    throw new apiError("Trip not found", 404);
  }

  if (trip.status !== "Draft") {
    throw new apiError(
      `Cannot dispatch trip with status "${trip.status}". Only Draft trips can be dispatched.`,
      400
    );
  }

  // Re-validate driver compliance before dispatch
  // License must not be expired (could have expired since trip creation)
  const today = new Date();
  if (new Date(trip.driver.licenseExpiry) < today) {
    throw new apiError(
      `Cannot dispatch trip. Driver's license expired on ${trip.driver.licenseExpiry.toLocaleDateString()}. Must update driver record first.`,
      400
    );
  }

  // Driver must not be suspended
  if (trip.driver.status === "Suspended") {
    throw new apiError(
      "Cannot dispatch trip. Assigned driver is suspended. Contact Safety Officer.",
      400
    );
  }

  // Use transaction for atomic updates
  const dispatchedTrip = await prisma.$transaction(async (tx) => {
    // Update vehicle status to "On Trip"
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "On Trip" }
    });

    // Update driver status to "On Duty"
    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "On Duty" }
    });

    // Update trip status to "Dispatched"
    const updatedTrip = await tx.trip.update({
      where: { id: parseInt(id) },
      data: {
        status: "Dispatched",
        startOdo: parseFloat(startOdo)
      },
      include: {
        vehicle: true,
        driver: true
      }
    });

    return updatedTrip;
  });

  return res.status(200).json({
    success: true,
    message: "Trip dispatched successfully. Vehicle and Driver status updated to On Trip/On Duty.",
    data: dispatchedTrip
  });
});

/**
 * COMPLETE TRIP - Move trip from Dispatched to Completed
 * Updates Vehicle and Driver status back to "Available"
 * Records final odometer reading
 * Uses transaction to ensure atomicity
 */
export const completeTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { endOdo, revenue } = req.body;

  // Find trip
  const trip = await prisma.trip.findUnique({
    where: { id: parseInt(id) },
    include: { vehicle: true, driver: true }
  });

  if (!trip) {
    throw new apiError("Trip not found", 404);
  }

  if (trip.status !== "Dispatched") {
    throw new apiError(
      `Cannot complete trip with status "${trip.status}". Only Dispatched trips can be completed.`,
      400
    );
  }

  if (parseFloat(endOdo) < trip.startOdo) {
    throw new apiError("End odometer cannot be less than start odometer", 400);
  }

  // Use transaction for atomic updates
  const completedTrip = await prisma.$transaction(async (tx) => {
    // Update vehicle status back to "Available" and update odometer
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: "Available",
        odometer: parseFloat(endOdo)
      }
    });

    // Update driver status back to "Off Duty"
    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: "Off Duty" }
    });

    // Update trip status to "Completed"
    const updatedTrip = await tx.trip.update({
      where: { id: parseInt(id) },
      data: {
        status: "Completed",
        endOdo: parseFloat(endOdo),
        revenue: revenue ? parseFloat(revenue) : trip.revenue
      },
      include: {
        vehicle: true,
        driver: true
      }
    });

    return updatedTrip;
  });

  return res.status(200).json({
    success: true,
    message: "Trip completed successfully. Vehicle and Driver status updated to Available/Off Duty.",
    data: completedTrip
  });
});

/**
 * CANCEL TRIP - Cancel a trip (only Draft or Dispatched status)
 * Uses transaction to ensure atomicity when reverting statuses
 */
export const cancelTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trip = await prisma.trip.findUnique({
    where: { id: parseInt(id) },
    include: { vehicle: true, driver: true }
  });

  if (!trip) {
    throw new apiError("Trip not found", 404);
  }

  if (!["Draft", "Dispatched"].includes(trip.status)) {
    throw new apiError(
      `Cannot cancel trip with status "${trip.status}". Only Draft and Dispatched trips can be cancelled.`,
      400
    );
  }

  // Use transaction for atomic updates
  const cancelledTrip = await prisma.$transaction(async (tx) => {
    // If trip was Dispatched, revert vehicle and driver status
    if (trip.status === "Dispatched") {
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "Available" }
      });

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: "Off Duty" }
      });
    }

    // Update trip status to "Cancelled"
    const updatedTrip = await tx.trip.update({
      where: { id: parseInt(id) },
      data: { status: "Cancelled" },
      include: {
        vehicle: true,
        driver: true
      }
    });

    return updatedTrip;
  });

  return res.status(200).json({
    success: true,
    message: "Trip cancelled successfully.",
    data: cancelledTrip
  });
});

/**
 * GET ALL TRIPS - Retrieve all trips with optional filtering
 */
export const getAllTrips = asyncHandler(async (req, res) => {
  const { status, vehicleId, driverId } = req.query;

  const where = {};
  if (status) where.status = status;
  if (vehicleId) where.vehicleId = parseInt(vehicleId);
  if (driverId) where.driverId = parseInt(driverId);

  const trips = await prisma.trip.findMany({
    where,
    include: {
      vehicle: true,
      driver: true
    },
    orderBy: { id: "desc" }
  });

  return res.status(200).json({
    success: true,
    message: "Trips retrieved successfully",
    data: trips
  });
});

/**
 * GET TRIP BY ID - Retrieve a single trip with full details
 */
export const getTripById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trip = await prisma.trip.findUnique({
    where: { id: parseInt(id) },
    include: {
      vehicle: true,
      driver: true
    }
  });

  if (!trip) {
    throw new apiError("Trip not found", 404);
  }

  return res.status(200).json({
    success: true,
    message: "Trip retrieved successfully",
    data: trip
  });
});

/**
 * UPDATE TRIP - Update trip details (only for Draft trips)
 */
export const updateTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cargoWeight, vehicleId, driverId } = req.body;

  const trip = await prisma.trip.findUnique({
    where: { id: parseInt(id) },
    include: { vehicle: true, driver: true }
  });

  if (!trip) {
    throw new apiError("Trip not found", 404);
  }

  if (trip.status !== "Draft") {
    throw new apiError(
      "Can only update trips in Draft status",
      400
    );
  }

  const updateData = {};

  if (cargoWeight !== undefined) {
    // Validate against current vehicle if not changing it
    const vehicleToCheck = vehicleId 
      ? await prisma.vehicle.findUnique({ where: { id: parseInt(vehicleId) } })
      : trip.vehicle;

    if (parseFloat(cargoWeight) > vehicleToCheck.maxLoad) {
      throw new apiError(
        `Cargo weight exceeds vehicle capacity`,
        400
      );
    }
    updateData.cargoWeight = parseFloat(cargoWeight);
  }

  if (vehicleId !== undefined) {
    const newVehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(vehicleId) }
    });

    if (!newVehicle) {
      throw new apiError("Vehicle not found", 404);
    }

    if (newVehicle.status !== "Available") {
      throw new apiError("New vehicle is not available", 400);
    }

    updateData.vehicleId = parseInt(vehicleId);
  }

  if (driverId !== undefined) {
    const newDriver = await prisma.driver.findUnique({
      where: { id: parseInt(driverId) }
    });

    if (!newDriver) {
      throw new apiError("Driver not found", 404);
    }

    if (newDriver.status === "Suspended") {
      throw new apiError("Cannot assign suspended driver", 400);
    }

    updateData.driverId = parseInt(driverId);
  }

  const updatedTrip = await prisma.trip.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      vehicle: true,
      driver: true
    }
  });

  return res.status(200).json({
    success: true,
    message: "Trip updated successfully",
    data: updatedTrip
  });
});

/**
 * DELETE TRIP - Hard delete (ADMIN and FLEET_MANAGER only)
 */
export const deleteTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const trip = await prisma.trip.findUnique({
    where: { id: parseInt(id) }
  });

  if (!trip) {
    throw new apiError("Trip not found", 404);
  }

  if (trip.status === "Dispatched") {
    throw new apiError("Cannot delete an active (Dispatched) trip", 400);
  }

  await prisma.trip.delete({
    where: { id: parseInt(id) }
  });

  return res.status(200).json({
    success: true,
    message: "Trip deleted successfully"
  });
});
