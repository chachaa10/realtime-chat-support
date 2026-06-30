import { MessageSquare, List, CheckCircle, Monitor } from 'lucide-react';

import { useInView } from './use-in-view';

const features = [
  {
    title: 'Live conversations',
    description:
      "Real-time chat with typing indicators, read receipts, and instant delivery. No polling, no refresh — messages arrive as they're sent.",
    icon: MessageSquare,
  },
  {
    title: 'Smart queue',
    description:
      'Agents see priority, context, and history before they pick up a ticket. No more "what\'s this about?" — every conversation starts informed.',
    icon: List,
  },
  {
    title: 'Status at a glance',
    description:
      'Open, in-progress, resolved — every ticket wears its state visibly. Color-coded, text-labeled, unmistakable. No hunting for context.',
    icon: CheckCircle,
  },
  {
    title: 'Dual view',
    description:
      'Customers see their conversation thread. Agents see a multi-chat dashboard. One ticket, two perspectives, zero confusion.',
    icon: Monitor,
  },
];

export function Features() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="features" className="bg-surface-sunken py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-16 flex flex-col items-center text-center md:mb-20">
          <h2 className="text-ink text-wrap-balance text-[clamp(1.5rem,3vw,2.25rem)] font-semibold -tracking-[0.015em]">
            Built for real conversations
          </h2>
          <p className="text-ink-muted mt-4 max-w-[56ch] text-[1rem] leading-relaxed">
            Everything your team needs to handle support without the noise.
          </p>
        </div>

        <div ref={ref} className="grid gap-6 md:grid-cols-2 md:gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`bg-surface-raised border-border ease-out-quart flex items-start gap-5 rounded-xl border p-6 transition-all duration-500 md:p-8 ${
                  inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="bg-brand/10 text-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                  <Icon size={22} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-ink text-[1.125rem] font-semibold">{feature.title}</h3>
                  <p className="text-ink-muted text-[0.9375rem] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
