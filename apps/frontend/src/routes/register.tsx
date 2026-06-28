import { createRoute } from '@tanstack/react-router';

import { RegisterForm } from '../features/auth/components/RegisterForm';
import { rootRoute } from './__root';

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div>
      <h1>Register</h1>
      <RegisterForm />
    </div>
  );
}
