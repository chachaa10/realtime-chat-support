const testimonials = [
  {
    quote:
      "We used to lose track of tickets in a shared inbox. Now every conversation has a clear status, a dedicated thread, and a record when it's done. Our response time dropped by half in the first week.",
    name: 'Marcus Webb',
    role: 'Support Lead',
    company: 'Cascade',
  },
  {
    quote:
      'Our customers notice the difference. They actually get to talk to someone who understands their issue instead of repeating themselves to a bot. That alone was worth switching.',
    name: 'Priya Nair',
    role: 'Customer Success',
    company: 'Riviera',
  },
];

export function TestimonialSection() {
  return (
    <section className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-16 flex flex-col items-center text-center">
          <h2 className="text-ink text-wrap-balance text-[clamp(1.5rem,3vw,2.25rem)] font-semibold -tracking-[0.015em]">
            Trusted by support teams
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="border-border bg-surface-raised flex flex-col gap-5 rounded-xl border p-8 md:p-10"
            >
              <blockquote className="text-ink-muted text-[0.9375rem] leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="border-border flex items-center gap-3 border-t pt-2">
                <div className="bg-brand/10 text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.8125rem] font-semibold">
                  {t.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <span className="text-ink block text-[0.875rem] leading-tight font-medium">
                    {t.name}
                  </span>
                  <span className="text-ink-muted block text-[0.8125rem] leading-tight">
                    {t.role}, {t.company}
                  </span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
