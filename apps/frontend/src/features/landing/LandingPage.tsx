import { CtaSection } from './CtaSection';
import { DualAudience } from './DualAudience';
import { Features } from './Features';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { Nav } from './Nav';
import { TestimonialSection } from './TestimonialSection';

export function LandingPage() {
  return (
    <div className="bg-surface min-h-dvh">
      <a
        href="#main-content"
        className="bg-brand fixed -top-full left-4 z-[600] rounded-b-md px-4 py-2 text-[0.875rem] font-medium text-white shadow-sm transition-all duration-150 focus:top-0"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main-content">
        <Hero />
        <Features />
        <HowItWorks />
        <TestimonialSection />
        <DualAudience />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
