import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { AbstractMotif } from './abstract-motif';

export function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="bg-hero-bg relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden md:min-h-dvh">
      <div className="text-brand/10 pointer-events-none absolute inset-0 flex items-center justify-center md:hidden">
        <AbstractMotif />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.50_0.13_190_/_0.06),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top_right,oklch(0.50_0.13_190_/_0.10),transparent_60%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 md:py-0">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-7">
            <h1
              className="text-ink text-wrap-balance ease-out-quart text-[clamp(2.25rem,5vw,4rem)] leading-[1.1] font-semibold -tracking-[0.02em] transition-all duration-600"
              style={{
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                opacity: mounted ? 1 : 0.96,
              }}
            >
              Your customers need a <span className="text-brand">real person.</span>
            </h1>
            <p
              className="text-ink-muted ease-out-quart max-w-[52ch] text-[1.125rem] leading-relaxed transition-all duration-600"
              style={{
                transitionDelay: '150ms',
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                opacity: mounted ? 1 : 0.96,
              }}
            >
              Someone who sees the problem and fixes it. Right now.
            </p>
            <div
              className="ease-out-quart flex flex-wrap items-center gap-3 pt-1 transition-all duration-600"
              style={{
                transitionDelay: '300ms',
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                opacity: mounted ? 1 : 0.96,
              }}
            >
              <Link to="/register">
                <Button size="lg">Get started free</Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-ink border-border hover:bg-muted hover:border-border-strong"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div
              className="text-brand/15 dark:text-brand/25 ease-out-quart w-full max-w-[28rem] transition-all duration-700"
              style={{
                transitionDelay: '450ms',
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                opacity: mounted ? 1 : 0.9,
              }}
            >
              <AbstractMotif />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
