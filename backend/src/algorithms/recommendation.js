/**
 * Mood-based Food Recommendation Algorithm
 * Recommends food items based on user's current mood
 */

// Mood to food characteristics mapping
const moodFoodMapping = {
  happy: {
    tags: ['sweet', 'dessert', 'colorful', 'light', 'refreshing'],
    categories: ['desserts', 'beverages', 'snacks'],
    weight: 1.5
  },
  sad: {
    tags: ['comfort', 'warm', 'creamy', 'chocolate', 'hearty'],
    categories: ['main_course', 'desserts', 'beverages'],
    weight: 1.8
  },
  stressed: {
    tags: ['comfort', 'crunchy', 'savory', 'filling', 'warm'],
    categories: ['snacks', 'main_course', 'beverages'],
    weight: 1.6
  },
  energetic: {
    tags: ['spicy', 'tangy', 'protein-rich', 'vibrant', 'bold'],
    categories: ['main_course', 'snacks', 'beverages'],
    weight: 1.4
  },
  tired: {
    tags: ['energy-boost', 'caffeine', 'protein-rich', 'easy-to-eat', 'nutritious'],
    categories: ['beverages', 'snacks', 'main_course'],
    weight: 1.7
  },
  hungry: {
    tags: ['filling', 'hearty', 'protein-rich', 'satisfying', 'large-portion'],
    categories: ['main_course', 'combos'],
    weight: 2.0
  },
  adventurous: {
    tags: ['exotic', 'spicy', 'unique', 'fusion', 'experimental'],
    categories: ['specials', 'main_course', 'snacks'],
    weight: 1.3
  },
  health_conscious: {
    tags: ['healthy', 'low-calorie', 'nutritious', 'fresh', 'organic'],
    categories: ['salads', 'beverages', 'light_meals'],
    weight: 1.5
  }
};

/**
 * Calculate recommendation score for a food item based on mood
 * @param {Object} foodItem - The food item to score
 * @param {string} mood - User's current mood
 * @param {Object} userPreferences - User's historical preferences
 * @returns {number} - Recommendation score
 */
export function calculateMoodScore(foodItem, mood, userPreferences = {}) {
  let score = 0;
  
  const moodProfile = moodFoodMapping[mood.toLowerCase()] || moodFoodMapping.happy;
  
  // Base score from category match
  if (moodProfile.categories.includes(foodItem.category)) {
    score += 30 * moodProfile.weight;
  }
  
  // Score from tag matches
  if (foodItem.mood_tags && Array.isArray(foodItem.mood_tags)) {
    const matchingTags = foodItem.mood_tags.filter(tag => 
      moodProfile.tags.includes(tag.toLowerCase())
    );
    score += matchingTags.length * 20 * moodProfile.weight;
  }
  
  // Boost for popular items
  if (foodItem.rating && foodItem.rating >= 4) {
    score += (foodItem.rating - 3) * 15;
  }
  
  // Boost for frequently ordered items by user
  if (userPreferences.frequentlyOrdered && 
      userPreferences.frequentlyOrdered.includes(foodItem.id)) {
    score += 25;
  }
  
  // Penalize if unavailable
  if (!foodItem.available || foodItem.stock_quantity <= 0) {
    score *= 0.1;
  }
  
  // Boost for specials
  if (foodItem.is_special) {
    score += 10;
  }
  
  return Math.round(score);
}

/**
 * Get top recommended food items based on mood
 * @param {Array} foodItems - All available food items
 * @param {string} mood - User's current mood
 * @param {Object} userPreferences - User's preferences and history
 * @param {number} limit - Number of recommendations to return
 * @returns {Array} - Top recommended food items with scores
 */
export function getMoodBasedRecommendations(foodItems, mood, userPreferences = {}, limit = 10) {
  // Calculate scores for all items
  const scoredItems = foodItems.map(item => ({
    ...item,
    recommendationScore: calculateMoodScore(item, mood, userPreferences)
  }));
  
  // Sort by score (descending) and return top items
  return scoredItems
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit);
}

/**
 * Get diversified recommendations (mix of categories)
 * @param {Array} recommendations - Sorted recommendations
 * @returns {Array} - Diversified recommendations
 */
export function diversifyRecommendations(recommendations) {
  const diversified = [];
  const categoryCounts = {};
  const maxPerCategory = 3;
  
  for (const item of recommendations) {
    const category = item.category;
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    
    if (categoryCounts[category] <= maxPerCategory) {
      diversified.push(item);
    }
    
    if (diversified.length >= 10) break;
  }
  
  return diversified;
}

export default {
  calculateMoodScore,
  getMoodBasedRecommendations,
  diversifyRecommendations,
  moodFoodMapping
};
