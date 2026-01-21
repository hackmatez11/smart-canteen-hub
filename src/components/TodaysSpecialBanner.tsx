import { motion } from 'framer-motion';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { addToCart, setCartOpen } from '@/store/slices/cartSlice';
import { Button } from '@/components/ui/button';

export function TodaysSpecialBanner() {
  const dispatch = useAppDispatch();
  const todaysSpecial = useAppSelector(state => state.menu.todaysSpecial);

  if (!todaysSpecial) return null;

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: todaysSpecial.id,
      name: todaysSpecial.name,
      price: todaysSpecial.price,
      image: todaysSpecial.image,
    }));
    dispatch(setCartOpen(true));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-primary-foreground"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex flex-col md:flex-row items-center gap-6">
        {/* Image */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl" />
          <img
            src={todaysSpecial.image}
            alt={todaysSpecial.name}
            className="relative w-32 h-32 rounded-2xl object-cover shadow-elevated"
          />
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-warning flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-warning-foreground" />
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm">
              ⭐ Today's Special
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
            {todaysSpecial.name}
          </h2>
          <p className="text-white/80 text-sm mb-4 max-w-md">
            {todaysSpecial.description}
          </p>
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{todaysSpecial.prepTime} mins</span>
            </div>
            <div className="text-2xl font-bold">₹{todaysSpecial.price}</div>
          </div>
        </div>

        {/* CTA */}
        <Button
          onClick={handleAddToCart}
          size="lg"
          className="bg-white text-primary hover:bg-white/90 shadow-soft font-semibold group"
        >
          Order Now
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
}
