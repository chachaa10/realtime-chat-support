import { Link, createRoute, redirect } from '@tanstack/react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { LoginForm } from '../features/auth/components/LoginForm';
import { Nav } from '../features/landing/Nav';
import { rootRoute } from './__root';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    if (localStorage.getItem('user')) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="bg-surface min-h-dvh w-full pt-16">
      <Nav />
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md [--card-spacing:--spacing(7)]">
          <CardHeader className="text-center">
            <div className="bg-primary text-primary-foreground mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-lg text-[0.875rem] font-bold">
              CS
            </div>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="justify-center gap-1 border-t-0">
            <span className="text-muted-foreground text-[0.8125rem]">
              Don&apos;t have an account?
            </span>
            <Link
              to="/register"
              className="text-primary hover:text-primary/80 text-[0.8125rem] font-medium transition-colors"
            >
              Create one
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
