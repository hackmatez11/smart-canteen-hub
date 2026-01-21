/**
 * Preparation Time Estimation Algorithm
 * Estimates time required to prepare orders based on various factors
 */

/**
 * Calculate preparation time for a food item
 * @param {Object} foodItem - Food item with base preparation time
 * @param {number} quantity - Quantity ordered
 * @returns {number} - Estimated preparation time in minutes
 */
export function calculateItemPreparationTime(foodItem, quantity) {
  const baseTime = foodItem.preparation_time || 10; // Default 10 minutes
  
  // Time increases with quantity but not linearly (economies of scale)
  let timeMultiplier = 1;
  
  if (quantity === 1) {
    timeMultiplier = 1;
  } else if (quantity <= 3) {
    timeMultiplier = 1 + (quantity - 1) * 0.3; // 30% additional time per extra item
  } else if (quantity <= 5) {
    timeMultiplier = 1.6 + (quantity - 3) * 0.2; // 20% additional
  } else {
    timeMultiplier = 2 + (quantity - 5) * 0.1; // 10% additional
  }
  
  return Math.ceil(baseTime * timeMultiplier);
}

/**
 * Calculate total preparation time for an order
 * @param {Array} orderItems - Array of order items with food_items and quantities
 * @param {number} currentQueueLength - Number of orders in queue
 * @returns {Object} - Estimated preparation times
 */
export function estimateOrderPreparationTime(orderItems, currentQueueLength = 0) {
  let totalTime = 0;
  let maxItemTime = 0;
  
  // Calculate time for each item
  const itemTimes = orderItems.map(item => {
    const itemTime = calculateItemPreparationTime(
      item.food_items || item.food_item,
      item.quantity
    );
    maxItemTime = Math.max(maxItemTime, itemTime);
    return itemTime;
  });
  
  // For multiple items, some can be prepared in parallel
  // Use the maximum item time plus 30% of remaining items
  if (orderItems.length === 1) {
    totalTime = itemTimes[0];
  } else {
    const remainingTime = itemTimes.reduce((sum, time) => sum + time, 0) - maxItemTime;
    totalTime = maxItemTime + (remainingTime * 0.3);
  }
  
  // Add queue waiting time
  // Assume average 8 minutes per order in queue
  const queueTime = currentQueueLength * 8;
  
  // Add buffer time (10% for unexpected delays)
  const bufferTime = totalTime * 0.1;
  
  return {
    basePreparationTime: Math.ceil(totalTime),
    queueWaitTime: queueTime,
    bufferTime: Math.ceil(bufferTime),
    totalEstimatedTime: Math.ceil(totalTime + queueTime + bufferTime),
    readyByTime: new Date(Date.now() + (totalTime + queueTime + bufferTime) * 60 * 1000)
  };
}

/**
 * Suggest optimal pickup time based on current load
 * @param {Array} currentOrders - Current pending orders
 * @param {Date} earliestTime - Earliest possible pickup time
 * @returns {Array} - Suggested pickup time slots
 */
export function suggestOptimalPickupTime(currentOrders = [], earliestTime = new Date()) {
  const suggestions = [];
  const slotDuration = 30; // 30-minute slots
  const maxOrdersPerSlot = 15; // Maximum orders per slot for quality
  
  // Group current orders by time slots
  const ordersBySlot = {};
  currentOrders.forEach(order => {
    const pickupTime = new Date(order.pickup_time);
    const slotKey = Math.floor(pickupTime.getTime() / (slotDuration * 60 * 1000));
    ordersBySlot[slotKey] = (ordersBySlot[slotKey] || 0) + 1;
  });
  
  // Generate next 12 slots (6 hours)
  const startSlot = Math.floor(earliestTime.getTime() / (slotDuration * 60 * 1000));
  
  for (let i = 0; i < 12; i++) {
    const slotKey = startSlot + i;
    const slotStartTime = new Date(slotKey * slotDuration * 60 * 1000);
    const slotEndTime = new Date((slotKey + 1) * slotDuration * 60 * 1000);
    const orderCount = ordersBySlot[slotKey] || 0;
    const availableCapacity = maxOrdersPerSlot - orderCount;
    
    // Calculate load percentage
    const loadPercentage = (orderCount / maxOrdersPerSlot) * 100;
    
    // Determine if this is an idle or recommended slot
    let recommendation = 'available';
    if (loadPercentage <= 30) {
      recommendation = 'idle'; // Low load - perfect time
    } else if (loadPercentage <= 60) {
      recommendation = 'optimal'; // Good balance
    } else if (loadPercentage <= 85) {
      recommendation = 'busy'; // Getting crowded
    } else {
      recommendation = 'full'; // Nearly full
    }
    
    suggestions.push({
      slotKey,
      startTime: slotStartTime,
      endTime: slotEndTime,
      currentOrders: orderCount,
      availableCapacity,
      loadPercentage: Math.round(loadPercentage),
      recommendation,
      estimatedWaitTime: Math.ceil(orderCount * 0.5) // Rough estimate
    });
  }
  
  return suggestions;
}

/**
 * Detect idle time slots (low order volume)
 * @param {Array} orders - All orders for analysis
 * @param {Date} startDate - Start date for analysis
 * @param {Date} endDate - End date for analysis
 * @returns {Array} - Idle time slots
 */
export function detectIdleTimeSlots(orders, startDate, endDate) {
  const slotDuration = 60; // 1-hour slots
  const idleThreshold = 5; // Less than 5 orders per hour is considered idle
  
  const slots = {};
  const startSlot = Math.floor(startDate.getTime() / (slotDuration * 60 * 1000));
  const endSlot = Math.floor(endDate.getTime() / (slotDuration * 60 * 1000));
  
  // Initialize slots
  for (let i = startSlot; i <= endSlot; i++) {
    slots[i] = {
      slotKey: i,
      startTime: new Date(i * slotDuration * 60 * 1000),
      endTime: new Date((i + 1) * slotDuration * 60 * 1000),
      orderCount: 0
    };
  }
  
  // Count orders in each slot
  orders.forEach(order => {
    const orderTime = new Date(order.created_at);
    const slotKey = Math.floor(orderTime.getTime() / (slotDuration * 60 * 1000));
    
    if (slots[slotKey]) {
      slots[slotKey].orderCount++;
    }
  });
  
  // Filter idle slots
  return Object.values(slots)
    .filter(slot => slot.orderCount < idleThreshold)
    .map(slot => ({
      ...slot,
      isIdle: true,
      capacity: idleThreshold - slot.orderCount
    }));
}

export default {
  calculateItemPreparationTime,
  estimateOrderPreparationTime,
  suggestOptimalPickupTime,
  detectIdleTimeSlots
};
