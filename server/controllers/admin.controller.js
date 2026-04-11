import UserModel from "../models/user.model.js";

// @desc    Get all users (Admin only)
// @route   GET /api/v1/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("_id name email businessName role isActive createdAt allowedTemplates");
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Reset user password (Admin only)
// @route   POST /api/v1/admin/reset-password/:userId
// @access  Private/Admin
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Use the schema statics method to hash password
    const hashedPassword = await UserModel.hashPassword(newPassword);
    
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update user allowed templates (Admin only)
// @route   PUT /api/v1/admin/users/:userId/templates
// @access  Private/Admin
export const updateUserTemplates = async (req, res) => {
  try {
    const { userId } = req.params;
    const { allowedTemplates } = req.body;

    if (!Array.isArray(allowedTemplates)) {
      return res.status(400).json({ success: false, message: "allowedTemplates must be an array" });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.allowedTemplates = allowedTemplates;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User templates updated successfully",
      allowedTemplates: user.allowedTemplates
    });
  } catch (error) {
    console.error("Error updating user templates:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/v1/admin/users/:userId/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      role: user.role
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
