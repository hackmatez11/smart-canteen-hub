import express from 'express';
import {
  submitFeedback,
  getOrderFeedback,
  getAllFeedback,
  getFoodItemReviews,
  deleteFeedback
} from '../controllers/feedbackController.js';
import { authenticateUser, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

// User routes
router.post('/', authenticateUser, validate(schemas.feedback), submitFeedback);
router.get('/order/:order_id', authenticateUser, getOrderFeedback);

// Public routes (food reviews)
router.get('/food-item/:food_item_id', optionalAuth, getFoodItemReviews);

// Admin routes
router.get('/', authenticateUser, requireAdmin, getAllFeedback);
router.delete('/:id', authenticateUser, requireAdmin, deleteFeedback);

export default router;
