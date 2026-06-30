import { Link, createRoute } from '@tanstack/react-router';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { RegisterForm } from '../features/auth/components/RegisterForm';
import { Nav } from '../features/landing/Nav';
import { rootRoute } from './__root';

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="bg-surface min-h-dvh w-full pt-16">
      <Nav />
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md [--card-spacing:--spacing(7)]">
          <CardHeader className="text-center">
            <div className="bg-primary text-primary-foreground mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-lg text-[0.875rem] font-bold">
              CS
            </div>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Set up your account in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
          <CardFooter className="justify-center gap-1 border-t-0">
            <span className="text-muted-foreground text-[0.8125rem]">Already have an account?</span>
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 text-[0.8125rem] font-medium transition-colors"
            >
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
