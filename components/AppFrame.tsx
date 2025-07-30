'use client';

import { Frame } from '@shopify/polaris';
import { AppNavigation } from './Navigation';

interface AppFrameProps {
  children: React.ReactNode;
}

export function AppFrame({ children }: AppFrameProps) {
  return (
    <Frame navigation={<AppNavigation />}>
      {children}
    </Frame>
  );
} 