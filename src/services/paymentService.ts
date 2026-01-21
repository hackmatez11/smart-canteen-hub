import api from '../lib/api';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentOrderData {
  order_id: string;
  amount: number;
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
}

class PaymentService {
  async createPaymentOrder(data: PaymentOrderData) {
    const response = await api.post('/payments/create-order', data);
    return response.data;
  }

  async verifyPayment(data: VerifyPaymentData) {
    const response = await api.post('/payments/verify', data);
    return response.data;
  }

  async getPaymentDetails(paymentId: string) {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  }

  // Initialize Razorpay checkout
  async initiatePayment(
    orderId: string,
    amount: number,
    userDetails: { name: string; email: string; phone?: string },
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ) {
    try {
      // Create Razorpay order
      const { razorpay_order, key_id } = await this.createPaymentOrder({
        order_id: orderId,
        amount
      });

      // Razorpay checkout options
      const options = {
        key: key_id,
        amount: razorpay_order.amount,
        currency: razorpay_order.currency,
        name: 'Smart College Canteen',
        description: `Order #${orderId}`,
        order_id: razorpay_order.id,
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.phone || ''
        },
        theme: {
          color: '#3b82f6'
        },
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verificationResult = await this.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId
            });
            onSuccess(verificationResult);
          } catch (error) {
            onError(error);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      onError(error);
    }
  }

  // Load Razorpay script
  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Admin: Process refund
  async processRefund(orderId: string, amount: number, reason: string) {
    const response = await api.post('/payments/refund', {
      order_id: orderId,
      amount,
      reason
    });
    return response.data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
