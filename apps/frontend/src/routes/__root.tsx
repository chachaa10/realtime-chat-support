import {
  createRootRoute,
  Outlet,
  redirect,
  useLocation,
} from '@tanstack/react-router';

import { Toaster } from 'sonner';

import { ErrorBoundary } from '../components/error-boundary';
import { RouteLoadingBar } from '../components/route-loading-bar';
import { useAuth } from '../features/auth/context';
import { useTheme } from '../features/theme/ThemeContext';
import { useNotificationSocket } from '../features/notifications/hooks/useNotificationSocket';
import { useTabTitle } from '../features/notifications/hooks/useTabTitle';

export const rootRoute = createRootRoute({
  beforeLoad: ({ location }) => {
    const user = localStorage.getItem('user');
    if (
      !user &&
      location.pathname !== '/' &&
      location.pathname !== '/login' &&
      location.pathname !== '/register'
    ) {
      throw redirect({ to: '/login' });
    }
  },
  component: RootLayout,
});

function AppShell() {
  useNotificationSocket();
  useTabTitle();

  return (
    <div className="flex h-dvh">
      <main className="bg-surface flex-1 overflow-hidden">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="bg-surface flex min-h-dvh items-center justify-center px-4">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

function RootLayout() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();

  return (
    <>
      <RouteLoadingBar />
      <Toaster richColors closeButton position="top-right" theme={isDark ? 'dark' : 'light'} />
      {!user
        ? location.pathname === '/'
          ? (
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            )
          : <AuthLayout />
        : <AppShell />}
    </>
  );
}
