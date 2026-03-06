import User from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";

// @desc    Get All Users
// @route   GET /api/v1/users
export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find().populate("roles", "name").select("-otp -passwordResetToken -passwordResetExpires");

  res.status(200).json({
    status: "success",
    results: users.length,
    data: users,
  });
});

// @desc    Toggle User Active Status
// @route   PATCH /api/v1/users/:id/status
export const toggleUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }

  if (user.username === "super_admin") {
    return res.status(403).json({ status: "fail", message: "Super admin status cannot be modified." });
  }

  user.isActive = isActive;
  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: "success",
    message: `User has been ${isActive ? "activated" : "deactivated"}.`,
    data: { id: user._id, isActive: user.isActive },
  });
});

// @desc    Assign Roles to User
// @route   PATCH /api/v1/users/:id/roles
export const updateUserRoles = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { roles } = req.body; // Expecting an array of Role IDs

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }

  if (user.username === "super_admin") {
    return res.status(403).json({
      status: "fail",
      message: "Super admin roles cannot be modified.",
    });
  }

  user.roles = roles;
  await user.save({ validateModifiedOnly: true });

  const updatedUser = await user.populate("roles", "name");

  res.status(200).json({
    status: "success",
    message: "Roles updated successfully",
    data: updatedUser,
  });
});

// @desc    Reset User Password (Admin Action)
// @route   PATCH /api/v1/users/:id/reset-password
export const resetUserPassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }

  if (user.username === "super_admin") {
    return res.status(403).json({ status: "fail", message: "Super admin password cannot be reset." });
  }

  // Set the new password - Mongoose 'pre-save' hook will hash this automatically
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    status: "success",
    message: `Password for ${user.username} has been reset.`,
  });
});

// @desc    Delete User
// @route   DELETE /api/v1/users/:id
export const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ status: "fail", message: "User not found" });
  }

  // Safety check: Never delete the Super Admin
  if (user.username === "super_admin") {
    return res
      .status(403)
      .json({ status: "fail", message: "Super admin cannot be deleted." });
  }

  await User.findByIdAndDelete(id);

  res.status(204).send();
});
