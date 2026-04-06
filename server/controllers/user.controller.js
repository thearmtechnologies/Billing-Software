import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import ClientModel from "../models/client.model.js";
import UserModel from "../models/user.model.js";
import InvoiceModel from "../models/invoice.model.js";
import cloudinary from "../config/cloudinary.js";

export const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      businessName,
      phone,
      email,
      password,
      confirmPassword,
      businessType,
      preferredPrintFormat,
      address,
      taxId,
      udyamNo,
      IsVerified,
    } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !name || !password || !businessName || !phone) {
      return res.status(422).json({ message: "Please fill all the fields" });
    }

    if (!emailRegex.test(email)) {
      return res.status(422).json({ message: "Invalid Email format" });
    }

    if (phone.length < 10 || phone.length > 10) {
      return res.status(422).json({ message: "Invalid Phone number" });
    }

    const newEmail = email.toLowerCase();

    const emailExists = await UserModel.findOne({ email: newEmail });

    if (emailExists) {
      return res.status(422).json({ message: "User with this email already exists" });
    }

    if (password.trim().length < 6) {
      return res
        .status(422)
        .json({ message: "Password must be at least 6 characters long" });
    }

    if (password != confirmPassword) {
      return res.status(422).json({ message: "Password do not match" });
    }

    const hashedPassword = await UserModel.hashPassword(password);

    const newUser = await UserModel.create({
      name,
      businessName,
      phone,
      email: newEmail,
      password: hashedPassword,
      businessType,
      preferredPrintFormat,
      address,
      taxId,
      udyamNo,
      IsVerified,
    });

    res.status(201).json(`New user ${newUser.email} registered successfully`);
  } catch (error) {
    console.error("Error in register user:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ message: "Please fill all the fields" });
    }

    const newEmail = email.toLowerCase();
    const user = await UserModel.findOne({ email: newEmail });
    if (!user) {
      return res.status(422).json({ error: "Invalid username or password" });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(422).json({ error: "Invalid username or password" });
    }

    generateTokenAndSetCookie(user._id, res);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res
      .status(200)
      .json({ user: userWithoutPassword, message: "Login Successful" });
  } catch (error) {
    console.error("Error in login user:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const id = req.user._id;

    const user = await UserModel.findById(id).select("-password");

    if (!user) {
      res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getProfile controller:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const editUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      businessName,
      phone,
      email,
      currentPassword,
      newPassword,
      confirmNewPassword,
      preferredPrintFormat,
      address,
      taxId,
      businessType,
      udyamNo,
      panNumber,
      invoicePreferences
    } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // === Email Validation & Update ===
    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(422).json({ message: "Invalid email format." });
      }

      const emailExists = await UserModel.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: userId },
      });

      if (emailExists) {
        return res.status(422).json({ message: "Email already exists." });
      }

      user.email = email.trim().toLowerCase();
    }

    // === Basic Fields Update ===
    if (name?.trim()) user.name = name.trim();
    if (businessName?.trim()) user.businessName = businessName.trim();
    if (taxId?.trim()) user.taxId = taxId.trim();
    if (udyamNo?.trim()) user.udyamNo = udyamNo.trim();
    if (panNumber?.trim()) user.panNumber = panNumber.trim().toUpperCase();

    // === Phone Validation ===
    if (phone?.trim()) {
      const trimmedPhone = phone.trim();
      if (!/^\d{10}$/.test(trimmedPhone)) {
        return res.status(422).json({ message: "Invalid phone number." });
      }
      user.phone = trimmedPhone;
    }

    // === preferredPrintFormat Validation ===
    if (
      Array.isArray(preferredPrintFormat) &&
      preferredPrintFormat.every((val) => ["a4", "thermal"].includes(val))
    ) {
      user.preferredPrintFormat = preferredPrintFormat;
    }

    // === businessType Validation ===
    if (
      Array.isArray(businessType) &&
      businessType.every((val) =>
        [
          "finance",
          "crane-hiring",
          "erection & fabrication",
          "barber-salon",
          "food-stall",
          "general",
        ].includes(val)
      )
    ) {
      user.businessType = businessType;
    }

    // === Address Update ===
    if (address && typeof address === "object") {
      const { street, city, state, zipCode, country } = address;

      if (street?.trim()) user.address.street = street.trim();
      if (city?.trim()) user.address.city = city.trim();
      if (state?.trim()) user.address.state = state.trim();
      if (zipCode?.trim()) user.address.zipCode = zipCode.trim();
      if (country?.trim()) user.address.country = country.trim();
    }

    // === Invoice Preferences Update ===
    if (invoicePreferences && typeof invoicePreferences === "object") {
      const { prefix, suffix, addressBehavior } = invoicePreferences;
      if (!user.invoicePreferences) user.invoicePreferences = {};
      if (prefix !== undefined) user.invoicePreferences.prefix = prefix.trim();
      if (suffix !== undefined) user.invoicePreferences.suffix = suffix.trim();
      if (addressBehavior !== undefined) user.invoicePreferences.addressBehavior = addressBehavior;
    }

    // === Password Update ===
    if (currentPassword || newPassword || confirmNewPassword) {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({
          message:
            "Current password, new password, and confirm password are all required.",
        });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          message: "New password and confirm password do not match.",
        });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect." });
      }

      user.password = await UserModel.hashPassword(newPassword);
    }

    // === Save Updated User ===
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Error in editUserProfile controller:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const addClient = async (req, res) => {
  try {
    const userId = req.user._id;

    const { companyName, address, email, phone, gstNumber, panNumber, notes } = req.body;

    if (!companyName) {
      return res.status(400).json({ message: "Company name is required." });
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
    }

    // check for existing client with same name and email for this user
    const existingClient = await ClientModel.findOne({
      user: userId,
      companyName: companyName.trim(),
      email: email?.trim().toLowerCase(),
    });

    if (existingClient) {
      return res.status(409).json({ message: "Client already exists." });
    }

    // Create new client
    const newClient = new ClientModel({
      user: userId,
      companyName: companyName.trim(),
      address: {
        street: address.street?.trim(),
        city: address.city?.trim(),
        state: address.state?.trim(),
        zipCode: address.zipCode?.trim(),
        country: address.country?.trim() || "India",
      },
      email: email?.trim().toLowerCase(),
      phone: phone?.trim(),
      gstNumber: gstNumber?.trim(),
      panNumber: panNumber?.trim().toUpperCase(),
      notes: notes?.trim(),
    });

    await newClient.save();

    return res.status(201).json({
      message: "Client added successfully.",
      client: newClient,
    });
  } catch (error) {
    console.log("Error in AddClient controller:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const editClient = async (req, res) => {
  try {
    const userId = req.user._id;
    const clientId = req.params.id;

    const { companyName, address, email, phone, gstNumber, panNumber, notes } = req.body;

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
    }

    // Fetch the client
    const client = await ClientModel.findOne({ _id: clientId, user: userId });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Update fields if they exist
    if (companyName?.trim()) client.companyName = companyName.trim();

    if (email?.trim()) {
      client.email = email.trim().toLowerCase();
    }

    if (phone?.trim()) client.phone = phone.trim();
    if (gstNumber?.trim()) client.gstNumber = gstNumber.trim();
    if (panNumber?.trim()) client.panNumber = panNumber.trim().toUpperCase();
    if (notes?.trim()) client.notes = notes.trim();

    // Update nested address if provided
    if (address) {
      if (address.street?.trim()) client.address.street = address.street.trim();
      if (address.city?.trim()) client.address.city = address.city.trim();
      if (address.state?.trim()) client.address.state = address.state.trim();
      if (address.zipCode?.trim())
        client.address.zipCode = address.zipCode.trim();
      if (address.country?.trim())
        client.address.country = address.country.trim();
    }

    await client.save();

    return res.status(200).json({
      message: "Client updated successfully.",
      client,
    });
  } catch (error) {
    console.log("Error in editClient controller:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const getClientById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    // Fetch the client belonging to the user
    const client = await ClientModel.findOne({ _id: clientId, user: userId });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.status(200).json({ client });

  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserClients = async (req, res) => {
  try {
    const userId = req.user._id;

    const clients = await ClientModel.find({ user: userId });

    res.status(200).json({
      message: "Clients fetched successfully",
      clients,
    });
  } catch (error) {
    console.error("Error in getAllClients:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const userId = req.user._id;
    const { clientId } = req.params;

    // Check if client exists and belongs to the user
    const client = await ClientModel.findOne({ _id: clientId, user: userId });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Delete the client
    await ClientModel.deleteOne({ _id: clientId, user: userId });

    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error in deleteClient:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


export const addBankDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      bankName,
      accountNumber,
      accountHolderName,
      ifscCode,
      branchName,
      accountType,
      upiId
    } = req.body;

    // Validation
    if (!bankName || !accountNumber || !accountHolderName || !ifscCode) {
      return res.status(400).json({
        message: "Bank name, account number, account holder name, and IFSC code are required"
      });
    }

    // IFSC code validation (basic format)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode.toUpperCase())) {
      return res.status(400).json({
        message: "Invalid IFSC code format"
      });
    }

    // Account number validation
    if (!/^\d{9,18}$/.test(accountNumber)) {
      return res.status(400).json({
        message: "Account number must be between 9-18 digits"
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update bank details
    user.bankDetails = {
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountHolderName: accountHolderName.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      branchName: branchName?.trim(),
      accountType: accountType || "savings",
      upiId: upiId?.trim()
    };

    await user.save();

    res.status(200).json({
      message: "Bank details added successfully",
      bankDetails: user.bankDetails
    });
  } catch (error) {
    console.error("Error in addBankDetails:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBankDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await UserModel.findById(userId).select("bankDetails");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      bankDetails: user.bankDetails || null
    });
  } catch (error) {
    console.error("Error in getBankDetails:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateBankDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      bankName,
      accountNumber,
      accountHolderName,
      ifscCode,
      branchName,
      accountType,
      upiId
    } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if bank details exist
    if (!user.bankDetails) {
      return res.status(404).json({ message: "Bank details not found. Please add bank details first." });
    }

    // Update only provided fields
    if (bankName) user.bankDetails.bankName = bankName.trim();
    if (accountNumber) {
      if (!/^\d{9,18}$/.test(accountNumber)) {
        return res.status(400).json({
          message: "Account number must be between 9-18 digits"
        });
      }
      user.bankDetails.accountNumber = accountNumber.trim();
    }
    if (accountHolderName) user.bankDetails.accountHolderName = accountHolderName.trim();
    if (ifscCode) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscCode.toUpperCase())) {
        return res.status(400).json({
          message: "Invalid IFSC code format"
        });
      }
      user.bankDetails.ifscCode = ifscCode.trim().toUpperCase();
    }
    if (branchName) user.bankDetails.branchName = branchName.trim();
    if (accountType) user.bankDetails.accountType = accountType;
    if (upiId !== undefined) user.bankDetails.upiId = upiId?.trim();

    await user.save();

    res.status(200).json({
      message: "Bank details updated successfully",
      bankDetails: user.bankDetails
    });
  } catch (error) {
    console.error("Error in updateBankDetails:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteBankDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.bankDetails) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    user.bankDetails = undefined;
    await user.save();

    res.status(200).json({
      message: "Bank details deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteBankDetails:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getClientLedger = async (req, res) => {
  try {
    const userId = req.user._id;
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    const client = await ClientModel.findOne({ _id: clientId, user: userId });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const invoices = await InvoiceModel.find({ client: clientId, user: userId })
      .populate("items.service") 
      .sort({ invoiceDate: 1 });

    let ledgerEntries = [];

    invoices.forEach((inv) => {
      // 1. Add the Invoice as a Debit
      let description = "Invoice Generated";
      if (inv.items && inv.items.length > 0) {
        const itemNames = inv.items.map(i => i.description || (i.service && i.service.name) || "Item").join(", ");
        description = `Invoice for: ${itemNames}`;
      }

      ledgerEntries.push({
        date: inv.invoiceDate,
        type: "Invoice Generated",
        description: description,
        reference: inv.invoiceNumber,
        debit: inv.totalAmount,
        credit: 0,
        invoiceId: inv._id
      });

      // 2. Add each payment as a Credit
      if (inv.paymentHistory && inv.paymentHistory.length > 0) {
        inv.paymentHistory.forEach(payment => {
          ledgerEntries.push({
            date: payment.paymentDate,
            type: "Payment Received",
            description: payment.notes || `Payment for Invoice ${inv.invoiceNumber}`,
            reference: payment.paymentMode,
            debit: 0,
            credit: payment.amountPaid,
            invoiceId: inv._id,
            paymentId: payment._id
          });
        });
      }
    });

    // Sort all entries chronologically by Date
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = 0;
    const finalizedLedger = ledgerEntries.map(entry => {
      runningBalance += entry.debit;
      runningBalance -= entry.credit;
      return {
        ...entry,
        balance: runningBalance
      };
    });

    res.status(200).json({
      message: "Ledger fetched successfully",
      ledger: finalizedLedger,
      client: {
         name: client.companyName,
         email: client.email,
         phone: client.phone,
         panNumber: client.panNumber
      }
    });

  } catch (error) {
    console.error("Error fetching client ledger:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    // Upload buffer to Cloudinary via stream
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'logos', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    // Save URL to user profile
    const user = await UserModel.findById(req.user._id);
    user.logoUrl = uploadResult.secure_url;
    await user.save();
    return res.status(200).json({ url: uploadResult.secure_url });
  } catch (err) {
    console.error('Error in uploadLogo:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const removeLogo = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Optionally delete from Cloudinary if public_id known; skipping for simplicity
    user.logoUrl = '';
    await user.save();
    return res.status(200).json({ message: 'Logo removed' });
  } catch (err) {
    console.error('Error in removeLogo:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'signatures', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    const user = await UserModel.findById(req.user._id);
    user.signatureUrl = uploadResult.secure_url;
    await user.save();
    return res.status(200).json({ url: uploadResult.secure_url });
  } catch (err) {
    console.error('Error in uploadSignature:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const removeSignature = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.signatureUrl = '';
    await user.save();
    return res.status(200).json({ message: 'Signature removed' });
  } catch (err) {
    console.error('Error in removeSignature:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const getBankAccounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await UserModel.findById(userId).select("bankAccounts");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ bankAccounts: user.bankAccounts || [] });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addBankAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { accountHolderName, bankName, branchName, accountNumber, ifscCode, accountType, upiId, isPrimary } = req.body;

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({ message: "Bank name, account number, account holder name, and IFSC code are required" });
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode.toUpperCase())) {
      return res.status(400).json({ message: "Invalid IFSC code format" });
    }

    if (!/^\d{9,18}$/.test(accountNumber.replace(/\s/g, ""))) {
      return res.status(400).json({ message: "Account number must be between 9-18 digits" });
    }

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isFirstAccount = (user.bankAccounts || []).length === 0;
    const shouldBePrimary = isFirstAccount || isPrimary === true;

    if (shouldBePrimary && user.bankAccounts && user.bankAccounts.length > 0) {
      user.bankAccounts.forEach(acc => { acc.isPrimary = false; });
    }

    const newAccount = {
      accountHolderName: accountHolderName.trim(),
      bankName: bankName.trim(),
      branchName: branchName?.trim(),
      accountNumber: accountNumber.replace(/\s/g, ""),
      ifscCode: ifscCode.trim().toUpperCase(),
      accountType: accountType || "savings",
      upiId: upiId?.trim(),
      isPrimary: shouldBePrimary,
    };

    if (!user.bankAccounts) user.bankAccounts = [];
    user.bankAccounts.push(newAccount);

    await user.save();
    
    res.status(200).json({ message: "Bank account added successfully", bankAccount: user.bankAccounts[user.bankAccounts.length - 1], bankAccounts: user.bankAccounts });
  } catch (error) {
    console.error("Error adding bank account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateBankAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const accountId = req.params.id;
    const { accountHolderName, bankName, branchName, accountNumber, ifscCode, accountType, upiId } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const bankAccount = user.bankAccounts.id(accountId);
    if (!bankAccount) return res.status(404).json({ message: "Bank account not found" });

    if (accountHolderName) bankAccount.accountHolderName = accountHolderName.trim();
    if (bankName) bankAccount.bankName = bankName.trim();
    if (branchName !== undefined) bankAccount.branchName = branchName?.trim();
    if (accountNumber) {
      if (!/^\d{9,18}$/.test(accountNumber.replace(/\s/g, ""))) {
        return res.status(400).json({ message: "Account number must be between 9-18 digits" });
      }
      bankAccount.accountNumber = accountNumber.replace(/\s/g, "");
    }
    if (ifscCode) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscCode.toUpperCase())) {
        return res.status(400).json({ message: "Invalid IFSC code format" });
      }
      bankAccount.ifscCode = ifscCode.trim().toUpperCase();
    }
    if (accountType) bankAccount.accountType = accountType;
    if (upiId !== undefined) bankAccount.upiId = upiId?.trim();

    await user.save();
    res.status(200).json({ message: "Bank account updated successfully", bankAccount, bankAccounts: user.bankAccounts });
  } catch (error) {
    console.error("Error updating bank account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteBankAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const accountId = req.params.id;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const bankAccount = user.bankAccounts.id(accountId);
    if (!bankAccount) return res.status(404).json({ message: "Bank account not found" });

    const wasPrimary = bankAccount.isPrimary;

    user.bankAccounts.pull(accountId);

    if (wasPrimary && user.bankAccounts.length > 0) {
      user.bankAccounts[0].isPrimary = true;
    }

    await user.save();
    res.status(200).json({ message: "Bank account deleted successfully", bankAccounts: user.bankAccounts });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const setPrimaryBankAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const accountId = req.params.id;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let found = false;
    user.bankAccounts.forEach((acc) => {
      if (acc._id.toString() === accountId) {
        acc.isPrimary = true;
        found = true;
      } else {
        acc.isPrimary = false;
      }
    });

    if (!found) return res.status(404).json({ message: "Bank account not found" });

    await user.save();
    res.status(200).json({ message: "Primary bank account set", bankAccounts: user.bankAccounts });
  } catch (error) {
    console.error("Error setting primary bank account:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ── Custom Units ──

export const getCustomUnits = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id).select("customUnits");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ customUnits: user.customUnits || [] });
  } catch (error) {
    console.error("Error fetching custom units:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addCustomUnit = async (req, res) => {
  try {
    const { name, shortCode } = req.body;
    const trimmedName = name?.trim();

    if (!trimmedName) {
      return res.status(400).json({ message: "Unit name is required." });
    }

    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check for duplicate (case-insensitive)
    const duplicate = (user.customUnits || []).find(
      (u) => u.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({ message: `Custom unit "${trimmedName}" already exists.` });
    }

    user.customUnits.push({
      name: trimmedName,
      shortCode: shortCode?.trim() || "",
    });

    await user.save();

    res.status(201).json({
      message: "Custom unit added successfully.",
      customUnits: user.customUnits,
    });
  } catch (error) {
    console.error("Error adding custom unit:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteCustomUnit = async (req, res) => {
  try {
    const unitId = req.params.id;

    const user = await UserModel.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const unitIndex = (user.customUnits || []).findIndex(
      (u) => u._id.toString() === unitId
    );
    if (unitIndex === -1) {
      return res.status(404).json({ message: "Custom unit not found." });
    }

    user.customUnits.splice(unitIndex, 1);
    await user.save();

    res.status(200).json({
      message: "Custom unit deleted successfully.",
      customUnits: user.customUnits,
    });
  } catch (error) {
    console.error("Error deleting custom unit:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
