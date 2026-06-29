import { createRoute, redirect } from '@tanstack/react-router';

import { useAuth } from '../features/auth/context';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user.role === 'agent') {
        throw redirect({ to: '/tickets' });
      }
      throw redirect({ to: '/tickets' });
    }
  },
  component: IndexPage,
});

function IndexPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div>
        <h1>Chat Support</h1>
        <p>Welcome to the real-time chat support system.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Chat Support</h1>
      <p>Welcome, {user.name}.</p>
    </div>
  );
}
