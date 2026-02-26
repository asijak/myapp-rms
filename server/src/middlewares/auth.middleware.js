import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Already correctly using "roles"
    const user = await User.findById(decoded.id).populate("roles");

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// ✅ UPDATED: Now checks across ALL assigned roles for a permission
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: "Forbidden: No roles found" });
    }

    // Check if ANY of the user's roles contains the required permission
    const hasPermission = req.user.roles.some((role) =>
      role.permissions?.includes(permission),
    );

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

// ✅ UPDATED: Now checks if ANY of the user's roles matches the allowed list
export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return res.status(403).json({ message: "Access Denied" });
    }

    // Extract names from the roles array and check for a match
    const userRoleNames = req.user.roles.map((role) => role.name);
    const hasRole = allowedRoles.some((role) => userRoleNames.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        message:
          "Access Denied: You do not have permission to perform this action.",
      });
    }
    next();
  };
};
