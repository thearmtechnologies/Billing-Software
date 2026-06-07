import mongoose from "mongoose";
import InvoiceModel, { isTimeBasedUnit } from "../models/invoice.model.js";

// Helper: Tiered pricing calculation
const calcTieredAmount = (item) => {
  const effectiveQty = item.quantityDecimal || item.quantity || 0;
  if (!item.pricingTiers?.length || effectiveQty <= 0) return 0;

  const tiers = [...item.pricingTiers]
    .map((t) => ({
      ...t,
      minValue: Number(t.minValue ?? 0),
      maxValue:
        t.maxValue === "" || t.maxValue == null ? Infinity : Number(t.maxValue),
      rate: Number(t.rate ?? 0),
      rateType: t.rateType || "slabRate", // "slabRate" | "unitRate"
    }))
    .sort((a, b) => a.minValue - b.minValue);

  let total = 0;
  let lastCoveredMax = 0;

  for (const tier of tiers) {
    if (effectiveQty < tier.minValue) continue;

    if (tier.rateType === "slabRate") {
      if (effectiveQty <= tier.maxValue) {
        return tier.rate;
      } else {
        total = tier.rate;
        lastCoveredMax = tier.maxValue;
      }
    } else {
      const start = Math.max(tier.minValue, lastCoveredMax);
      const end = Math.min(effectiveQty, tier.maxValue);
      const applicableQty = Math.max(0, end - start);
      total += applicableQty * tier.rate;

      if (effectiveQty <= tier.maxValue) return total;
    }
  }

  return total;
};

// Helper: Convert time notation (HH.MM) to decimal hours
const convertTimeNotationToDecimalHours = (quantity, unitType) => {
  if (!unitType) return Number(quantity) || 0;

  const normalizedUnit = unitType.toLowerCase().trim();
  const timeUnits = [
    "hour",
    "hours",
    "hr",
    "hrs",
    "minute",
    "minutes",
    "min",
    "mins",
  ];

  // If not time-based, return as-is
  if (!timeUnits.includes(normalizedUnit)) {
    return Number(quantity) || 0;
  }

  // Convert time notation (e.g., "1.30" for 1hr 30min) to decimal hours
  const qtyStr = quantity?.toString() || "0";
  const [hours, minutes = "0"] = qtyStr.split(".");
  const hrs = parseInt(hours, 10) || 0;
  const mins = parseInt(minutes, 10) || 0;

  if (mins >= 60) {
    throw new Error(
      `Invalid time notation: minutes cannot exceed 59 in "${quantity}"`,
    );
  }

  // Convert minutes from base-60 to decimal (base-100)
  return hrs + mins / 60;
};

// Helper: Calculate item subtotal based on pricing type
const calculateItemSubtotal = (item) => {
  // Get effective quantity (priority: quantityDecimal > calculate from quantity)
  let effectiveQty;

  if (item.quantityDecimal !== undefined && item.quantityDecimal !== null) {
    effectiveQty = Number(item.quantityDecimal);
  } else {
    // For backward compatibility: calculate quantityDecimal from quantity
    effectiveQty = convertTimeNotationToDecimalHours(
      item.quantity,
      item.unitType,
    );
  }

  // Calculate based on pricing type
  if (item.pricingType === "flat") {
    return Number(item.baseRate) || 0;
  }

  if (item.pricingType === "tiered") {
    // Pass the item with effective quantity for tiered calculation
    const itemWithEffectiveQty = {
      ...item,
      quantity: effectiveQty, // Temporarily override for calculation
      quantityDecimal: effectiveQty,
    };
    return calcTieredAmount(itemWithEffectiveQty);
  }

  // Fixed pricing
  return effectiveQty * (Number(item.baseRate) || 0);
};

