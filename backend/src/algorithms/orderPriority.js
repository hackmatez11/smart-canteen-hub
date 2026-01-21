/**
 * Order Priority and Queue Management Algorithm
 * Determines order priority based on various factors
 */

/**
 * Calculate priority score for an order
 * Higher score = higher priority
 * @param {Object} order - Order object with pickup_time, order_time, etc.
 * @param {Date} currentTime - Current time
 * @returns {number} - Priority score
 */
export function calculateOrderPriority(order, currentTime = new Date()) {
  let priorityScore = 100; // Base priority
  
  // Factor 1: Time until pickup (most important)
  const pickupTime = new Date(order.pickup_time);
  const orderTime = new Date(order.created_at);
  const timeUntilPickup = (pickupTime - currentTime) / (1000 * 60); // in minutes
  
  if (timeUntilPickup <= 15) {
    priorityScore += 50; // Very urgent
  } else if (timeUntilPickup <= 30) {
    priorityScore += 30; // Urgent
  } else if (timeUntilPickup <= 60) {
    priorityScore += 15; // Moderate
  } else {
    priorityScore += 5; // Can wait
  }
  
  // Factor 2: Waiting time (how long since order was placed)
  const waitingTime = (currentTime - orderTime) / (1000 * 60); // in minutes
  priorityScore += Math.min(waitingTime * 0.5, 30); // Max 30 points
  
  // Factor 3: Order size (smaller orders can be prepared faster)
  const itemCount = order.items?.length || order.total_items || 1;
  if (itemCount <= 2) {
    priorityScore += 10; // Quick orders
  } else if (itemCount >= 5) {
    priorityScore -= 5; // Large orders take longer
  }
  
  // Factor 4: Payment status
  if (order.payment_status === 'paid') {
    priorityScore += 15; // Paid orders get priority
  }
  
  // Factor 5: Order type
  if (order.is_preorder) {
    priorityScore -= 10; // Preorders can wait a bit
  }
  
  // Factor 6: Special circumstances
  if (order.is_urgent || order.priority === 'high') {
    priorityScore += 25;
  }
  
  // Factor 7: Group orders
  if (order.group_order_id) {
    priorityScore += 8; // Slight priority for group orders
  }
  
  return Math.round(priorityScore);
}

/**
 * Sort orders by priority
 * @param {Array} orders - Array of orders
 * @returns {Array} - Sorted orders by priority (highest first)
 */
export function sortOrdersByPriority(orders) {
  const currentTime = new Date();
  
  return orders
    .map(order => ({
      ...order,
      priorityScore: calculateOrderPriority(order, currentTime)
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Get next order to prepare
 * @param {Array} pendingOrders - Array of pending orders
 * @returns {Object|null} - Next order to prepare
 */
export function getNextOrderToPrepare(pendingOrders) {
  if (!pendingOrders || pendingOrders.length === 0) {
    return null;
  }
  
  const sortedOrders = sortOrdersByPriority(pendingOrders);
  return sortedOrders[0];
}

/**
 * Check if order can be cancelled
 * @param {Object} order - Order object
 * @param {number} cancellationWindow - Cancellation window in minutes (default 3)
 * @returns {Object} - { canCancel: boolean, reason: string }
 */
export function canCancelOrder(order, cancellationWindow = 3) {
  const currentTime = new Date();
  const orderTime = new Date(order.created_at);
  const minutesSinceOrder = (currentTime - orderTime) / (1000 * 60);
  
  // Check if order is already in preparation
  if (order.status === 'preparing' || order.status === 'ready') {
    return {
      canCancel: false,
      reason: 'Order is already being prepared'
    };
  }
  
  // Check if order is completed
  if (order.status === 'completed' || order.status === 'picked_up') {
    return {
      canCancel: false,
      reason: 'Order is already completed'
    };
  }
  
  // Check cancellation window
  if (minutesSinceOrder > cancellationWindow) {
    return {
      canCancel: false,
      reason: `Cancellation window of ${cancellationWindow} minutes has passed`
    };
  }
  
  return {
    canCancel: true,
    reason: 'Order can be cancelled'
  };
}

/**
 * Group orders by pickup time slot
 * @param {Array} orders - Array of orders
 * @param {number} slotDuration - Slot duration in minutes (default 30)
 * @returns {Object} - Orders grouped by time slot
 */
export function groupOrdersByTimeSlot(orders, slotDuration = 30) {
  const slots = {};
  
  orders.forEach(order => {
    const pickupTime = new Date(order.pickup_time);
    const slotKey = Math.floor(pickupTime.getTime() / (slotDuration * 60 * 1000));
    
    if (!slots[slotKey]) {
      slots[slotKey] = {
        startTime: new Date(slotKey * slotDuration * 60 * 1000),
        endTime: new Date((slotKey + 1) * slotDuration * 60 * 1000),
        orders: []
      };
    }
    
    slots[slotKey].orders.push(order);
  });
  
  return slots;
}

export default {
  calculateOrderPriority,
  sortOrdersByPriority,
  getNextOrderToPrepare,
  canCancelOrder,
  groupOrdersByTimeSlot
};
