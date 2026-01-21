import { motion } from 'framer-motion';
import { Percent, Clock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { addToCart, setCartOpen } from '@/store/slices/cartSlice';

export function SurplusFoodAlert() {
  const dispatch = useAppDispatch();
  const surplusItems = useAppSelector(state => state.menu.surplusItems);

  if (surplusItems.length === 0) return null;

  const handleAddToCart = (item: typeof surplusItems[0]) => {
    dispatch(addToCart({
      id: item.id,
      name: item.name,
      price: item.price - (item.price * (item.discountPercent || 0) / 100),
      image: item.image,
    }));
    dispatch(setCartOpen(true));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-accent/10 border border-accent/20 rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <Percent className="w-4 h-4 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Surplus Food Deals</h3>
          <p className="text-xs text-muted-foreground">Limited time offers - Help reduce food waste!</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {surplusItems.map(item => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAddToCart(item)}
            className="flex-shrink-0 flex items-center gap-3 p-3 bg-card rounded-xl shadow-soft hover:shadow-card transition-all min-w-[200px]"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="text-left">
              <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-accent font-bold">
                  ₹{(item.price - (item.price * (item.discountPercent || 0) / 100)).toFixed(0)}
                </span>
                <span className="text-xs text-muted-foreground line-through">₹{item.price}</span>
                <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-xs font-medium">
                  {item.discountPercent}% OFF
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
