import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type FoodCategory = 'all' | 'breakfast' | 'lunch' | 'snacks' | 'beverages' | 'desserts' | 'fasting';
export type MoodTag = 'spicy' | 'light' | 'healthy' | 'comfort' | 'quick' | 'fasting';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: FoodCategory;
  isAvailable: boolean;
  stockCount: number;
  prepTime: number; // in minutes
  moodTags: MoodTag[];
  isSpecial?: boolean;
  isDiscounted?: boolean;
  discountPercent?: number;
  toppings?: { id: string; name: string; price: number }[];
  isFavorite?: boolean;
}

interface MenuState {
  items: MenuItem[];
  filteredItems: MenuItem[];
  selectedCategory: FoodCategory;
  searchQuery: string;
  selectedMood: MoodTag | null;
  todaysSpecial: MenuItem | null;
  surplusItems: MenuItem[];
  isLoading: boolean;
}

// Sample menu data
const sampleMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe with spiced potato filling, served with sambhar & chutney',
    price: 60,
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400',
    category: 'breakfast',
    isAvailable: true,
    stockCount: 25,
    prepTime: 8,
    moodTags: ['comfort', 'light'],
    toppings: [
      { id: 't1', name: 'Extra Chutney', price: 10 },
      { id: 't2', name: 'Cheese', price: 20 },
    ],
  },
  {
    id: '2',
    name: 'Paneer Butter Masala',
    description: 'Rich, creamy tomato gravy with soft paneer cubes',
    price: 120,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
    category: 'lunch',
    isAvailable: true,
    stockCount: 15,
    prepTime: 12,
    moodTags: ['comfort', 'spicy'],
    isSpecial: true,
    toppings: [
      { id: 't3', name: 'Extra Paneer', price: 40 },
      { id: 't4', name: 'Butter Naan', price: 30 },
    ],
  },
  {
    id: '3',
    name: 'Veg Biryani',
    description: 'Fragrant basmati rice with mixed vegetables and aromatic spices',
    price: 100,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    category: 'lunch',
    isAvailable: true,
    stockCount: 20,
    prepTime: 10,
    moodTags: ['comfort', 'spicy'],
    toppings: [
      { id: 't5', name: 'Raita', price: 20 },
      { id: 't6', name: 'Extra Gravy', price: 25 },
    ],
  },
  {
    id: '4',
    name: 'Samosa',
    description: 'Crispy fried pastry with spiced potato filling',
    price: 20,
    image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=400',
    category: 'snacks',
    isAvailable: true,
    stockCount: 50,
    prepTime: 3,
    moodTags: ['quick', 'spicy'],
  },
  {
    id: '5',
    name: 'Masala Chai',
    description: 'Traditional Indian spiced tea with milk',
    price: 15,
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400',
    category: 'beverages',
    isAvailable: true,
    stockCount: 100,
    prepTime: 2,
    moodTags: ['quick', 'comfort'],
  },
  {
    id: '6',
    name: 'Cold Coffee',
    description: 'Creamy cold coffee with a hint of chocolate',
    price: 50,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
    category: 'beverages',
    isAvailable: false,
    stockCount: 0,
    prepTime: 5,
    moodTags: ['quick', 'light'],
  },
  {
    id: '7',
    name: 'Gulab Jamun',
    description: 'Soft milk dumplings soaked in rose-flavored sugar syrup',
    price: 40,
    image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=400',
    category: 'desserts',
    isAvailable: true,
    stockCount: 30,
    prepTime: 2,
    moodTags: ['comfort'],
  },
  {
    id: '8',
    name: 'Sabudana Khichdi',
    description: 'Light sago pearls with peanuts and mild spices - perfect for fasting',
    price: 50,
    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400',
    category: 'fasting',
    isAvailable: true,
    stockCount: 12,
    prepTime: 10,
    moodTags: ['fasting', 'light', 'healthy'],
  },
  {
    id: '9',
    name: 'Fruit Salad',
    description: 'Fresh seasonal fruits with a drizzle of honey',
    price: 45,
    image: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=400',
    category: 'snacks',
    isAvailable: true,
    stockCount: 8,
    prepTime: 5,
    moodTags: ['healthy', 'light'],
    isDiscounted: true,
    discountPercent: 20,
  },
  {
    id: '10',
    name: 'Aloo Paratha',
    description: 'Stuffed flatbread with spiced potato filling, served with curd & pickle',
    price: 45,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
    category: 'breakfast',
    isAvailable: true,
    stockCount: 18,
    prepTime: 7,
    moodTags: ['comfort', 'spicy'],
    toppings: [
      { id: 't7', name: 'Extra Butter', price: 10 },
      { id: 't8', name: 'Curd', price: 15 },
    ],
  },
  {
    id: '11',
    name: 'Veg Sandwich',
    description: 'Grilled sandwich with fresh veggies and cheese',
    price: 40,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400',
    category: 'snacks',
    isAvailable: true,
    stockCount: 22,
    prepTime: 5,
    moodTags: ['quick', 'light'],
  },
  {
    id: '12',
    name: 'Lassi',
    description: 'Traditional Punjabi yogurt drink - sweet or salty',
    price: 35,
    image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400',
    category: 'beverages',
    isAvailable: true,
    stockCount: 40,
    prepTime: 3,
    moodTags: ['quick', 'healthy', 'light'],
  },
];

const initialState: MenuState = {
  items: sampleMenuItems,
  filteredItems: sampleMenuItems,
  selectedCategory: 'all',
  searchQuery: '',
  selectedMood: null,
  todaysSpecial: sampleMenuItems.find(item => item.isSpecial) || null,
  surplusItems: sampleMenuItems.filter(item => item.isDiscounted),
  isLoading: false,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setCategory: (state, action: PayloadAction<FoodCategory>) => {
      state.selectedCategory = action.payload;
      state.filteredItems = filterItems(state);
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filteredItems = filterItems(state);
    },
    setMoodFilter: (state, action: PayloadAction<MoodTag | null>) => {
      state.selectedMood = action.payload;
      state.filteredItems = filterItems(state);
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.isFavorite = !item.isFavorite;
      }
    },
    updateStock: (state, action: PayloadAction<{ id: string; count: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.stockCount = action.payload.count;
        item.isAvailable = action.payload.count > 0;
      }
      state.filteredItems = filterItems(state);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

function filterItems(state: MenuState): MenuItem[] {
  return state.items.filter(item => {
    const matchesCategory = state.selectedCategory === 'all' || item.category === state.selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesMood = !state.selectedMood || item.moodTags.includes(state.selectedMood);
    return matchesCategory && matchesSearch && matchesMood;
  });
}

export const { setCategory, setSearchQuery, setMoodFilter, toggleFavorite, updateStock, setLoading } = menuSlice.actions;
export default menuSlice.reducer;
