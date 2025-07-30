'use client';

import { Navigation } from '@shopify/polaris';
import { Home, Users, Hash, DollarSign, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function AppNavigation() {
  const pathname = usePathname();

  const navigationMarkup = (
    <Navigation location={pathname}>
      <Navigation.Section
        items={[
          {
            label: 'Dashboard',
            url: '/',
            icon: () => <Home size={20} />,
          },
          {
            label: 'Influencers',
            url: '/influencers',
            icon: () => <Users size={20} />,
          },
          {
            label: 'UGC Posts',
            url: '/ugc',
            icon: () => <Hash size={20} />,
          },
          {
            label: 'Payouts',
            url: '/payouts',
            icon: () => <DollarSign size={20} />,
          },
          {
            label: 'Settings',
            url: '/settings',
            icon: () => <Settings size={20} />,
          },
        ]}
      />
    </Navigation>
  );

  return navigationMarkup;
} 