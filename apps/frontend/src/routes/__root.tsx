import { createRootRoute, Link, Outlet, redirect } from '@tanstack/react-router';

import { useAuth } from '../features/auth/context';

export const rootRoute = createRootRoute({
  beforeLoad: ({ location }) => {
    const token = localStorage.getItem('token');
    if (
      !token &&
      location.pathname !== '/login' &&
      location.pathname !== '/register'
    ) {
      throw redirect({ to: '/login' });
    }
  },
  component: RootLayout,
});

function RootLayout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        {user ? (
          <button onClick={logout}>Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
      <Outlet />
    </div>
  );
}
