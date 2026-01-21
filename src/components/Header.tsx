import { Search, ShoppingCart, Bell, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { setSearchQuery, setMoodFilter, MoodTag } from '@/store/slices/menuSlice';
import { toggleCart } from '@/store/slices/cartSlice';
import { Badge } from '@/components/ui/badge';

const moodSuggestions: { mood: MoodTag; label: string; emoji: string }[] = [
  { mood: 'spicy', label: 'Spicy', emoji: '🌶️' },
  { mood: 'light', label: 'Light', emoji: '🥗' },
  { mood: 'healthy', label: 'Healthy', emoji: '💪' },
  { mood: 'comfort', label: 'Comfort', emoji: '🤗' },
  { mood: 'quick', label: 'Quick Bite', emoji: '⚡' },
  { mood: 'fasting', label: 'Fasting', emoji: '🙏' },
];

export function Header() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const { searchQuery, selectedMood } = useAppSelector(state => state.menu);
  const currentOrder = useAppSelector(state => state.order.currentOrder);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <span className="text-xl">🍽️</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold text-foreground">Campus Bites</h1>
              <p className="text-xs text-muted-foreground">Smart Canteen</p>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <div className={`w-full relative transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for food, mood, or cravings..."
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card transition-all outline-none text-sm"
              />
            </div>
            
            {/* Mood Suggestions Dropdown */}
            <AnimatePresence>
              {searchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 p-4 bg-card rounded-2xl shadow-elevated border border-border"
                >
                  <p className="text-xs font-medium text-muted-foreground mb-3">How are you feeling today?</p>
                  <div className="flex flex-wrap gap-2">
                    {moodSuggestions.map(({ mood, label, emoji }) => (
                      <button
                        key={mood}
                        onClick={() => dispatch(setMoodFilter(selectedMood === mood ? null : mood))}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedMood === mood
                            ? 'gradient-primary text-primary-foreground shadow-soft'
                            : 'bg-muted hover:bg-primary/10 text-foreground'
                        }`}
                      >
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Order Status Badge */}
            {currentOrder && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  currentOrder.status === 'ready'
                    ? 'bg-success text-success-foreground animate-pulse-glow'
                    : 'bg-warning/20 text-warning'
                }`}
              >
                <span className={currentOrder.status === 'ready' ? 'animate-token-blink' : ''}>
                  #{currentOrder.token}
                </span>
                <span className="text-xs">
                  {currentOrder.status === 'ready' ? 'Ready!' : 'Preparing...'}
                </span>
              </motion.div>
            )}

            <button className="relative p-2.5 rounded-xl hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
            </button>

            <button
              onClick={() => dispatch(toggleCart())}
              className="relative p-2.5 rounded-xl hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-muted-foreground" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center gradient-primary border-0 text-xs">
                  {totalItems}
                </Badge>
              )}
            </button>

            <button className="hidden sm:flex p-2.5 rounded-xl hover:bg-muted transition-colors">
              <User className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search food..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card transition-all outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Mood filters</p>
              <div className="flex flex-wrap gap-2">
                {moodSuggestions.map(({ mood, label, emoji }) => (
                  <button
                    key={mood}
                    onClick={() => dispatch(setMoodFilter(selectedMood === mood ? null : mood))}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedMood === mood
                        ? 'gradient-primary text-primary-foreground'
                        : 'bg-muted hover:bg-primary/10 text-foreground'
                    }`}
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
