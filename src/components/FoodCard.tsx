import { motion } from 'framer-motion';
import { Heart, Clock, Plus, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { addToCart, setCartOpen } from '@/store/slices/cartSlice';
import { toggleFavorite, MenuItem } from '@/store/slices/menuSlice';
import { Badge } from '@/components/ui/badge';

interface FoodCardProps {
  item: MenuItem;
  index: number;
}

export function FoodCard({ item, index }: FoodCardProps) {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(state => state.cart.items);
  const itemInCart = cartItems.find(cartItem => cartItem.id === item.id);

  const handleAddToCart = () => {
    if (!item.isAvailable) return;
    dispatch(addToCart({
      id: item.id,
      name: item.name,
      price: item.discountPercent 
        ? item.price - (item.price * item.discountPercent / 100)
        : item.price,
      image: item.image,
    }));
    dispatch(setCartOpen(true));
  };

  const discountedPrice = item.discountPercent 
    ? item.price - (item.price * item.discountPercent / 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 ${
        !item.isAvailable ? 'opacity-60' : ''
      }`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {item.isSpecial && (
            <Badge className="gradient-primary border-0 text-primary-foreground text-xs animate-float">
              ⭐ Today's Special
            </Badge>
          )}
          {item.isDiscounted && (
            <Badge className="bg-accent border-0 text-accent-foreground text-xs">
              {item.discountPercent}% OFF
            </Badge>
          )}
          {item.stockCount <= 5 && item.stockCount > 0 && (
            <Badge variant="outline" className="bg-card/90 text-destructive border-destructive/30 text-xs">
              Only {item.stockCount} left!
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => dispatch(toggleFavorite(item.id))}
          className="absolute top-3 right-3 p-2 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              item.isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground'
            }`}
          />
        </button>

        {/* Unavailable Overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card text-foreground font-medium">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Currently Unavailable
            </div>
          </div>
        )}

        {/* Prep Time */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-sm text-xs font-medium">
          <Clock className="w-3.5 h-3.5 text-primary" />
          {item.prepTime} mins
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
          </div>
        </div>

        {/* Mood Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {item.moodTags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs capitalize">
              {tag}
            </span>
          ))}
        </div>

        {/* Price & Add Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              ₹{discountedPrice?.toFixed(0) || item.price}
            </span>
            {discountedPrice && (
              <span className="text-sm text-muted-foreground line-through">₹{item.price}</span>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              item.isAvailable
                ? 'gradient-primary text-primary-foreground shadow-soft hover:shadow-glow'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            {itemInCart ? `Add (${itemInCart.quantity})` : 'Add'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
