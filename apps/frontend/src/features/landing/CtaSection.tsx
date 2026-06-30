import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="bg-brand relative overflow-hidden py-24 md:py-32 dark:bg-[oklch(0.35_0.12_190)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,oklch(1_0_0_/_0.06),transparent_60%)]" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 text-center">
        <h2 className="text-wrap-balance text-[clamp(1.5rem,3vw,2.5rem)] font-semibold -tracking-[0.015em] text-white">
          Start supporting better
        </h2>
        <p className="max-w-[48ch] text-[1.125rem] leading-relaxed text-white/75">
          Set up in minutes. No credit card required. Just real-time conversations that actually
          solve problems.
        </p>
        <div className="pt-2">
          <Link to="/register">
            <Button
              size="lg"
              className="text-brand border-0 bg-white font-semibold shadow-none hover:bg-white/90"
            >
              Get started free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
