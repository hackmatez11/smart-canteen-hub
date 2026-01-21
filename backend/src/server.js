import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import foodRoutes from './routes/food.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payments.js';
import groupOrderRoutes from './routes/groupOrders.js';
import favoritesRoutes from './routes/favorites.js';
import feedbackRoutes from './routes/feedback.js';
import adminRoutes from './routes/admin.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Import Supabase for realtime
import { supabase } from './config/supabase.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/group-orders', groupOrderRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room for user-specific updates
  socket.on('join-user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join room for admin updates
  socket.on('join-admin', () => {
    socket.join('admin');
    console.log('Admin joined admin room');
  });

  // Join room for specific order updates
  socket.on('join-order', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`Joined order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Supabase Realtime subscriptions
const setupRealtimeSubscriptions = () => {
  // Listen for order status changes
  supabase
    .channel('orders')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => {
        console.log('Order change:', payload);
        
        if (payload.eventType === 'INSERT') {
          // Notify admin of new order
          io.to('admin').emit('new-order', payload.new);
        } else if (payload.eventType === 'UPDATE') {
          // Notify user of order status change
          io.to(`user:${payload.new.user_id}`).emit('order-update', payload.new);
          
          // Notify specific order room
          io.to(`order:${payload.new.id}`).emit('order-update', payload.new);
          
          // Notify admin
          io.to('admin').emit('order-update', payload.new);
        }
      }
    )
    .subscribe();

  // Listen for food item changes
  supabase
    .channel('food_items')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'food_items' },
      (payload) => {
        console.log('Food item change:', payload);
        
        // Broadcast to all connected clients
        io.emit('food-item-update', {
          event: payload.eventType,
          item: payload.new || payload.old
        });
      }
    )
    .subscribe();

  // Listen for feedback
  supabase
    .channel('feedback')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'feedback' },
      (payload) => {
        console.log('New feedback:', payload);
        
        // Notify admin
        io.to('admin').emit('new-feedback', payload.new);
      }
    )
    .subscribe();

  console.log('Realtime subscriptions set up');
};

// Initialize realtime subscriptions
setupRealtimeSubscriptions();

// Make io accessible in routes
app.set('io', io);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
