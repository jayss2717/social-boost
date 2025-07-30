import './globals.css';
import { Inter } from 'next/font/google';
import { PolarisProvider } from '@/components/PolarisProvider';
import { AppFrame } from '@/components/AppFrame';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SocialBoost - Influencer Marketing & UGC Management',
  description: 'Manage influencer partnerships, UGC content, and commission payouts for your Shopify store',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PolarisProvider>
          <AppFrame>
            <SubscriptionBanner />
            {children}
          </AppFrame>
        </PolarisProvider>
      </body>
    </html>
  );
} 