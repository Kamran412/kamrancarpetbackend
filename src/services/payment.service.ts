import Stripe from "stripe";
import Razorpay from "razorpay";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function createStripePaymentIntent(amount: number, currency: string, orderId: string) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe expects the smallest currency unit
    currency: currency.toLowerCase(),
    metadata: { orderId },
    automatic_payment_methods: { enabled: true },
  });
}

export async function createRazorpayOrder(amount: number, currency: string, orderId: string) {
  return razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: currency.toUpperCase(),
    receipt: orderId,
  });
}
