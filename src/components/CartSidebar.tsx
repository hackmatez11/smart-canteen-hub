import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, Clock, CreditCard, Wallet, Banknote, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { setCartOpen, updateQuantity, removeFromCart, clearCart } from '@/store/slices/cartSlice';
import { placeOrder, PaymentMethod } from '@/store/slices/orderSlice';
import { Button } from '@/components/ui/button';

const pickupSlots = [
  { time: '10:00 AM', busy: false },
  { time: '10:30 AM', busy: false },
  { time: '11:00 AM', busy: true },
  { time: '11:30 AM', busy: true },
  { time: '12:00 PM', busy: true },
  { time: '12:30 PM', busy: false },
  { time: '1:00 PM', busy: false },
];

const paymentMethods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'upi', label: 'UPI', icon: CreditCard },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'cash', label: 'Cash', icon: Banknote },
];

export function CartSidebar() {
  const dispatch = useAppDispatch();
  const { items, isOpen } = useAppSelector(state => state.cart);
  const [selectedSlot, setSelectedSlot] = useState(pickupSlots[0].time);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('upi');
  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handlePlaceOrder = () => {
    const order = {
      id: `ORD-${Date.now()}`,
      token: String(Math.floor(100 + Math.random() * 900)),
      items: [...items],
      status: 'placed' as const,
      totalAmount: total,
      paymentMethod: selectedPayment,
      pickupTime: selectedSlot,
      createdAt: new Date().toISOString(),
      estimatedTime: items.reduce((sum, item) => sum + 5, 0),
      canCancel: true,
    };
    dispatch(placeOrder(order));
    dispatch(clearCart());
    dispatch(setCartOpen(false));
    setShowCheckout(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setCartOpen(false))}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card z-50 shadow-elevated flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-display text-xl font-bold">Your Cart</h2>
                <p className="text-sm text-muted-foreground">{items.length} items</p>
              </div>
              <button
                onClick={() => dispatch(setCartOpen(false))}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <span className="text-4xl">🛒</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground text-sm">Add some delicious items to get started!</p>
                </div>
              ) : showCheckout ? (
                <div className="p-4 space-y-6">
                  {/* Pickup Time Selection */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Select Pickup Time
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {pickupSlots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                            selectedSlot === slot.time
                              ? 'gradient-primary text-primary-foreground'
                              : slot.busy
                              ? 'bg-warning/10 text-warning border border-warning/20'
                              : 'bg-muted hover:bg-primary/10'
                          }`}
                        >
                          {slot.time}
                          {slot.busy && <span className="block text-xs opacity-80">Busy</span>}
                          {!slot.busy && selectedSlot !== slot.time && (
                            <span className="block text-xs text-success">Idle</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold mb-3">Payment Method</h3>
                    <div className="space-y-2">
                      {paymentMethods.map(method => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPayment(method.id)}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${
                            selectedPayment === method.id
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-muted border-2 border-transparent hover:border-primary/30'
                          }`}
                        >
                          <method.icon className={`w-5 h-5 ${
                            selectedPayment === method.id ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <span className="font-medium">{method.label}</span>
                          {selectedPayment === method.id && (
                            <div className="ml-auto w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-primary-foreground rounded-full"
                              />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      💳 100% Free • No transaction charges
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {items.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 p-3 bg-muted/50 rounded-xl"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-primary font-semibold">₹{item.price}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => dispatch(removeFromCart(item.id))}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 bg-card rounded-lg p-1">
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-4">
                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (5%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Button */}
                {showCheckout ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCheckout(false)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handlePlaceOrder}
                      className="flex-1 gradient-primary border-0 text-primary-foreground shadow-soft hover:shadow-glow"
                    >
                      Place Order
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowCheckout(true)}
                    className="w-full gradient-primary border-0 text-primary-foreground shadow-soft hover:shadow-glow group"
                  >
                    Proceed to Checkout
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
