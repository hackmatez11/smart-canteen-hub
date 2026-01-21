import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle, Loader2, Ban } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { updateOrderStatus, cancelOrder, completeOrder } from '@/store/slices/orderSlice';
import { Button } from '@/components/ui/button';

export function OrderTracker() {
  const dispatch = useAppDispatch();
  const currentOrder = useAppSelector(state => state.order.currentOrder);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [cancelTimeLeft, setCancelTimeLeft] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (currentOrder) {
      setIsVisible(true);
      setTimeLeft(currentOrder.estimatedTime * 60);
      setCancelTimeLeft(180); // 3 minutes to cancel
    }
  }, [currentOrder?.id]);

  // Simulate order status updates
  useEffect(() => {
    if (!currentOrder || currentOrder.status === 'cancelled') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    const cancelTimer = setInterval(() => {
      setCancelTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 0) {
          if (currentOrder.canCancel) {
            dispatch(updateOrderStatus({ id: currentOrder.id, status: 'preparing' }));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-progress to 'ready' status
    const progressTimer = setTimeout(() => {
      if (currentOrder.status === 'placed') {
        dispatch(updateOrderStatus({ id: currentOrder.id, status: 'preparing' }));
      }
    }, 5000);

    const readyTimer = setTimeout(() => {
      if (currentOrder.status !== 'cancelled') {
        dispatch(updateOrderStatus({ id: currentOrder.id, status: 'ready' }));
      }
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(cancelTimer);
      clearTimeout(progressTimer);
      clearTimeout(readyTimer);
    };
  }, [currentOrder?.id, currentOrder?.status, dispatch]);

  if (!currentOrder || !isVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (currentOrder.status === 'ready') {
      dispatch(completeOrder());
    }
    setIsVisible(false);
  };

  const handleCancel = () => {
    if (currentOrder.canCancel && cancelTimeLeft && cancelTimeLeft > 0) {
      dispatch(cancelOrder(currentOrder.id));
    }
  };

  const getStatusInfo = () => {
    switch (currentOrder.status) {
      case 'placed':
        return { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', text: 'Order Placed' };
      case 'preparing':
        return { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10', text: 'Preparing', animate: true };
      case 'ready':
        return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', text: 'Ready for Pickup!' };
      case 'cancelled':
        return { icon: Ban, color: 'text-destructive', bg: 'bg-destructive/10', text: 'Cancelled' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', text: 'Processing' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className={`bg-card rounded-2xl shadow-elevated border border-border overflow-hidden ${
          currentOrder.status === 'ready' ? 'animate-pulse-glow' : ''
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${statusInfo.bg} flex items-center justify-center`}>
                <StatusIcon className={`w-6 h-6 ${statusInfo.color} ${statusInfo.animate ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold font-display ${
                    currentOrder.status === 'ready' ? 'text-success animate-token-blink' : 'text-foreground'
                  }`}>
                    #{currentOrder.token}
                  </span>
                  {currentOrder.status === 'ready' && (
                    <span className="px-2 py-0.5 rounded-full bg-success text-success-foreground text-xs font-medium">
                      READY!
                    </span>
                  )}
                </div>
                <p className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.text}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Order Items Summary */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{currentOrder.items.length} items</span>
              <span>•</span>
              <span>₹{currentOrder.totalAmount.toFixed(2)}</span>
              <span>•</span>
              <span>Pickup: {currentOrder.pickupTime}</span>
            </div>

            {/* Progress Bar */}
            {currentOrder.status !== 'cancelled' && currentOrder.status !== 'ready' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Estimated time</span>
                  <span className="font-medium text-primary">
                    {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-primary rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ 
                      width: currentOrder.status === 'placed' ? '30%' : 
                             currentOrder.status === 'preparing' ? '70%' : '100%' 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Cancel Button */}
            {currentOrder.canCancel && cancelTimeLeft && cancelTimeLeft > 0 && currentOrder.status !== 'cancelled' && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                <div className="text-sm">
                  <p className="font-medium text-destructive">Cancel available</p>
                  <p className="text-xs text-muted-foreground">for {formatTime(cancelTimeLeft)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Cancel Order
                </Button>
              </div>
            )}

            {/* Ready Message */}
            {currentOrder.status === 'ready' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 rounded-xl bg-success/10 border border-success/20 text-center"
              >
                <p className="font-semibold text-success">🎉 Your order is ready!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please collect from counter with token #{currentOrder.token}
                </p>
              </motion.div>
            )}

            {/* Cancelled Message */}
            {currentOrder.status === 'cancelled' && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                <p className="font-semibold text-destructive">Order Cancelled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your refund will be processed within 2-3 business days
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
