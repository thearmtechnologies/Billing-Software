import mongoose from "mongoose";

// Pricing tier schema for tiered pricing
const pricingTierSchema = new mongoose.Schema({
  minValue: { 
    type: Number, 
    required: true,
    min: 0 
  },
  maxValue: { 
    type: Number, 
    default: null 
  },
  rate: { 
    type: Number, 
    required: true,
    min: 0 
  },
  rateType: { 
    type: String, 
    required: true, 
    enum: ["slabRate", "unitRate"] 
  },
});

const serviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    
    unitType: {
      type: String,
      required: true,
    },
    
    pricingType: {
      type: String,
      enum: ["fixed", "flat", "tiered"],
      default: "fixed",
      required: true,
    },
    
    baseRate: {
      type: Number,
      required: function () {
        return this.pricingType !== "tiered";
      },
      min: 0,
    },
    
    pricingTiers: [pricingTierSchema],
    
    hsnCode: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
serviceSchema.index({ user: 1, name: 1 }, { unique: true });
serviceSchema.index({ user: 1, isActive: 1 });

// Pre-save middleware to validate pricing tiers
serviceSchema.pre("save", function (next) {
  if (this.pricingType === "tiered") {
    // Validate that at least one tier exists
    if (!this.pricingTiers || this.pricingTiers.length === 0) {
      return next(new Error("At least one pricing tier is required for tiered pricing"));
    }
    
    // Validate tiers order and values
    const sortedTiers = [...this.pricingTiers].sort((a, b) => a.minValue - b.minValue);
    
    for (let i = 0; i < sortedTiers.length; i++) {
      const tier = sortedTiers[i];
      
      // Check for required fields
      if (tier.minValue === undefined || tier.rate === undefined) {
        return next(new Error("All tier fields (minValue, rate) are required"));
      }
      
      // Validate minValue is not negative
      if (tier.minValue < 0) {
        return next(new Error("Min value cannot be negative"));
      }
      
      // Validate maxValue is greater than minValue if provided
      if (tier.maxValue !== null && tier.maxValue <= tier.minValue) {
        return next(new Error("Max value must be greater than min value"));
      }
      
      // Validate tier continuity (each tier should start where previous ends)
      if (i > 0) {
        const prevTier = sortedTiers[i - 1];
        if (tier.minValue !== prevTier.maxValue) {
          return next(new Error("Tiers must be continuous (next tier minValue should equal previous tier maxValue)"));
        }
      }
    }
    
    // Replace with sorted tiers
    this.pricingTiers = sortedTiers;
  }
  
  next();
});

const ServiceModel = mongoose.model("Service", serviceSchema);

export default ServiceModel;