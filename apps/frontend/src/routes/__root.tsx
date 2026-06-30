import {
  createRootRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';

import { ThemeToggle } from '@/design-system/ThemeToggle';

import { useAuth } from '../features/auth/context';

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

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="border-border bg-surface-sunken flex h-dvh w-56 shrink-0 flex-col border-r">
      <div className="border-border flex h-14 items-center gap-2.5 border-b px-5">
        <div className="bg-brand flex h-7 w-7 items-center justify-center rounded-lg text-[0.75rem] leading-none font-bold text-white">
          CS
        </div>
        <span className="text-ink text-[0.9375rem] font-semibold">Chat Support</span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        <Link
          to="/tickets"
          activeProps={{ className: 'bg-brand/10 text-brand font-medium' }}
          className="text-ink-muted hover:text-ink hover:bg-surface flex h-9 items-center gap-3 rounded-lg px-3 text-[0.875rem] transition-colors duration-150"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          Tickets
        </Link>
      </nav>

      <div className="border-border flex items-center justify-between border-t px-3 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-brand/20 text-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-ink truncate text-[0.8125rem] font-medium">{user?.name}</p>
            <p className="text-ink-dim text-[0.6875rem] capitalize">{user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => {
              logout();
              navigate({ to: '/login' });
            }}
            className="text-ink-muted hover:text-danger hover:bg-danger/10 flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150"
            aria-label="Logout"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function AppShell() {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <main className="bg-surface flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

function AuthLayout() {
  return (
    <div className="bg-surface flex min-h-dvh items-center justify-center px-4">
      <Outlet />
    </div>
  );
}

function RootLayout() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return location.pathname === '/' ? <Outlet /> : <AuthLayout />;
  }

  return <AppShell />;
}
