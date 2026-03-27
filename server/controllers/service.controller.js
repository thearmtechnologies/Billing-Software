import mongoose from "mongoose";
import ServiceModel from "../models/service.model.js";

export const createService = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      description,
      unitType,
      pricingType,
      baseRate = 0,
      pricingTiers = [],
      hsnCode = "",
    } = req.body;

    // Validate required fields
    if (!name || !description || !unitType) {
      return res.status(400).json({
        message: "Name, description, and unit type are required fields",
      });
    }

    // Check for duplicate service name for the same user
    const existingService = await ServiceModel.findOne({
      user: userId,
      name: name.trim(),
    });

    if (existingService) {
      return res.status(409).json({
        message: `A service with the name "${name}" already exists. Please use a different name.`,
      });
    }

    // Validate baseRate for non-tiered pricing
    if (pricingType !== "tiered" && (!baseRate || baseRate < 0)) {
      return res.status(400).json({
        message: "Valid base rate is required for non-tiered pricing",
      });
    }

    // Create new service
    const service = new ServiceModel({
      user: userId,
      name: name.trim(),
      description: description.trim(),
      unitType,
      pricingType,
      baseRate: pricingType === "tiered" ? 0 : baseRate,
      pricingTiers: pricingType === "tiered" ? pricingTiers : [],
      hsnCode: hsnCode.trim(),
    });

    await service.save();

    res.status(201).json({
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Error creating service:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: errors,
      });
    }

    if (error.message.includes("pricing tier")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while creating service",
      error: error.message,
    });
  }
};

export const getServices = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 9, search = "", isActive = true } = req.query;

    const query = { user: userId };

    // Filter by active status
    if (isActive === "true" || isActive === true) query.isActive = true;
    else if (isActive === "false" || isActive === false) query.isActive = false;

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { hsnCode: { $regex: search, $options: "i" } },
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const services = await ServiceModel.find(query)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);

    const total = await ServiceModel.countDocuments(query);

    res.status(200).json({
      services,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      message: "Server error while fetching services",
      error: error.message,
    });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await ServiceModel.findOne({
      _id: id,
      user: userId,
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({
      message: "Server error while fetching service",
      error: error.message,
    });
  }
};

export const updateService = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const {
      name,
      description,
      unitType,
      pricingType,
      baseRate,
      pricingTiers,
      hsnCode,
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    // Check if service exists and belongs to user
    const existingService = await ServiceModel.findOne({
      _id: id,
      user: userId,
    });

    if (!existingService) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Check for duplicate service name (excluding current service)
    if (name && name !== existingService.name) {
      const duplicateService = await ServiceModel.findOne({
        user: userId,
        name: name.trim(),
        _id: { $ne: id },
      });

      if (duplicateService) {
        return res.status(409).json({
          message: `A service with the name "${name}" already exists. Please use a different name.`,
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (unitType !== undefined) updateData.unitType = unitType;
    if (pricingType !== undefined) updateData.pricingType = pricingType;
    if (hsnCode !== undefined) updateData.hsnCode = hsnCode.trim();

    // Handle pricing data based on pricing type
    if (pricingType === "tiered") {
      updateData.baseRate = 0;
      updateData.pricingTiers = pricingTiers || [];
    } else if (pricingType || baseRate !== undefined) {
      updateData.baseRate = baseRate || 0;
      updateData.pricingTiers = [];
    }

    const updatedService = await ServiceModel.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Error updating service:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: errors,
      });
    }

    if (error.message.includes("pricing tier")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while updating service",
      error: error.message,
    });
  }
};

export const deleteService = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const deletedService = await ServiceModel.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!deletedService) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({
      message: "Service deleted successfully",
      service: deletedService,
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({
      message: "Server error while deleting service",
      error: error.message,
    });
  }
};

export const toggleServiceActive = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await ServiceModel.findOne({
      _id: id,
      user: userId,
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.status(200).json({
      message: `Service ${
        service.isActive ? "activated" : "deactivated"
      } successfully`,
      service,
    });
  } catch (error) {
    console.error("Error toggling service status:", error);
    res.status(500).json({
      message: "Server error while updating service status",
      error: error.message,
    });
  }
};
