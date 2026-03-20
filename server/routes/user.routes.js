import express from 'express'
import { addBankDetails, addClient, deleteBankDetails, deleteClient, editClient, editUserProfile, getBankDetails, getClientById, getClientLedger, getProfile, getUserClients, loginUser, registerUser, updateBankDetails, getBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, setPrimaryBankAccount, uploadLogo, removeLogo, uploadSignature, removeSignature } from '../controllers/user.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { uploadLogo as uploadLogoMiddleware, uploadSignature as uploadSignatureMiddleware } from '../middleware/upload.middleware.js';

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.patch('/update-profile', isAuthenticated, editUserProfile)
router.get('/profile', isAuthenticated, getProfile)

//Add client
router.post('/add-client', isAuthenticated, addClient)
//Edit client
router.patch('/edit-client/:id', isAuthenticated, editClient)
//Get client by ID
router.get('/client/:clientId', isAuthenticated, getClientById)
//Get clients
router.get('/clients', isAuthenticated, getUserClients)   
//Get client ledger
router.get('/client/:clientId/ledger', isAuthenticated, getClientLedger)
//Delete client  
router.delete('/delete-client/:clientId', isAuthenticated, deleteClient)

//Add Bank details
router.post('/bank-details', isAuthenticated, addBankDetails);
//Get Bank details
router.get('/bank-details', isAuthenticated, getBankDetails);
//Update Bank details
router.patch('/bank-details', isAuthenticated, updateBankDetails);
//Delete Bank details
router.delete('/bank-details', isAuthenticated, deleteBankDetails);

// Bank Accounts (New)
router.get('/bank-accounts', isAuthenticated, getBankAccounts);
router.post('/bank-accounts', isAuthenticated, addBankAccount);
router.put('/bank-accounts/:id', isAuthenticated, updateBankAccount);
router.delete('/bank-accounts/:id', isAuthenticated, deleteBankAccount);
router.patch('/bank-accounts/:id/primary', isAuthenticated, setPrimaryBankAccount);
router.post('/upload-logo', isAuthenticated, uploadLogoMiddleware, uploadLogo);
router.delete('/remove-logo', isAuthenticated, removeLogo);
router.post('/upload-signature', isAuthenticated, uploadSignatureMiddleware, uploadSignature);
router.delete('/remove-signature', isAuthenticated, removeSignature);

export default router