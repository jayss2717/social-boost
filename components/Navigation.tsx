'use client';

import { Navigation } from '@shopify/polaris';
import { Home, Users, Hash, DollarSign, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React from 'react';

export function AppNavigation() {
  const pathname = usePathname();

  const navigationMarkup = (
    <Navigation location={pathname}>
      <Navigation.Section
        items={[
          {
            label: 'Dashboard',
            url: '/',
            icon: () => React.createElement(Home, { size: 20 }),
          },
          {
            label: 'Influencers',
            url: '/influencers',
            icon: () => React.createElement(Users, { size: 20 }),
          },
          {
            label: 'UGC Posts',
            url: '/ugc',
            icon: () => React.createElement(Hash, { size: 20 }),
          },
          {
            label: 'Payouts',
            url: '/payouts',
            icon: () => React.createElement(DollarSign, { size: 20 }),
          },
          {
            label: 'Settings',
            url: '/settings',
            icon: () => React.createElement(Settings, { size: 20 }),
          },
        ]}
      />
    </Navigation>
  );

  return navigationMarkup;
} 