# 🍽️ Smart College Canteen Food Ordering System

A complete, production-ready smart food ordering system for college canteens built with the MERN stack, featuring real-time order tracking, mood-based recommendations, group ordering, and integrated payment processing.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Features Documentation](#features-documentation)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Algorithms](#algorithms)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core Features

- **🔐 Authentication & Authorization**
  - Supabase Auth integration
  - Role-based access control (Student, Admin)
  - Secure session management

- **🍕 Food Menu Management**
  - Category-based browsing
  - Advanced search with auto-suggestions
  - Real-time availability updates
  - Best-selling & highest-rated items
  - Special, seasonal, and fasting dishes

- **🛒 Order Management**
  - Token-based ordering system
  - Pickup time selection
  - Order customization (toppings, extras)
  - Order cancellation (within 2-3 minutes)
  - One-click reorder
  - Order history tracking

- **👥 Group Ordering**
  - Create and join group orders
  - Shared pickup time
  - Join code system
  - Group order management

- **💳 Payment Integration**
  - Razorpay integration (Test Mode)
  - Multiple payment methods (UPI, Card, Wallet)
  - Secure payment verification
  - Cash on pickup option

- **⏱️ Real-time Features**
  - Live order status updates
  - Token blinking when ready
  - Food preparation timer
  - Real-time notifications (Socket.IO + Supabase Realtime)

- **🎯 Smart Features**
  - Mood-based food recommendations
  - Preparation time estimation
  - Idle time slot suggestions
  - Priority-based order queue

- **♻️ Waste Reduction**
  - Surplus food alerts
  - Dynamic discounted pricing
  - Stock management

- **⭐ Feedback System**
  - Star ratings
  - Anonymous feedback option
  - Order-specific reviews
  - Item-specific reviews

- **❤️ Favorites/Wishlist**
  - Save favorite items
  - Quick access to favorites

- **📊 Admin Dashboard**
  - Real-time analytics
  - Revenue tracking
  - Order management
  - Priority-based order queue
  - Peak hours analysis
  - Category-wise sales
  - Inventory management

## 🛠 Technology Stack

### Frontend
- **React.js** - UI library
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **Razorpay** - Payment integration

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **Joi** - Validation
- **Helmet** - Security
- **Morgan** - Logging
- **Compression** - Response compression

### Database & Services
- **Supabase PostgreSQL** - Database
- **Supabase Auth** - Authentication
- **Supabase Realtime** - Real-time subscriptions
- **Razorpay** - Payment gateway (Test Mode)

### Development Tools
- **Vite** - Build tool
- **ESLint** - Linting
- **TypeScript** - Static typing
- **Git** - Version control

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React App)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Redux     │  │  Socket.IO   │  │   Razorpay   │       │
│  │   Store     │  │   Client     │  │   Checkout   │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────┴────────────────────────────────────┐
│                  Backend API Server (Express)                │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    REST     │  │  Socket.IO   │  │   Razorpay   │       │
│  │    APIs     │  │   Server     │  │     SDK      │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴───────────────┐
        │                                │
┌───────┴────────┐              ┌────────┴─────────┐
│    Supabase    │              │    Razorpay      │
│  ┌──────────┐  │              │    Payment       │
│  │PostgreSQL│  │              │    Gateway       │
│  ├──────────┤  │              └──────────────────┘
│  │   Auth   │  │
│  ├──────────┤  │
│  │ Realtime │  │
│  └──────────┘  │
└────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Razorpay test account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webapp
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Setup Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Run the database schema from `backend/database/schema.sql`

