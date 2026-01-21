import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  processRefund
} from '../controllers/paymentController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// User routes
router.post('/create-order', authenticateUser, createPaymentOrder);
router.post('/verify', authenticateUser, validate(schemas.verifyPayment), verifyPayment);
router.get('/:payment_id', authenticateUser, getPaymentDetails);

// Admin routes
router.post('/refund', authenticateUser, requireAdmin, processRefund);

export default router;
