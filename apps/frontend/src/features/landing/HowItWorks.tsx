import { useInView } from './use-in-view';

const steps = [
  {
    title: 'Submit a ticket',
    description:
      'Customer describes the issue in a few sentences. It enters the queue with status, priority, and context visible to the team.',
  },
  {
    title: 'Chat in real-time',
    description:
      'An agent picks it up. Conversation flows live — typing indicators, instant delivery, no delays.',
  },
  {
    title: 'Resolve and close',
    description:
      'Problem solved, ticket resolved. Everyone moves on with a clear record of what happened.',
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="how-it-works" className="bg-surface-sunken py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-5">
        <div className="mb-16 flex flex-col items-center text-center md:mb-20">
          <h2 className="text-ink text-wrap-balance text-[clamp(1.5rem,3vw,2.25rem)] font-semibold -tracking-[0.015em]">
            From ticket to resolution in minutes
          </h2>
          <p className="text-ink-muted mt-4 max-w-[56ch] text-[1rem] leading-relaxed">
            Three steps. No friction. Just real people helping real people.
          </p>
        </div>

        <div ref={ref} className="relative">
          <div
            className="bg-border absolute top-3 bottom-3 left-[1.625rem] hidden w-px md:block"
            aria-hidden="true"
          />

          <ol className="flex flex-col gap-12 md:gap-16">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={`ease-out-quart relative flex items-start gap-6 transition-all duration-500 ${
                  inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="relative flex shrink-0 flex-col items-center">
                  <span className="bg-brand relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-[1rem] leading-none font-bold text-white md:h-[3.25rem] md:w-[3.25rem] md:text-[1.125rem]">
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <div
                      className="bg-border absolute top-full hidden h-8 w-px md:block"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="pt-1.5 md:pt-3">
                  <h3 className="text-ink text-[1.125rem] font-semibold">{step.title}</h3>
                  <p className="text-ink-muted mt-2 max-w-[52ch] text-[0.9375rem] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