export const createInvoice = async (req, res) => {
  console.log(req.body);
  try {
    const userId = req.user._id;
    const {
      invoiceNumber,
      invoiceDate,
      client,
      items,
      status,
      dueDate,
      paidDate,
      notes,
      businessType,
      discount = 0,
      discountType = "fixed",
      taxes = [],
      bankDetails,
      shippingAddress,
      customFields,
    } = req.body;

    // Validate required fields
    if (!invoiceNumber || !client || !items || !items.length) {
      return res.status(400).json({
        message:
          "Missing required fields: invoiceNumber, client, and items are required",
      });
    }

    // Prevent duplicate invoice number
    const duplicateInvoice = await InvoiceModel.findOne({
      invoiceNumber,
      user: userId,
    });

    if (duplicateInvoice) {
      return res.status(409).json({
        message: `Invoice number "${invoiceNumber}" already exists. Please use a unique invoice number.`,
      });
    }

    // Process items: calculate subtotals and prepare final items
    let subtotal = 0;
    const updatedItems = (items || []).map((item) => {
      try {
        // Get values from frontend with proper handling
        let quantityDecimal = Number(item.quantityDecimal) || 0;
        let quantityDisplay = item.quantityDisplay || null;
        let quantityLegacy = Number(item.quantity) || 0;

        const isTimeUnit = isTimeBasedUnit(item.unitType);

        // If it's a time unit but quantityDisplay is missing, create it from quantity
        if (isTimeUnit && !quantityDisplay && quantityLegacy) {
          // Format the legacy quantity (e.g., 4.3 -> "4.30")
          const qtyStr = quantityLegacy.toString();
          const [hours, minutes = "0"] = qtyStr.split(".");
          const paddedMinutes = minutes.padStart(2, "0");
          quantityDisplay = `${hours}.${paddedMinutes}`;
        }

        // If quantityDecimal is 0 but quantity exists (legacy data), calculate it
        if (quantityDecimal === 0 && quantityLegacy !== 0) {
          quantityDecimal = convertTimeNotationToDecimalHours(
            quantityLegacy,
            item.unitType,
          );
          console.log(
            `Calculated quantityDecimal for "${item.description}": ${quantityLegacy} -> ${quantityDecimal}`,
          );
        }

        // Validate that we have valid quantity for calculation
        if (quantityDecimal === 0 && quantityLegacy !== 0) {
          console.warn(
            `Item "${item.description}" has quantity ${quantityLegacy} but quantityDecimal is 0 after calculation`,
          );
        }

        // For non-time units, ensure quantityDisplay matches quantity if not provided
        if (!isTimeUnit && !quantityDisplay && quantityLegacy) {
          quantityDisplay = quantityLegacy.toString();
        }

        // Calculate subtotal for this item using quantityDecimal
        const itemSubtotal = calculateItemSubtotal({
          ...item,
          quantityDecimal,
        });

        subtotal += itemSubtotal;

        // Return enriched item with all three quantity fields
        return {
          service: item.service || null,
          description: item.description,
          hsnCode: item.hsnCode?.trim() || "",
          quantity: quantityLegacy, // Legacy quantity (number)
          quantityDisplay: quantityDisplay, // Display quantity (string "4.30" for time units)
          quantityDecimal: quantityDecimal, // Decimal value for calculations (number 4.5)
          unitType: item.unitType,
          pricingType: item.pricingType || "fixed",
          baseRate: item.baseRate || 0,
          pricingTiers: item.pricingTiers || [],
          notes: item.notes || "",
          workDates: item.workDates || [],
          subtotal: itemSubtotal,
        };
      } catch (error) {
        throw new Error(
          `Error processing item "${item.description}": ${error.message}`,
        );
      }
    });

    // Apply bill-level discount
    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = Number(discount) || 0;
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount);

    // Apply bill-level taxes
    let totalTax = 0;
    const updatedTaxes = (taxes || []).map((tax) => {
      const rate = Number(tax.rate || 0);
      const amount = (afterDiscount * rate) / 100;
      totalTax += amount;
      return {
        name: tax.name,
        rate: rate,
        amount: amount,
      };
    });

    // Final total
    const totalAmount = afterDiscount + totalTax;

    // Calculate initial amount due (assuming no payment yet)
    const amountDue = totalAmount;

    // Create invoice
    const invoice = new InvoiceModel({
      user: userId,
      invoiceNumber,
      invoiceDate: invoiceDate || new Date(),
      client,
      items: updatedItems,
      subtotal,
      discount: Number(discount) || 0,
      discountType,
      taxes: updatedTaxes,
      totalTax,
      totalAmount,
      amountDue, // Initial due amount
      amountPaid: 0, // No payment yet
      paymentHistory: [],
      customFields: customFields || [],
      status: status || "draft",
      dueDate: dueDate || null,
      paidDate: paidDate || null,
      notes: notes || "",
      businessType: businessType || "general",
      bankDetails: bankDetails || {},
      shippingAddress: shippingAddress || "",
    });

    await invoice.save();

    // Return success response with formatted invoice data
    res.status(201).json({
      message: "Invoice created successfully",
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        client: invoice.client,
        subtotal: invoice.subtotal,
        discount: invoice.discount,
        discountType: invoice.discountType,
        totalTax: invoice.totalTax,
        totalAmount: invoice.totalAmount,
        amountDue: invoice.amountDue,
        status: invoice.status,
        dueDate: invoice.dueDate,
        items: invoice.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          quantityDisplay: item.quantityDisplay,
          quantityDecimal: item.quantityDecimal,
          unitType: item.unitType,
          baseRate: item.baseRate,
          subtotal: item.subtotal,
        })),
      },
    });
  } catch (error) {
    console.error("Error creating invoice:", error);

    // Handle specific error types
    if (error.message.includes("Error processing item")) {
      return res.status(400).json({
        message: error.message,
        error: "INVALID_ITEM_DATA",
      });
    }

    if (error.message.includes("Invalid time notation")) {
      return res.status(400).json({
        message: error.message,
        error: "INVALID_TIME_FORMAT",
      });
    }

    res.status(500).json({
      message: "Server error while creating invoice",
      error: error.message,
    });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const userId = req.user._id;

    const invoices = await InvoiceModel.find({ user: userId }).populate(
      "client",
    );
    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const invoice = await InvoiceModel.findOne({
      _id: id,
      user: userId,
    }).populate("client");

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  console.log(req.body)
  try {
    const userId = req.user._id;
    const { id } = req.params;
    let data = { ...req.body };
    console.log(data);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }

    // Prevent duplicate invoice number (excluding current one)
    if (data.invoiceNumber) {
      const duplicateInvoice = await InvoiceModel.findOne({
        invoiceNumber: data.invoiceNumber,
        user: userId,
        _id: { $ne: id }, // exclude current invoice
      });
      if (duplicateInvoice) {
        return res.status(409).json({
          message: `Invoice number "${data.invoiceNumber}" already exists. Please use a unique invoice number.`,
        });
      }
    }

    const invoice = await InvoiceModel.findOne({ _id: id, user: userId });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Helper: Calculate item subtotal (same as in create)
    const calculateItemSubtotal = (item) => {
      if (item.pricingType === "flat") {
        return Number(item.baseRate) || 0;
      }

      if (item.pricingType === "tiered") {
        return calcTieredAmount(item);
      }

      // Use quantityDecimal for fixed pricing
      const quantityDecimal = Number(item.quantityDecimal) || 0;
      return quantityDecimal * (Number(item.baseRate) || 0);
    };

    // Helper: Format time notation with 2-digit minutes for display
    const formatTimeNotation = (decimal) => {
      const hours = Math.floor(decimal);
      const minutes = Math.round((decimal - hours) * 60);
      const validMinutes = Math.min(59, Math.max(0, minutes));
      const paddedMinutes = validMinutes.toString().padStart(2, "0");
      return `${hours}.${paddedMinutes}`;
    };

    // Helper: Convert decimal to time notation number (legacy format)
    const convertDecimalToTimeNotation = (decimal) => {
      const hours = Math.floor(decimal);
      const minutes = Math.round((decimal - hours) * 60);
      const validMinutes = Math.min(59, Math.max(0, minutes));
      return parseFloat(`${hours}.${validMinutes}`);
    };

    // Helper: Check if unit is time-based
    const isTimeBasedUnit = (unit) => {
      if (!unit) return false;
      const timeUnits = [
        "hour",
        "hours",
        "hr",
        "hrs",
        "minute",
        "minutes",
        "min",
        "mins",
      ];
      return timeUnits.includes(unit.toLowerCase().trim());
    };

    // If items are updated, recalc totals
    if (data.items) {
      let subtotal = 0;

      const updatedItems = data.items.map((item) => {
        try {
          // Get all three quantity fields from frontend
          let quantityLegacy = Number(item.quantity) || 0;
          let quantityDisplay = item.quantityDisplay || null;
          let quantityDecimal = Number(item.quantityDecimal) || 0;

          const isTimeUnit = isTimeBasedUnit(item.unitType);

          // If it's a time unit but quantityDisplay is missing, create it from quantityDecimal
          if (isTimeUnit && !quantityDisplay && quantityDecimal) {
            quantityDisplay = formatTimeNotation(quantityDecimal);
          }

          // If quantityDecimal is 0 but quantityLegacy exists (backward compatibility)
          if (quantityDecimal === 0 && quantityLegacy !== 0) {
            // For time units, quantityLegacy might be in time notation (e.g., 4.3)
            if (isTimeUnit) {
              // Convert from time notation to decimal
              const qtyStr = quantityLegacy.toString();
              const [hours, minutes = "0"] = qtyStr.split(".");
              const hrs = parseInt(hours, 10) || 0;
              const mins = parseInt(minutes, 10) || 0;
              quantityDecimal = hrs + mins / 60;
              // Also create quantityDisplay if missing
              if (!quantityDisplay) {
                const paddedMinutes = minutes.toString().padStart(2, "0");
                quantityDisplay = `${hrs}.${paddedMinutes}`;
              }
            } else {
              quantityDecimal = quantityLegacy;
              quantityDisplay = quantityLegacy.toString();
            }
          }

          // For non-time units, ensure quantityDisplay matches quantityDecimal if not provided
          if (!isTimeUnit && !quantityDisplay && quantityDecimal) {
            quantityDisplay = quantityDecimal.toString();
          }

          // Validate that we have valid quantity for calculation
          if (quantityDecimal === 0 && quantityLegacy !== 0) {
            console.warn(
              `Item "${item.description}" has quantity ${quantityLegacy} but quantityDecimal is 0 after processing`,
            );
          }

          // Calculate subtotal using quantityDecimal
          const itemSubtotal = calculateItemSubtotal({
            ...item,
            quantityDecimal,
          });

          subtotal += itemSubtotal;

          // Prepare the item for storage with all three quantity fields
          return {
            service: item.service || null,
            description: item.description,
            hsnCode: item.hsnCode?.trim() || "",
            quantity: quantityLegacy, // Legacy quantity (number) - for backward compatibility
            quantityDisplay: quantityDisplay, // Display quantity (string "4.30" for time units)
            quantityDecimal: quantityDecimal, // Decimal value for calculations (number 4.5)
            unitType: item.unitType,
            pricingType: item.pricingType || "fixed",
            baseRate: item.baseRate || 0,
            pricingTiers: item.pricingTiers || [],
            notes: item.notes || "",
            workDates: item.workDates || [],
            subtotal: itemSubtotal,
          };
        } catch (error) {
          throw new Error(
            `Error processing item "${item.description}": ${error.message}`,
          );
        }
      });

      // Bill-level discount
      let discountAmount = 0;
      const discountType =
        data.discountType !== undefined
          ? data.discountType
          : invoice.discountType;
      const discount =
        data.discount !== undefined ? data.discount : invoice.discount;

      if (discountType === "percentage") {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = Number(discount) || 0;
      }
      const afterDiscount = Math.max(0, subtotal - discountAmount);

      // Bill-level taxes
      let totalTax = 0;
      const taxesToUse = data.taxes !== undefined ? data.taxes : invoice.taxes;

      const updatedTaxes = (taxesToUse || []).map((tax) => {
        const rate = Number(tax.rate || 0);
        const amount = (afterDiscount * rate) / 100;
        totalTax += amount;
        return {
          name: tax.name,
          rate: rate,
          amount: amount,
        };
      });

      // Assign updated values to invoice
      invoice.items = updatedItems;
      invoice.subtotal = subtotal;
      invoice.discount = discount;
      invoice.discountType = discountType;
      invoice.taxes = updatedTaxes;
      invoice.totalTax = totalTax;
      invoice.totalAmount = afterDiscount + totalTax;
    }

    // Update other fields (except those already handled)
    let autoAddedPayment = false;
    let paymentAmountToAdd = 0;
    let oldStatus = invoice.status;

    // Handle each field update
    const fieldsToSkip = [
      "items",
      "taxes",
      "discount",
      "discountType",
      "subtotal",
      "totalTax",
      "totalAmount",
    ];

    // Also handle customFields separately to ensure proper format
    if (data.customFields !== undefined) {
      invoice.customFields = (data.customFields || []).filter(
        (f) => f.label?.trim() && f.value?.trim(),
      );
    }

    Object.keys(data).forEach((key) => {
      if (
        !fieldsToSkip.includes(key) &&
        data[key] !== undefined &&
        key !== "customFields"
      ) {
        // Intercept explicit UI updates to "paid" status
        if (
          key === "status" &&
          data.status === "paid" &&
          oldStatus !== "paid"
        ) {
          const remainingAmount = Math.max(
            0,
            invoice.totalAmount - invoice.amountPaid,
          );
          if (remainingAmount > 0) {
            autoAddedPayment = true;
            paymentAmountToAdd = remainingAmount;
          }
        }
        invoice[key] = data[key];
      }
    });

    // Handle automatic payment recording when status changes to paid
    if (autoAddedPayment) {
      invoice.amountPaid += paymentAmountToAdd;
      invoice.amountDue = Math.max(0, invoice.totalAmount - invoice.amountPaid);
      invoice.paymentHistory.push({
        amountPaid: paymentAmountToAdd,
        paymentMode: "other",
        notes: "Auto-recorded from status change to Paid",
        recordedBy: req.user?.name || req.user?.email || "System",
        balanceDueAfter: invoice.totalAmount - invoice.amountPaid,
        paymentDate: new Date(),
      });
      invoice.paidDate = new Date();
    } else {
      // Recalculate amount due if payments were modified
      if (data.amountPaid !== undefined || data.paymentHistory !== undefined) {
        invoice.amountDue = Math.max(
          0,
          invoice.totalAmount - invoice.amountPaid,
        );
      }
    }

    // Ensure amountDue is always up to date
    invoice.amountDue = Math.max(0, invoice.totalAmount - invoice.amountPaid);

    // Save the updated invoice
    const updatedInvoice = await invoice.save();
    await updatedInvoice.populate("client");

    res.status(200).json({
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);

    // Handle specific error types
    if (error.message.includes("Error processing item")) {
      return res.status(400).json({
        message: error.message,
        error: "INVALID_ITEM_DATA",
      });
    }

    if (error.message.includes("Invalid time notation")) {
      return res.status(400).json({
        message: error.message,
        error: "INVALID_TIME_FORMAT",
      });
    }

    res.status(500).json({
      message: "Server error while updating invoice",
      error: error.message,
    });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const deleted = await InvoiceModel.findOneAndDelete({
      user: userId,
      _id: id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.status(200).json({ message: "Invoice deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteInvoiceItem = async (req, res) => {
  try {
    const { invoiceId, itemId } = req.params;

    // Find the invoice first
    let invoice = await InvoiceModel.findOne({
      _id: invoiceId,
      user: req.user._id,
    });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Find item index
    const itemIndex = invoice.items.findIndex(
      (item) => item._id.toString() === itemId,
    );
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Remove the item
    invoice.items.splice(itemIndex, 1);

    // Recalculate total
    let subtotal = 0;
    let total = 0;
    let discountAmount = 0;
    let taxAmount = 0;
    invoice.items.forEach((item) => {
      discountAmount += item.discount;
      subtotal += item.subtotal;
      taxAmount += item.taxAmount;
      total += item.total;
    });

    invoice.totalDiscount = discountAmount;
    invoice.subtotal = subtotal;
    invoice.totalTax = taxAmount;
    invoice.totalAmount = total;

    // Save updated invoice
    await invoice.save();

    res.status(200).json({
      message: "Item deleted successfully ",
      invoice,
    });
  } catch (error) {
    console.error("Error deleting invoice item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Payment Controllers

// Helper function for precise decimal arithmetic
const toPrecision = (num) => {
  return Math.round(num * 100) / 100;
};

// Helper function to compare amounts with tolerance
const isAmountValidWithTolerance = (amount, maxAmount, tolerance = 0.009) => {
  const roundedAmount = toPrecision(parseFloat(amount));
  const roundedMax = toPrecision(maxAmount);
  return roundedAmount <= roundedMax + tolerance;
};

export const addPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const {
      amount,
      paymentMode = "bank-transfer",
      notes,
      recordedBy,
      paymentDate,
    } = req.body;

    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Payment amount must be greater than 0" });
    }

    const invoice = await InvoiceModel.findOne({ _id: id, user: userId });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Calculate remaining balance with precision
    const currentAmountPaid = toPrecision(invoice.amountPaid);
    const totalAmount = toPrecision(invoice.totalAmount);
    const remainingBalance = toPrecision(totalAmount - currentAmountPaid);

    // Check if payment amount is valid with tolerance
    if (!isAmountValidWithTolerance(paymentAmount, remainingBalance)) {
      return res.status(400).json({
        message: `Payment would exceed total amount. Maximum allowed: ${remainingBalance.toFixed(2)}`,
      });
    }

    // Adjust amount if it's within tolerance but slightly over
    let finalAmount = paymentAmount;
    if (
      paymentAmount > remainingBalance &&
      paymentAmount <= remainingBalance + 0.009
    ) {
      finalAmount = remainingBalance;
    }

    const newTotalPaid = toPrecision(currentAmountPaid + finalAmount);
    const balanceDueAfter = toPrecision(
      Math.max(0, totalAmount - newTotalPaid),
    );

    // Create payment history record
    const paymentRecord = {
      amountPaid: toPrecision(finalAmount),
      paymentMode,
      notes: notes || "",
      recordedBy: recordedBy || req.user.name || "System",
      balanceDueAfter,
      paymentDate: paymentDate || new Date(),
    };

    invoice.amountPaid = newTotalPaid;
    invoice.paymentHistory.push(paymentRecord);

    // Update invoice status based on payment
    if (newTotalPaid >= totalAmount - 0.009) {
      invoice.status = "paid";
    } else if (newTotalPaid > 0) {
      invoice.status = "partial";
    }

    const updatedInvoice = await invoice.save();
    await updatedInvoice.populate("client");

    res.status(200).json({
      message: "Payment added successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const invoice = await InvoiceModel.findOne({ _id: id, user: userId });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Format payment history with precise values
    const formattedPaymentHistory = invoice.paymentHistory.map((payment) => ({
      ...payment.toObject(),
      amountPaid: toPrecision(payment.amountPaid),
      balanceDueAfter: toPrecision(payment.balanceDueAfter),
    }));

    res.status(200).json({
      paymentHistory: formattedPaymentHistory,
      totalAmount: toPrecision(invoice.totalAmount),
      amountPaid: toPrecision(invoice.amountPaid),
      amountDue: toPrecision(invoice.amountDue),
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, paymentId } = req.params;
    const { amount, paymentMode, notes, paymentDate } = req.body;

    const invoice = await InvoiceModel.findOne({ _id: id, user: userId });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const paymentToUpdate = invoice.paymentHistory.id(paymentId);
    if (!paymentToUpdate) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    const oldAmount = toPrecision(paymentToUpdate.amountPaid);
    let newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;

    if (isNaN(newAmount) || newAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Payment amount must be greater than 0" });
    }

    // Calculate current total without the payment being edited
    const currentAmountPaidWithoutOld = toPrecision(
      invoice.amountPaid - oldAmount,
    );
    const totalAmount = toPrecision(invoice.totalAmount);
    const remainingBalance = toPrecision(
      totalAmount - currentAmountPaidWithoutOld,
    );

    // Check if new amount is valid with tolerance
    if (!isAmountValidWithTolerance(newAmount, remainingBalance)) {
      return res.status(400).json({
        message: `Updated payment would exceed total amount. Maximum allowed: ${remainingBalance.toFixed(2)}`,
      });
    }

    // Adjust amount if it's within tolerance but slightly over
    if (newAmount > remainingBalance && newAmount <= remainingBalance + 0.009) {
      newAmount = remainingBalance;
    }

    // Calculate new total paid
    const newTotalPaid = toPrecision(currentAmountPaidWithoutOld + newAmount);
    const balanceDueAfter = toPrecision(
      Math.max(0, totalAmount - newTotalPaid),
    );

    // Update payment record
    paymentToUpdate.amountPaid = toPrecision(newAmount);
    if (paymentMode) paymentToUpdate.paymentMode = paymentMode;
    if (notes !== undefined) paymentToUpdate.notes = notes;
    if (paymentDate) paymentToUpdate.paymentDate = paymentDate;
    paymentToUpdate.balanceDueAfter = balanceDueAfter;

    // Update invoice totals
    invoice.amountPaid = newTotalPaid;

    // Update invoice status based on payment
    if (newTotalPaid >= totalAmount - 0.009) {
      invoice.status = "paid";
    } else if (newTotalPaid > 0) {
      invoice.status = "partial";
    } else {
      invoice.status = "draft";
    }

    await invoice.save();
    await invoice.populate("client");

    res.status(200).json({
      message: "Payment updated successfully",
      invoice: invoice,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, paymentId } = req.params;

    const invoice = await InvoiceModel.findOne({ _id: id, user: userId });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const paymentToRemove = invoice.paymentHistory.id(paymentId);
    if (!paymentToRemove) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    const paymentAmount = toPrecision(paymentToRemove.amountPaid);
    const currentAmountPaid = toPrecision(invoice.amountPaid);
    const totalAmount = toPrecision(invoice.totalAmount);

    // Remove payment and update totals
    invoice.amountPaid = toPrecision(currentAmountPaid - paymentAmount);
    invoice.paymentHistory.pull(paymentId);

    // Update invoice status
    if (invoice.amountPaid <= 0) {
      invoice.status = "draft";
    } else if (invoice.amountPaid >= totalAmount - 0.009) {
      invoice.status = "paid";
    } else {
      invoice.status = "partial";
    }

    await invoice.save();
    await invoice.populate("client");

    res.status(200).json({
      message: "Payment deleted successfully",
      invoice: invoice,
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
