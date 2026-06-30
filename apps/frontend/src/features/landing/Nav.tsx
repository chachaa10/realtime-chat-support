import { Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/design-system/ThemeToggle';

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-surface/95 border-border-strong fixed inset-x-0 top-0 z-[200] border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <a href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="bg-brand flex h-7 w-7 items-center justify-center rounded-md text-[0.75rem] leading-none font-bold text-white">
            CS
          </div>
          <span className="text-ink text-[0.9375rem] font-semibold">Chat Support</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            hash="features"
            className="text-ink-muted hover:text-ink rounded-lg px-3 py-2 text-[0.875rem] transition-colors duration-150"
          >
            Features
          </Link>
          <Link
            to="/"
            hash="how-it-works"
            className="text-ink-muted hover:text-ink rounded-lg px-3 py-2 text-[0.875rem] transition-colors duration-150"
          >
            How it works
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-ink-muted hover:text-ink hover:bg-surface flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-border bg-surface flex flex-col gap-3 border-t px-5 py-4 md:hidden">
          <div className="flex items-center justify-end">
            <ThemeToggle />
          </div>
          <Link
            to="/"
            hash="features"
            onClick={() => setMobileOpen(false)}
            className="text-ink-muted hover:text-ink py-2 text-[0.9375rem] transition-colors"
          >
            Features
          </Link>
          <Link
            to="/"
            hash="how-it-works"
            onClick={() => setMobileOpen(false)}
            className="text-ink-muted hover:text-ink py-2 text-[0.9375rem] transition-colors"
          >
            How it works
          </Link>
          <div className="border-border flex flex-col gap-2 border-t pt-2">
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full">
                Sign in
              </Button>
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Get started</Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
