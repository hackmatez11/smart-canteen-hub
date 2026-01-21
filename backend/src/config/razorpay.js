import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  console.warn('Warning: Razorpay credentials not found. Payment features will not work.');
}

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: razorpayKeyId || 'rzp_test_dummy',
  key_secret: razorpayKeySecret || 'dummy_secret'
});

export default razorpay;
