import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const createStripeConnectAccount = async (email: string) => {
  return stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      transfers: { requested: true },
    },
  });
};

export const createTransfer = async (amount: number, destinationAccountId: string) => {
  return stripe.transfers.create({
    amount,
    currency: 'usd',
    destination: destinationAccountId,
  });
}; 