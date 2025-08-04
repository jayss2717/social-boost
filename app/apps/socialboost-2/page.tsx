'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SocialBoostAppPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const shop = searchParams.get('shop');
    const paymentSuccess = searchParams.get('payment_success');

    console.log('🔍 SocialBoost app page loaded with:', {
      shop,
      paymentSuccess,
      currentUrl: window.location.href
    });

    // If payment was successful, redirect to dashboard
    if (paymentSuccess === 'true' && shop) {
      console.log('✅ Payment success detected in app, redirecting to dashboard...');
      const dashboardUrl = `/?shop=${shop}&payment_success=true`;
      console.log('🔄 Redirecting to dashboard:', dashboardUrl);
      window.location.href = dashboardUrl;
      return;
    }

    // Otherwise, redirect to dashboard normally
    if (shop) {
      console.log('🔄 Redirecting to dashboard normally...');
      const dashboardUrl = `/?shop=${shop}`;
      window.location.href = dashboardUrl;
    }
  }, [searchParams]);

  return (
    <div className="p-6 text-center">
      <p>Redirecting to SocialBoost dashboard...</p>
    </div>
  );
} 