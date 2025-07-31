import Stripe from 'stripe';

// Validate Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not configured - Stripe features will be disabled');
}

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

export const createStripeConnectAccount = async (email: string) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  return stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      transfers: { requested: true },
    },
  });
};

export const createTransfer = async (amount: number, destinationAccountId: string) => {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  
  return stripe.transfers.create({
    amount,
    currency: 'usd',
    destination: destinationAccountId,
  });
}; 