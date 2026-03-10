import express from "express";
import * as userController from "../controllers/user.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { userValidator } from "../validators/user.validator.js";

const router = express.Router();

// Ensure all routes require a valid login token first
router.use(protect);

// 1. List Users
router.get("/", requirePermission("user_view"), userController.getAllUsers);

// 2. Activate/Deactivate User Status
router.patch(
  "/:id/status",
  requirePermission("user_manage"),
  validate(userValidator.toggleStatusSchema),
  userController.toggleUserStatus,
);

// 3. Assign Roles to User
router.patch("/:id/roles", requirePermission("user_manage"), userController.updateUserRoles);

// 4. Reset User Password (Admin)
router.patch("/:id/reset-password", requirePermission("user_manage"), userController.resetUserPassword);

// 5. Delete User
router.delete("/:id", requirePermission("user_manage"), userController.deleteUser);

export default router;
