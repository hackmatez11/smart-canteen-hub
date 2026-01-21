import { supabase } from '../config/supabase.js';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default to today if no dates provided
    const startDate = start_date ? new Date(start_date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = end_date ? new Date(end_date) : new Date();
    endDate.setHours(23, 59, 59, 999);

    // Total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Total revenue
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('payment_status', 'paid')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    // Orders by status
    const { data: ordersByStatus } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const statusCounts = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0
    };

    ordersByStatus?.forEach(order => {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }
    });

    // Total users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student');

    // Average order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top selling items
    const { data: topItems } = await supabase
      .from('order_items')
      .select(`
        food_item_id,
        quantity,
        food_items (
          name,
          price,
          category
        )
      `)
      .limit(1000);

    const itemStats = {};
    topItems?.forEach(item => {
      const id = item.food_item_id;
      if (!itemStats[id]) {
        itemStats[id] = {
          food_item_id: id,
          name: item.food_items.name,
          category: item.food_items.category,
          price: item.food_items.price,
          total_quantity: 0,
          total_revenue: 0
        };
      }
      itemStats[id].total_quantity += item.quantity;
      itemStats[id].total_revenue += item.quantity * item.food_items.price;
    });

    const topSellingItems = Object.values(itemStats)
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, 10);

    // Recent feedback
    const { data: recentFeedback } = await supabase
      .from('feedback')
      .select('rating')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const avgRating = recentFeedback?.length > 0
      ? recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length
      : 0;

    res.json({
      stats: {
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        average_order_value: avgOrderValue,
        total_users: totalUsers,
        average_rating: avgRating,
        orders_by_status: statusCounts
      },
      top_selling_items: topSellingItems,
      date_range: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue analytics
 */
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query; // day, week, month, year

    let startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total_amount, payment_status')
      .eq('payment_status', 'paid')
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    // Group by date
    const revenueByDate = {};
    orders?.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }
      revenueByDate[date] += order.total_amount;
    });

    const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue
    }));

    res.json({
      period,
      data: chartData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order analytics
 */
export const getOrderAnalytics = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;

    let startDate = new Date();
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, status')
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    // Group by date and status
    const ordersByDate = {};
    orders?.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!ordersByDate[date]) {
        ordersByDate[date] = { total: 0, completed: 0, cancelled: 0 };
      }
      ordersByDate[date].total++;
      if (order.status === 'completed') {
        ordersByDate[date].completed++;
      } else if (order.status === 'cancelled') {
        ordersByDate[date].cancelled++;
      }
    });

    const chartData = Object.entries(ordersByDate).map(([date, stats]) => ({
      date,
      ...stats
    }));

    res.json({
      period,
      data: chartData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category-wise sales
 */
export const getCategorySales = async (req, res, next) => {
  try {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        quantity,
        price,
        food_items (
          category
        )
      `);

    const categoryStats = {};
    orderItems?.forEach(item => {
      const category = item.food_items.category;
      if (!categoryStats[category]) {
        categoryStats[category] = {
          category,
          total_quantity: 0,
          total_revenue: 0
        };
      }
      categoryStats[category].total_quantity += item.quantity;
      categoryStats[category].total_revenue += item.quantity * item.price;
    });

    const data = Object.values(categoryStats)
      .sort((a, b) => b.total_revenue - a.total_revenue);

    res.json({
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get peak hours
 */
export const getPeakHours = async (req, res, next) => {
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const hourCounts = new Array(24).fill(0);
    orders?.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourCounts[hour]++;
    });

    const data = hourCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      orders: count
    }));

    res.json({
      data
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboardStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getCategorySales,
  getPeakHours
};
