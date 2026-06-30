import { createRoute, redirect } from '@tanstack/react-router';

import { LandingPage } from '@/features/landing';

import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      throw redirect({ to: '/tickets' });
    }
  },
  component: LandingPage,
});
