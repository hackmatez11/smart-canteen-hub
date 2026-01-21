import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { setCategory, FoodCategory } from '@/store/slices/menuSlice';

const categories: { id: FoodCategory; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '🍴' },
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'lunch', label: 'Lunch', emoji: '🍛' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
  { id: 'beverages', label: 'Drinks', emoji: '☕' },
  { id: 'desserts', label: 'Desserts', emoji: '🍨' },
  { id: 'fasting', label: 'Fasting', emoji: '🙏' },
];

export function CategoryFilter() {
  const dispatch = useAppDispatch();
  const selectedCategory = useAppSelector(state => state.menu.selectedCategory);

  return (
    <div className="overflow-x-auto scrollbar-hide py-2">
      <div className="flex gap-2 min-w-max px-1">
        {categories.map(({ id, label, emoji }) => (
          <motion.button
            key={id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => dispatch(setCategory(id))}
            className={`relative px-4 py-2.5 rounded-2xl font-medium text-sm whitespace-nowrap transition-all ${
              selectedCategory === id
                ? 'text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            }`}
          >
            {selectedCategory === id && (
              <motion.div
                layoutId="categoryBg"
                className="absolute inset-0 gradient-primary rounded-2xl shadow-soft"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              <span className="text-lg">{emoji}</span>
              <span>{label}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
