import React from 'react';
import { render } from '@testing-library/react';
import Dashboard from '../app/page';

describe('Dashboard Component', () => {
  it('should render without React errors', () => {
    // Mock the hooks to prevent actual API calls
    jest.mock('../hooks/useMetrics', () => ({
      useMetrics: () => ({
        data: {
          totalUgcPosts: 0,
          totalInfluencers: 0,
          totalRevenue: 0,
          pendingPayouts: 0,
          approvedPosts: 0,
          pendingApproval: 0,
          averageEngagement: 0,
          topPosts: [],
        },
        isLoading: false,
        error: null,
      }),
    }));

    jest.mock('../hooks/useSubscription', () => ({
      useSubscription: () => ({
        data: {
          subscription: null,
          usage: {
            ugcCount: 0,
            influencerCount: 0,
            ugcLimit: 20,
            influencerLimit: 5,
          },
          plans: [],
        },
        isLoading: false,
        error: null,
      }),
    }));

    // This should not throw any React errors
    expect(() => {
      render(<Dashboard />);
    }).not.toThrow();
  });
}); 