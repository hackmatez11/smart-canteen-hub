import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refreshSession
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshSession);

// Protected routes
router.post('/logout', authenticateUser, logout);
router.get('/profile', authenticateUser, getProfile);
router.put('/profile', authenticateUser, updateProfile);

export default router;
