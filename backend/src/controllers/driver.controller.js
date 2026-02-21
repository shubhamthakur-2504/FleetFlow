import prisma from "../db/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/api-error.js";

/**
 * CREATE DRIVER - Add a new driver to the system
 * Validates: Name is unique, license expiry is future date
 */
export const createDriver = asyncHandler(async (req, res) => {
  const { name, licenseExpiry } = req.body;

  // Validate license expiry is a future date
  const expiryDate = new Date(licenseExpiry);
  if (expiryDate <= new Date()) {
    throw new apiError("License expiry date must be in the future", 400);
  }

  const driver = await prisma.driver.create({
    data: {
      name,
      licenseExpiry: expiryDate,
      status: "Off Duty",
      safetyScore: 100.0
    }
  });

  return res.status(201).json({
    success: true,
    message: "Driver created successfully",
    data: driver
  });
});

/**
 * GET ALL DRIVERS - Retrieve driver list with optional filters
 * Can filter by: status, licenseExpiry status
 */
export const getAllDrivers = asyncHandler(async (req, res) => {
  const { status, suspended } = req.query;

  const whereClause = {};

  if (status) {
    whereClause.status = status;
  }

  // Filter by license expiry status (expired, expiring soon, valid)
  if (suspended === "true") {
    whereClause.status = "Suspended";
  }

  const drivers = await prisma.driver.findMany({
    where: whereClause,
    orderBy: { id: "asc" },
    include: {
      trips: {
        select: { id: true, status: true, cargoWeight: true }
      }
    }
  });

  // Add computed fields for license status
  const driversWithStatus = drivers.map((driver) => {
    const expiryDate = new Date(driver.licenseExpiry);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

    return {
      ...driver,
      licenseStatus: daysUntilExpiry < 0 ? "Expired" : daysUntilExpiry < 30 ? "Expiring Soon" : "Valid",
      daysUntilExpiry
    };
  });

  return res.status(200).json({
    success: true,
    message: "Drivers retrieved successfully",
    data: driversWithStatus,
    total: driversWithStatus.length
  });
});

/**
 * GET DRIVER BY ID - Retrieve a specific driver's details
 */
export const getDriverById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const driver = await prisma.driver.findUnique({
    where: { id: parseInt(id) },
    include: {
      trips: {
        select: {
          id: true,
          status: true,
          cargoWeight: true,
          vehicle: { select: { licensePlate: true, model: true } },
          startOdo: true,
          endOdo: true,
          revenue: true
        }
      }
    }
  });

  if (!driver) {
    throw new apiError("Driver not found", 404);
  }

  // Add computed license status
  const expiryDate = new Date(driver.licenseExpiry);
  const today = new Date();
  const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));

  return res.status(200).json({
    success: true,
    message: "Driver retrieved successfully",
    data: {
      ...driver,
      licenseStatus: daysUntilExpiry < 0 ? "Expired" : daysUntilExpiry < 30 ? "Expiring Soon" : "Valid",
      daysUntilExpiry
    }
  });
});

/**
 * UPDATE DRIVER - Modify driver details
 * Can update: name, safetyScore
 * License expiry requires special validation
 */
export const updateDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, safetyScore, licenseExpiry } = req.body;

  // Verify driver exists
  const driver = await prisma.driver.findUnique({
    where: { id: parseInt(id) }
  });

  if (!driver) {
    throw new apiError("Driver not found", 404);
  }

  // Prepare update data
  const updateData = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (safetyScore !== undefined) {
    if (safetyScore < 0 || safetyScore > 100) {
      throw new apiError("Safety score must be between 0 and 100", 400);
    }
    updateData.safetyScore = parseFloat(safetyScore);
  }

  if (licenseExpiry !== undefined) {
    const expiryDate = new Date(licenseExpiry);
    if (expiryDate <= new Date()) {
      throw new apiError("License expiry date must be in the future", 400);
    }
    updateData.licenseExpiry = expiryDate;
  }

  const updatedDriver = await prisma.driver.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      trips: { select: { id: true, status: true } }
    }
  });

  return res.status(200).json({
    success: true,
    message: "Driver updated successfully",
    data: updatedDriver
  });
});

/**
 * UPDATE DRIVER STATUS - Change driver status (On Duty, Off Duty, Suspended)
 * Can be used to suspend/reinstate drivers
 */
export const updateDriverStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Verify driver exists
  const driver = await prisma.driver.findUnique({
    where: { id: parseInt(id) }
  });

  if (!driver) {
    throw new apiError("Driver not found", 404);
  }

  // Validate status
  const validStatuses = ["On Duty", "Off Duty", "Suspended"];
  if (!validStatuses.includes(status)) {
    throw new apiError(
      `Status must be one of: ${validStatuses.join(", ")}`,
      400
    );
  }

  // Prevent status change if driver is on an active trip
  if (status !== "On Duty") {
    const activeTrip = await prisma.trip.findFirst({
      where: {
        driverId: parseInt(id),
        status: "Dispatched"
      }
    });

    if (activeTrip) {
      throw new apiError(
        "Cannot change status while driver is on an active trip",
        400
      );
    }
  }

  const updatedDriver = await prisma.driver.update({
    where: { id: parseInt(id) },
    data: { status }
  });

  return res.status(200).json({
    success: true,
    message: `Driver status updated to ${status}`,
    data: updatedDriver
  });
});

/**
 * DELETE DRIVER - Remove a driver from the system
 * Cannot delete if driver has active trips
 */
export const deleteDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify driver exists
  const driver = await prisma.driver.findUnique({
    where: { id: parseInt(id) },
    include: { trips: true }
  });

  if (!driver) {
    throw new apiError("Driver not found", 404);
  }

  // Check for active trips
  const activeTrips = driver.trips.filter((trip) => trip.status === "Dispatched");
  if (activeTrips.length > 0) {
    throw new apiError(
      "Cannot delete driver with active trips. Complete or cancel all trips first.",
      400
    );
  }

  // Delete driver
  await prisma.driver.delete({
    where: { id: parseInt(id) }
  });

  return res.status(200).json({
    success: true,
    message: "Driver deleted successfully",
    data: { id: parseInt(id) }
  });
});

/**
 * GET DRIVERS NEEDING LICENSE RENEWAL - Safety Officer utility
 * Returns drivers with licenses expiring within 30 days
 */
export const getDriversNeedingRenewal = asyncHandler(async (req, res) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const drivers = await prisma.driver.findMany({
    where: {
      licenseExpiry: {
        lte: thirtyDaysFromNow,
        gt: today
      }
    },
    orderBy: { licenseExpiry: "asc" }
  });

  const driversWithDays = drivers.map((driver) => {
    const expiryDate = new Date(driver.licenseExpiry);
    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
    return {
      ...driver,
      daysUntilExpiry
    };
  });

  return res.status(200).json({
    success: true,
    message: "Drivers needing license renewal",
    data: driversWithDays,
    total: driversWithDays.length
  });
});
