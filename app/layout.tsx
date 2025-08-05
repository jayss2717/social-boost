import './globals.css';
import { Inter } from 'next/font/google';
import { PolarisProvider } from '@/components/PolarisProvider';
import { AppFrame } from '@/components/AppFrame';
import { SubscriptionBanner } from '@/components/SubscriptionBanner';
import { ShopifyProvider } from '@/components/ShopifyProvider';
import { MerchantInitializer } from '@/components/MerchantInitializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SocialBoost - Influencer Marketing & UGC Management',
  description: 'Manage influencer partnerships, UGC content, and commission payouts for your Shopify store',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ShopifyProvider>
          <PolarisProvider>
            <MerchantInitializer>
              <AppFrame>
                <SubscriptionBanner />
                {children}
              </AppFrame>
            </MerchantInitializer>
          </PolarisProvider>
        </ShopifyProvider>
      </body>
    </html>
  );
} 