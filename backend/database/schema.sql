-- Smart College Canteen Database Schema
-- To be executed in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food Items Table
CREATE TABLE IF NOT EXISTS food_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  preparation_time INTEGER NOT NULL DEFAULT 10 CHECK (preparation_time > 0),
  available BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER,
  is_special BOOLEAN DEFAULT FALSE,
  is_seasonal BOOLEAN DEFAULT FALSE,
  is_fasting BOOLEAN DEFAULT FALSE,
  is_surplus BOOLEAN DEFAULT FALSE,
  discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  tags TEXT[],
  mood_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Orders Table
CREATE TABLE IF NOT EXISTS group_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Group Order Participants Table
CREATE TABLE IF NOT EXISTS group_order_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_order_id UUID NOT NULL REFERENCES group_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('creator', 'participant')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_order_id, user_id)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  group_order_id UUID REFERENCES group_orders(id) ON DELETE SET NULL,
  order_token TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_ready_time TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('online', 'cash')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  payment_verified_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  special_instructions TEXT,
  notes TEXT,
  is_preorder BOOLEAN DEFAULT TRUE,
  is_urgent BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  customizations TEXT,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  refund_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites Table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, food_item_id)
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food Reviews Table (item-specific reviews)
CREATE TABLE IF NOT EXISTS food_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_food_item_id ON order_items(food_item_id);
CREATE INDEX idx_food_items_category ON food_items(category);
CREATE INDEX idx_food_items_available ON food_items(available);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_feedback_order_id ON feedback(order_id);
CREATE INDEX idx_food_reviews_food_item_id ON food_reviews(food_item_id);
CREATE INDEX idx_group_order_participants_group_order_id ON group_order_participants(group_order_id);
CREATE INDEX idx_group_order_participants_user_id ON group_order_participants(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at
  BEFORE UPDATE ON food_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_order_participants ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Food Items Policies
CREATE POLICY "Anyone can view food items" ON food_items FOR SELECT USING (true);
CREATE POLICY "Admins can insert food items" ON food_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update food items" ON food_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete food items" ON food_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Orders Policies
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Order Items Policies
CREATE POLICY "Users can view order items of their orders" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND (user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "Users can insert order items for their orders" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);

-- Payments Policies
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create payments for their orders" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorites Policies
CREATE POLICY "Users can view their own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to their favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from their favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Feedback Policies (anonymous feedback allowed)
CREATE POLICY "Anyone can view feedback" ON feedback FOR SELECT USING (true);
CREATE POLICY "Users can create feedback" ON feedback FOR INSERT WITH CHECK (
  user_id IS NULL OR auth.uid() = user_id
);
CREATE POLICY "Admins can delete feedback" ON feedback FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Food Reviews Policies (anonymous reviews allowed)
CREATE POLICY "Anyone can view food reviews" ON food_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create food reviews" ON food_reviews FOR INSERT WITH CHECK (
  user_id IS NULL OR auth.uid() = user_id
);

-- Group Orders Policies
CREATE POLICY "Users can view group orders they're part of" ON group_orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_order_participants WHERE group_order_id = id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create group orders" ON group_orders FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their group orders" ON group_orders FOR UPDATE USING (auth.uid() = creator_id);

-- Group Order Participants Policies
CREATE POLICY "Users can view participants of their group orders" ON group_order_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_order_participants WHERE group_order_id = group_order_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can join group orders" ON group_order_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave group orders" ON group_order_participants FOR DELETE USING (auth.uid() = user_id);
