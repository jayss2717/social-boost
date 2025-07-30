import { Queue, Worker } from 'bullmq';
import redis from './redis';
import { processBulkPayouts } from '@/utils/payouts';

// Payout processing queue
export const payoutQueue = new Queue('payouts', {
  connection: redis,
});

// Worker for processing payouts
export const payoutWorker = new Worker(
  'payouts',
  async (job: any) => {
    const { merchantId } = job.data;
    return await processBulkPayouts(merchantId);
  },
  {
    connection: redis,
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 5 },
  }
);

// Schedule weekly payout processing
export const schedulePayouts = async (merchantId: string) => {
  await payoutQueue.add(
    'process-payouts',
    { merchantId },
    {
      repeat: {
        pattern: '0 2 * * 5', // Every Friday at 2 AM
      },
    }
  );
};

// Error handling
payoutWorker.on('failed', (job: any, err: any) => {
  console.error(`Job ${job?.id} failed:`, err);
});

payoutWorker.on('completed', (job: any) => {
  console.log(`Job ${job.id} completed successfully`);
}); 