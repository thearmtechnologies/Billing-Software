import mongoose from "mongoose";
import InvoiceModel from "../models/invoice.model.js";

// Helper: Tiered pricing calculation
const calcTieredAmount = (item) => {
  const qty = Number(item.quantity) || 0;
  if (!item.pricingTiers?.length || qty <= 0) return 0;

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
    if (qty < tier.minValue) continue;

    if (tier.rateType === "slabRate") {
      if (qty <= tier.maxValue) {
        return tier.rate;
      } else {
        total = tier.rate;
        lastCoveredMax = tier.maxValue;
      }
    } else {
      const start = Math.max(tier.minValue, lastCoveredMax);
      const end = Math.min(qty, tier.maxValue);
      const applicableQty = Math.max(0, end - start);
      total += applicableQty * tier.rate;

      if (qty <= tier.maxValue) return total;
    }
  }

  return total;
};

export const createInvoice = async (req, res) => {
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
    } = req.body;

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

    // Calculate subtotal (per item)
    let subtotal = 0;
    const updatedItems = (items || []).map((item) => {
      let baseAmount = 0;

      if (item.pricingType === "flat") {
        baseAmount = item.baseRate || 0; // flat → ignore quantity
      } else if (item.pricingType === "tiered") {
        baseAmount = calcTieredAmount(item);
      } else {
        baseAmount = (item.quantity || 0) * (item.baseRate || 0); // fixed
      }

      subtotal += baseAmount;

      return {
        ...item,
        hsnCode: item.hsnCode?.trim() || "",
        subtotal: baseAmount,
      };
    });

    // Apply bill-level discount
    let discountAmount = 0;
    if (discountType === "percentage") {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }
    const afterDiscount = Math.max(0, subtotal - discountAmount);

    // Apply bill-level taxes
    let totalTax = 0;
    const updatedTaxes = (taxes || []).map((tax) => {
      const rate = Number(tax.rate || 0);
      const amount = (afterDiscount * rate) / 100;
      totalTax += amount;
      return { ...tax, amount };
    });

    // Final total
    const totalAmount = afterDiscount + totalTax;

    const invoice = new InvoiceModel({
      user: userId,
      invoiceNumber,
      invoiceDate,
      client,
      items: updatedItems,
      subtotal,
      discount,
      discountType,
      taxes: updatedTaxes,
      totalTax,
      totalAmount,
      status,
      dueDate,
      paidDate,
      notes,
      businessType,
      bankDetails,
    });

    await invoice.save();

    res.status(201).json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const userId = req.user._id;

    const invoices = await InvoiceModel.find({ user: userId }).populate(
      "client"
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
  try {
    const userId = req.user._id;
    const { id } = req.params;
    let data = { ...req.body };

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

    // If items are updated, recalc totals
    if (data.items) {
      let subtotal = 0;

      const updatedItems = data.items.map((item) => {
        let baseAmount = 0;

        if (item.pricingType === "flat") {
          baseAmount = item.baseRate || 0; // flat → ignore quantity
        } else if (item.pricingType === "tiered") {
          baseAmount = calcTieredAmount(item);
        } else {
          baseAmount = (item.quantity || 0) * (item.baseRate || 0); // fixed
        }

        subtotal += baseAmount;

        return {
          ...item,
          hsnCode: item.hsnCode?.trim() || "",
          subtotal: baseAmount,
        };
      });

      // Bill-level discount
      let discountAmount = 0;
      const discountType = data.discountType || invoice.discountType;
      const discount = data.discount || invoice.discount || 0;
      
      if (discountType === "percentage") {
        discountAmount = (subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
      const afterDiscount = Math.max(0, subtotal - discountAmount);

      // Bill-level taxes
      let totalTax = 0;
      
      const updatedTaxes = (data.taxes || invoice.taxes || []).map((tax) => {
        const rate = Number(tax.rate || 0);
        const amount = (afterDiscount * rate) / 100;
        totalTax += amount;
        return { ...tax, amount };
      });


      // Final total
      invoice.items = updatedItems; // ✅ Assign the calculated items to invoice
      invoice.subtotal = subtotal;
      invoice.discount = discount;
      invoice.discountType = discountType;
      invoice.taxes = updatedTaxes;
      invoice.totalTax = totalTax;
      invoice.totalAmount = afterDiscount + totalTax;
    }

    // Update other fields
    Object.keys(data).forEach(key => {
      // Skip items since we already handled them above
      if (key !== 'items' && key !== 'taxes' && data[key] !== undefined) {
        invoice[key] = data[key];
      }
    });

    const updatedInvoice = await invoice.save();
    await updatedInvoice.populate("client");

    res.status(200).json({
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const deleteInvoice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const deleted = await InvoiceModel.findOneAndDelete({user: userId, _id: id});

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
    let invoice = await InvoiceModel.findOne({ _id: invoiceId, user: req.user._id });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Find item index
    const itemIndex = invoice.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Remove the item
    invoice.items.splice(itemIndex, 1);

    // Recalculate total
    let subtotal = 0;
    let total = 0;
    let discountAmount = 0
    let taxAmount = 0
    invoice.items.forEach(item => {
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
export const addPayment = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { amount, paymentMode = "bank-transfer", notes, recordedBy, paymentDate } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }

    const invoice = await InvoiceModel.findOne({ _id: id, user: userId });
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const newTotalPaid = invoice.amountPaid + amount;
    
    if (newTotalPaid > invoice.totalAmount) {
      return res.status(400).json({
        message: `Payment would exceed total amount. Maximum allowed: ${invoice.totalAmount - invoice.amountPaid}`
      });
    } 

    const balanceDueAfter = Math.max(0, invoice.totalAmount - newTotalPaid);

    // Create payment history record
    const paymentRecord = {
      amountPaid: amount,
      paymentMode,
      notes,
      recordedBy: recordedBy || req.user.name || "System",
      balanceDueAfter,
      paymentDate: paymentDate || new Date()
    };

    invoice.amountPaid = newTotalPaid;
    invoice.paymentHistory.push(paymentRecord);

    const updatedInvoice = await invoice.save()
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

    res.status(200).json({
      paymentHistory: invoice.paymentHistory,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue
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

    const oldAmount = paymentToUpdate.amountPaid;
    const newAmount = amount || oldAmount;

    // Calculate new total paid
    const newTotalPaid = invoice.amountPaid - oldAmount + newAmount;
    
    if (newTotalPaid > invoice.totalAmount) {
      return res.status(400).json({
        message: `Updated payment would exceed total amount. Maximum allowed: ${invoice.totalAmount - (invoice.amountPaid - oldAmount)}`
      });
    }

    // Update payment record
    paymentToUpdate.amountPaid = newAmount;
    if (paymentMode) paymentToUpdate.paymentMode = paymentMode;
    if (notes !== undefined) paymentToUpdate.notes = notes;
    if (paymentDate) paymentToUpdate.paymentDate = paymentDate;
    paymentToUpdate.balanceDueAfter = Math.max(0, invoice.totalAmount - newTotalPaid);

    // Update invoice totals
    invoice.amountPaid = newTotalPaid;

    await invoice.save();

    res.status(200).json({
      message: "Payment updated successfully",
      invoice: await InvoiceModel.findById(id).populate("client")
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

    // Remove payment and update totals
    invoice.amountPaid -= paymentToRemove.amountPaid;
    invoice.paymentHistory.pull(paymentId);

    await invoice.save();

    res.status(200).json({
      message: "Payment deleted successfully",
      invoice: await InvoiceModel.findById(id).populate("client")
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




