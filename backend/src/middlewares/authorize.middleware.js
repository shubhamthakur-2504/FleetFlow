/**
 * Authorization Middleware - Checks if user has required role(s)
 * @param {...string} requiredRoles - One or more roles that are allowed
 * @returns {Function} Express middleware
 * 
 * Usage: 
 *   router.post("/", authorize("ADMIN", "FLEET_MANAGER"), controller)
 */
export const authorize = (...requiredRoles) => {
  return (req, res, next) => {
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      });
    }

    // Check if user's role is in the required roles list
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Insufficient permissions. Required roles: ${requiredRoles.join(", ")}. Your role: ${req.user.role}`,
        requiredRoles,
        userRole: req.user.role
      });
    }

    // User has required role, proceed to next middleware/controller
    next();
  };
};
