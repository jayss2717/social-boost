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
      currentUrl: window.location.href,
      isIframe: window !== window.top,
      parentUrl: window.top?.location.href
    });

    // If we're in an iframe and payment was successful, redirect the iframe content
    if (window !== window.top && window.top !== null) {
      if (paymentSuccess === 'true' && shop) {
        console.log('✅ Payment success detected in iframe, redirecting iframe content...');
        // Redirect the iframe content to dashboard with payment_success
        const dashboardUrl = `/?shop=${shop}&payment_success=true`;
        console.log('🔄 Redirecting iframe to dashboard:', dashboardUrl);
        window.location.href = dashboardUrl;
        return;
      } else if (shop) {
        console.log('🔄 Redirecting iframe to dashboard normally...');
        const dashboardUrl = `/?shop=${shop}`;
        window.location.href = dashboardUrl;
        return;
      }
    }

    // If we're not in an iframe (direct access), redirect to dashboard
    if (shop) {
      console.log('🔄 Direct access, redirecting to dashboard...');
      const dashboardUrl = paymentSuccess === 'true' 
        ? `/?shop=${shop}&payment_success=true` 
        : `/?shop=${shop}`;
      window.location.href = dashboardUrl;
    }
  }, [searchParams]);

  return (
    <div className="p-6 text-center">
      <p>Redirecting to SocialBoost dashboard...</p>
    </div>
  );
} 