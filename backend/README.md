# Smart College Canteen - Backend API

Backend server for the Smart College Canteen Food Ordering System built with Node.js, Express, Supabase, and Socket.IO.

## 🛠 Technology Stack

- **Framework**: Express.js
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Payments**: Razorpay (Test Mode)
- **Real-time**: Socket.IO + Supabase Realtime
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Razorpay test account

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Razorpay Test Keys
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Socket.IO
SOCKET_IO_CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

1. Go to your Supabase project
2. Open SQL Editor
3. Run the schema from `database/schema.sql`
4. Verify all tables and RLS policies are created

### 4. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/refresh` - Refresh session

### Food Items

- `GET /api/food` - Get all food items (with filters)
- `GET /api/food/:id` - Get food item by ID
- `POST /api/food` - Create food item (Admin)
- `PUT /api/food/:id` - Update food item (Admin)
- `DELETE /api/food/:id` - Delete food item (Admin)
- `GET /api/food/categories` - Get all categories
- `GET /api/food/best-selling` - Get best-selling items
- `GET /api/food/surplus` - Get surplus food items

### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders/:id/cancel` - Cancel order
- `PATCH /api/orders/:id/status` - Update order status (Admin)
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/pickup-suggestions` - Get optimal pickup times
- `POST /api/orders/reorder` - Reorder previous order

### Payments

- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/:payment_id` - Get payment details
- `POST /api/payments/refund` - Process refund (Admin)

### Group Orders

- `POST /api/group-orders` - Create group order
- `POST /api/group-orders/join` - Join group order
- `GET /api/group-orders/my-groups` - Get user's group orders
- `GET /api/group-orders/:id` - Get group order details
- `POST /api/group-orders/:id/close` - Close group order
- `POST /api/group-orders/:id/leave` - Leave group order

### Favorites

- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites/:food_item_id` - Remove from favorites
- `GET /api/favorites/check/:food_item_id` - Check if favorite

### Feedback

- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/order/:order_id` - Get order feedback
- `GET /api/feedback/food-item/:food_item_id` - Get food item reviews
- `GET /api/feedback` - Get all feedback (Admin)
- `DELETE /api/feedback/:id` - Delete feedback (Admin)

### Admin Dashboard

- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/revenue-analytics` - Get revenue analytics
- `GET /api/admin/order-analytics` - Get order analytics
- `GET /api/admin/category-sales` - Get category-wise sales
- `GET /api/admin/peak-hours` - Get peak hours data

## 🔐 Authentication

All protected routes require an `Authorization` header with a Bearer token:

```
Authorization: Bearer <supabase_access_token>
```

## 📊 Algorithms Implemented

### 1. Mood-Based Recommendation Algorithm

Located in `src/algorithms/recommendation.js`

- Maps user moods to food characteristics
- Scores food items based on mood, tags, ratings
- Provides diversified recommendations

### 2. Order Priority Algorithm

Located in `src/algorithms/orderPriority.js`

- Calculates priority based on pickup time, waiting time, payment status
- Sorts orders for efficient kitchen operations
- Handles cancellation windows

### 3. Preparation Time Estimation

Located in `src/algorithms/preparationTime.js`

- Estimates preparation time based on items and quantities
- Considers current queue length
- Suggests optimal pickup time slots
- Detects idle time periods

## 🔌 Real-time Features (Socket.IO)

### Client Events

- `join-user` - Join user-specific room
- `join-admin` - Join admin room
- `join-order` - Join order-specific room

### Server Events

- `new-order` - New order created (to admin)
- `order-update` - Order status updated
- `food-item-update` - Food item modified
- `new-feedback` - New feedback submitted (to admin)

### Supabase Realtime

The server subscribes to Supabase real-time changes on:
- `orders` table
- `food_items` table
- `feedback` table

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Joi schemas
- **RLS**: Row Level Security in Supabase
- **Environment Variables**: Sensitive data protection

## 📝 Database Schema

See `database/schema.sql` for complete database structure including:

- User profiles
- Food items
- Orders and order items
- Payments
- Group orders
- Favorites
- Feedback and reviews
- Row Level Security policies

## 🧪 Testing

```bash
npm test
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Supabase connection issues
- Verify SUPABASE_URL and SUPABASE_ANON_KEY
- Check if Supabase project is active
- Verify API key permissions

### Razorpay payment failures
- Ensure using TEST keys (not live keys)
- Verify webhook signature validation
- Check Razorpay dashboard for error logs

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Razorpay Test Mode](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Socket.IO Documentation](https://socket.io/docs/)

## 👥 Support

For issues or questions, please refer to the main project README.
