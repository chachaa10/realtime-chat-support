import { createRoute } from '@tanstack/react-router';

import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

function IndexPage() {
  return (
    <div>
      <h1>Chat Support</h1>
      <p>Welcome to the real-time chat support system.</p>
    </div>
  );
}