5. **Configure environment variables**
   
   Frontend (`.env`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_RAZORPAY_KEY_ID=your_razorpay_test_key_id
   VITE_SOCKET_URL=http://localhost:5000
   ```

   Backend (`backend/.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   RAZORPAY_KEY_ID=your_razorpay_test_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
   FRONTEND_URL=http://localhost:5173
   ```

6. **Start the application**
   
   Terminal 1 - Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Terminal 2 - Frontend:
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/health

### Initial Setup

1. **Create Admin Account**
   - Register with role = 'admin'
   - Or use Supabase dashboard to manually set role

2. **Add Food Items**
   - Login as admin
   - Navigate to Admin Dashboard
   - Add food items with categories, prices, etc.

3. **Test the System**
   - Create a student account
   - Browse menu
   - Place test orders
   - Test payment flow with Razorpay test cards

## 📁 Project Structure

```
webapp/
├── src/                          # Frontend source
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── CartSidebar.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── pages/                    # Page components
│   │   ├── Menu.tsx
│   │   ├── Cart.tsx
│   │   ├── Orders.tsx
│   │   ├── GroupOrder.tsx
│   │   ├── Favorites.tsx
│   │   ├── Feedback.tsx
│   │   └── admin/
│   ├── store/                    # Redux store
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── cartSlice.ts
│   │   │   ├── orderSlice.ts
│   │   │   └── menuSlice.ts
│   │   └── index.ts
│   ├── services/                 # API services
│   │   ├── authService.ts
│   │   ├── foodService.ts
│   │   ├── orderService.ts
│   │   └── paymentService.ts
│   ├── lib/                      # Utilities
│   │   ├── supabase.ts
│   │   └── api.ts
│   └── App.tsx
│
├── backend/                      # Backend source
│   ├── src/
│   │   ├── config/               # Configuration
│   │   │   ├── supabase.js
│   │   │   └── razorpay.js
│   │   ├── controllers/          # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── foodController.js
│   │   │   ├── orderController.js
│   │   │   ├── paymentController.js
│   │   │   ├── groupOrderController.js
│   │   │   ├── favoritesController.js
│   │   │   ├── feedbackController.js
│   │   │   └── adminController.js
│   │   ├── middleware/           # Middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validation.js
│   │   ├── routes/               # API routes
│   │   │   ├── auth.js
│   │   │   ├── food.js
│   │   │   ├── orders.js
│   │   │   ├── payments.js
│   │   │   ├── groupOrders.js
│   │   │   ├── favorites.js
│   │   │   ├── feedback.js
│   │   │   └── admin.js
│   │   ├── algorithms/           # Business logic algorithms
│   │   │   ├── recommendation.js
│   │   │   ├── orderPriority.js
│   │   │   └── preparationTime.js
│   │   ├── services/             # Business services
│   │   └── server.js             # Express app
│   └── database/
│       └── schema.sql            # Database schema
│
├── docs/                         # Documentation
│   ├── API.md
│   ├── DATABASE.md
│   └── ARCHITECTURE.md
│
└── README.md                     # This file
```

## 📖 Features Documentation

### Mood-Based Recommendation

The system includes an intelligent recommendation algorithm that suggests food based on user's mood:

- **Happy**: Sweet, light, refreshing items
- **Sad**: Comfort food, warm, creamy items
- **Stressed**: Crunchy, savory, filling items
- **Energetic**: Spicy, tangy, protein-rich items
- **Tired**: Energy-boosting, caffeinated items
- **Hungry**: Large portions, hearty items
- **Adventurous**: Exotic, unique, fusion items
- **Health Conscious**: Nutritious, low-calorie items

### Order Priority System

Orders are prioritized based on:
1. Time until pickup (most important)
2. Waiting time since order placed
3. Order size
4. Payment status
5. Order type (preorder vs immediate)
6. Special circumstances
7. Group orders

### Preparation Time Estimation

Intelligent estimation considering:
- Base preparation time of each item
- Quantity ordered (with economies of scale)
- Items prepared in parallel
- Current queue length
- Buffer time for unexpected delays

### Cancellation Policy

- Orders can be cancelled within 2-3 minutes
- Cannot cancel if status is 'preparing' or later
- Stock is automatically restored on cancellation

## 🔧 API Documentation

See [backend/README.md](backend/README.md) for complete API documentation.

## 🗄️ Database Schema

The database consists of the following main tables:

1. **user_profiles** - User information and roles
2. **food_items** - Menu items
3. **orders** - Order details
4. **order_items** - Items in each order
5. **payments** - Payment transactions
6. **group_orders** - Group order sessions
7. **group_order_participants** - Participants in group orders
8. **favorites** - User favorites
9. **feedback** - Order feedback
10. **food_reviews** - Item-specific reviews

See [backend/database/schema.sql](backend/database/schema.sql) for complete schema with RLS policies.

## 🧮 Algorithms

### 1. Mood-Based Recommendation Algorithm
- Maps moods to food characteristics
- Scores items based on tags, categories, ratings
- Provides diversified recommendations

### 2. Order Priority Algorithm
- Calculates priority scores
- Sorts queue for efficient preparation
- Handles urgent and special orders

### 3. Preparation Time Estimation
- Considers item complexity and quantity
- Accounts for parallel preparation
- Includes queue waiting time

### 4. Idle Time Detection
- Analyzes order patterns
- Identifies low-volume time slots
- Suggests optimal ordering times

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting platform

3. Set environment variables in your hosting platform

### Backend Deployment (Render/Railway/Heroku)

1. Push backend code to Git repository

2. Connect to deployment platform

3. Set environment variables

4. Deploy and get API URL

5. Update frontend `VITE_API_BASE_URL` with production API URL

## 🧪 Testing

### Test Cards (Razorpay Test Mode)

- **Success**: 4111 1111 1111 1111
- **Failure**: 4111 1111 1111 1234
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## 📄 License

This project is created for educational purposes as a college final-year project.

## 👥 Contributors

[Your Name/Team Name]

## 📧 Support

For questions or issues, please create an issue in the repository.

---

**Note**: This is a complete, production-ready system suitable for college final-year projects and real-world deployment. All features are fully functional with proper error handling and security measures.
