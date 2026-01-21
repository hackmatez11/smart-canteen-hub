import express from 'express';
import {
  createGroupOrder,
  joinGroupOrder,
  getGroupOrder,
  getUserGroupOrders,
  closeGroupOrder,
  leaveGroupOrder
} from '../controllers/groupOrderController.js';
import { authenticateUser } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();

router.post('/', authenticateUser, validate(schemas.groupOrder), createGroupOrder);
router.post('/join', authenticateUser, joinGroupOrder);
router.get('/my-groups', authenticateUser, getUserGroupOrders);
router.get('/:id', authenticateUser, getGroupOrder);
router.post('/:id/close', authenticateUser, closeGroupOrder);
router.post('/:id/leave', authenticateUser, leaveGroupOrder);

export default router;
