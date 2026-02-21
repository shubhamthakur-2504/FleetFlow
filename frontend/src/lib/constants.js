// Vehicle Types - Must match backend Prisma schema enum
export const VEHICLE_TYPES = [
  { value: "Truck", label: "Truck" },
  { value: "Van", label: "Van" },
  { value: "Bike", label: "Bike" },
];

// Vehicle Statuses - Must match backend Prisma schema enum
// Values use lowercase with underscores for filtering consistency
export const VEHICLE_STATUSES = [
  { value: "available", label: "Available" },
  { value: "in_maintenance", label: "In Maintenance" },
  { value: "on_trip", label: "On Trip" },
  { value: "out_of_service", label: "Out of Service" },
];

// Trip Statuses - Must match backend Prisma schema enum
export const TRIP_STATUSES = [
  { value: "Draft", label: "Draft" },
  { value: "Dispatched", label: "On Way" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

// User Roles - Must match backend Prisma schema enum
export const USER_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "FLEET_MANAGER", label: "Fleet Manager" },
  { value: "DISPATCHER", label: "Dispatcher" },
  { value: "SAFETY_OFFICER", label: "Safety Officer" },
  { value: "FINANCIAL_ANALYSTS", label: "Financial Analyst" },
];
