import { createRouter } from '@tanstack/react-router';

import { rootRoute } from './__root';
import { indexRoute } from './index';
import { loginRoute } from './login';
import { registerRoute } from './register';

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, registerRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
