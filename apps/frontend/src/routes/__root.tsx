import { createRootRoute, Outlet, Link } from '@tanstack/react-router';

import { useAuth } from '../features/auth/context';

export const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { user } = useAuth();

  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        {user ? (
          <>
            <button onClick={() => {}}>Logout</button>
          </>
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
