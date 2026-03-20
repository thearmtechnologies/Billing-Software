import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    businessType: {
      type: [String],
      enum: [
        "finance",
        "crane-hiring",
        "erection & fabrication",
        "barber-salon",
        "food-stall",
        "general",
      ],
      default: ["general"],
    },
    preferredPrintFormat: {
      type: [String],
      enum: ["a4", "thermal"],
      default: ["a4"],
    },
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: "India"
      },
    },
    taxId: {
      type: String,
      trim: true,
    },
    udyamNo: {
      type: String,
      trim: true,
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        trim: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
      branchName: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
      },
      upiId: {
        type: String,
        trim: true,
      },
      accountType: {
        type: String,
        enum: ["savings", "current", "salary", "other"],
        default: "savings",
      },
    },
    bankAccounts: [
      {
        accountHolderName: { type: String, trim: true, required: true },
        bankName: { type: String, trim: true, required: true },
        branchName: { type: String, trim: true },
        accountNumber: { type: String, trim: true, required: true },
        ifscCode: { type: String, trim: true, uppercase: true, required: true },
        upiId: { type: String, trim: true },
        accountType: {
          type: String,
          enum: ["savings", "current", "salary", "other"],
          default: "savings",
        },
        isPrimary: { type: Boolean, default: false },
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    IsVerified: {
      type: Boolean,
      default: false,
    },
    invoicePreferences: {
      prefix: {
        type: String,
        trim: true,
        default: "",
      },
      suffix: {
        type: String,
        trim: true,
        default: "",
      },
    },
    logoUrl: { type: String, default: '' },
    signatureUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

// Match entered password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

export default UserModel;
