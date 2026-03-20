import express from 'express';
import { sendInvoiceSMS } from '../controllers/notification.controller.js';

const router = express.Router();

router.post('/send-sms', sendInvoiceSMS);

export default router;
