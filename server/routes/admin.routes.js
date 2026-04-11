import express from 'express';
import { getUsers, resetUserPassword, updateUserTemplates, updateUserRole } from '../controllers/admin.controller.js';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/users', isAuthenticated, isAdmin, getUsers);
router.post('/reset-password/:userId', isAuthenticated, isAdmin, resetUserPassword);
router.put('/users/:userId/templates', isAuthenticated, isAdmin, updateUserTemplates);
router.put('/users/:userId/role', isAuthenticated, isAdmin, updateUserRole);

export default router;
