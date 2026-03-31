import mongoose from "mongoose";

// Pricing tier for tiered pricing inside invoice items
const pricingTierSchema = new mongoose.Schema({
  minValue: { type: Number, required: true },
  maxValue: { type: Number, default: null },
  rate: { type: Number, required: true },
  rateType: { type: String, required: true, enum: ["slabRate", "unitRate"] },
});

const invoiceItemSchema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service", 
    required: false,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },

  hsnCode: {
    type: String,
    required: false,
    trim: true,
  },

  quantity: { type: Number, required: true, min: 0 },

  unitType: {
    type: String,
    required: true,
  },

  pricingType: {
    type: String,
    enum: ["fixed", "flat", "tiered"],
    default: "fixed",
  },

  baseRate: {
    type: Number,
    required: function () {
      return this.pricingType !== "tiered";
    },
  },

  pricingTiers: [pricingTierSchema],

  notes: String,
  workDates: [{ type: Date }],

  subtotal: Number,
});

// Tax Schema (for CGST, SGST, IGST, GST etc.)
const taxSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., CGST, SGST, IGST, VAT
  rate: { type: Number, default: 0, min: 0, max: 100 }, // percentage
  amount: { type: Number, default: 0, min: 0 }, // calculated amount
});

// Payment History Schema
const paymentHistorySchema = new mongoose.Schema({
  paymentDate: { type: Date, default: Date.now },
  amountPaid: { type: Number, required: true, min: 0 },
  paymentMode: {
    type: String,
    enum: ["cash", "bank-transfer", "upi", "cheque", "other"],
    default: "cash",
  },
  notes: { type: String },
  recordedBy: { type: String }, // Optional user info (admin or staff name)
  balanceDueAfter: { type: Number, required: true }, // Remaining due after this payment
});

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    invoiceNumber: { type: String, required: true },

    invoiceDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    shippingAddress: {
      type: String,
      required: false,
    },

    items: [invoiceItemSchema],

    bankDetails: {
      accountHolderName: String,
      bankName: String,
      branchName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String,
      accountType: String,
    },

    // Totals
    subtotal: { type: Number, required: true, min: 0 },

    // Bill-level discount
    discount: { type: Number, default: 0, min: 0 },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "fixed",
    },

    // Bill-level tax
    taxes: [taxSchema], // array of taxes applied

    // Payment tracking
    amountPaid: { type: Number, default: 0, min: 0 },
    amountDue: { type: Number, default: 0, min: 0 },

    paymentHistory: [paymentHistorySchema],

    includeLogo: { type: Boolean, default: true },
    includeSignature: { type: Boolean, default: true },

    totalTax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ["draft", "sent", "paid", "overdue", "cancelled", "partial"],
      default: "draft",
    },

    dueDate: Date,
    paidDate: Date,
    notes: String,

    lastSmsSentAt: { type: Date },
    lastEmailSentAt: { type: Date },

    businessType: {
      type: String,
      enum: ["crane-hire", "barber-salon", "food-stall", "general"],
      default: "general",
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.pre("save", function(next) {
  // Always calculate amount due
  this.amountDue = Math.max(0, this.totalAmount - this.amountPaid);
  
  // Define statuses that should NEVER be auto-updated by payment changes
  const manualStatuses = ["cancelled", "overdue"];
  
  // Only auto-update status if:
  // - Payment amount changed AND
  // - Status is not being explicitly set in this save operation AND  
  // - Current status is not a manual status
  const isPaymentChange = this.isModified('amountPaid');
  const isStatusChange = this.isModified('status');
  const isManualStatus = manualStatuses.includes(this.status);
  
  if (isPaymentChange && !isStatusChange && !isManualStatus) {
    if (this.amountPaid <= 0) {
      this.status = this.isNew ? "draft" : "sent";
    } else if (this.amountPaid > 0 && this.amountPaid < this.totalAmount) {
      this.status = "partial";
    } else if (this.amountPaid >= this.totalAmount) {
      this.status = "paid";
      this.paidDate = this.paidDate || new Date();
    }
  }
  
  next();
});

const InvoiceModel = mongoose.model("Invoice", invoiceSchema);

export default InvoiceModel;
