import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  getPickupTimeSuggestions,
  reorder
} from '../controllers/orderController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// User routes
router.post('/', authenticateUser, validate(schemas.createOrder), createOrder);
router.get('/my-orders', authenticateUser, getUserOrders);
router.get('/pickup-suggestions', authenticateUser, getPickupTimeSuggestions);
router.post('/reorder', authenticateUser, reorder);
router.get('/:id', authenticateUser, getOrderById);
router.post('/:id/cancel', authenticateUser, cancelOrder);

// Admin routes
router.get('/', authenticateUser, requireAdmin, getAllOrders);
router.patch('/:id/status', authenticateUser, requireAdmin, updateOrderStatus);

export default router;
