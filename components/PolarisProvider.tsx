'use client';

import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';

interface PolarisProviderProps {
  children: React.ReactNode;
}

export function PolarisProvider({ children }: PolarisProviderProps) {
  return (
    <AppProvider i18n={{
      Polaris: {
        Avatar: {
          label: 'Avatar',
          labelWithInitials: 'Avatar with initials {initials}',
        },
        ContextualSaveBar: {
          saveAction: 'Save',
          discardAction: 'Discard',
        },
        ResourceList: {
          sortingLabel: 'Sort by {sortKey}',
          defaultItemSingular: 'item',
          defaultItemPlural: 'items',
          showing: 'Showing {itemsCount} {resource}',
          Item: {
            viewItem: 'View details for {itemName}',
          },
        },
        ResourceItem: {
          viewItem: 'View details for {itemName}',
        },
        OptionList: {
          label: 'Options',
        },
        TopBar: {
          toggleMenuLabel: 'Toggle menu',
          SearchField: {
            clearButtonLabel: 'Clear',
            search: 'Search',
          },
        },
        Modal: {
          iFrameTitle: 'body markup',
        },
        Frame: {
          skipToContent: 'Skip to content',
          navigationLabel: 'Navigation',
          Navigation: {
            closeMobileNavigationLabel: 'Close navigation',
          },
        },
      },
    }}>
      {children}
    </AppProvider>
  );
} 