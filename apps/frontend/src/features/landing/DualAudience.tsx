import { Link } from '@tanstack/react-router';
import { Users, MessageSquare, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useInView } from './use-in-view';

export function DualAudience() {
  const { ref, inView } = useInView(0.1);

  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-16 flex flex-col items-center text-center">
          <h2 className="text-ink text-wrap-balance text-[clamp(1.5rem,3vw,2.25rem)] font-semibold -tracking-[0.015em]">
            One platform, two perspectives
          </h2>
          <p className="text-ink-muted mt-4 max-w-[56ch] text-[1rem] leading-relaxed">
            Built for the teams who answer and the customers who need them.
          </p>
        </div>

        <div
          ref={ref}
          className={`ease-out-quart grid gap-6 transition-all duration-500 md:grid-cols-2 ${
            inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="border-brand/20 bg-brand/[0.03] flex flex-col gap-5 rounded-xl border p-8 md:p-10">
            <div className="bg-brand/10 text-brand flex h-11 w-11 items-center justify-center rounded-xl">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-ink text-[1.125rem] font-semibold">For support teams</h3>
              <p className="text-ink-muted mt-3 text-[0.9375rem] leading-relaxed">
                Manage a queue of tickets across multiple active conversations. Status tracking,
                assignment, and resolution — all in one place.
              </p>
            </div>
            <ul className="text-ink-muted flex flex-col gap-2.5 text-[0.9375rem]">
              {[
                'Multi-conversation dashboard',
                'Status-driven ticket queue',
                'Conversation history per ticket',
                'Real-time typing indicators',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check size={16} className="text-brand shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              <Link to="/register">
                <Button className="w-full sm:w-auto">Get started free</Button>
              </Link>
            </div>
          </div>

          <div className="border-border bg-surface-raised flex flex-col gap-5 rounded-xl border p-8 md:p-10">
            <div className="bg-surface-sunken text-ink-muted flex h-11 w-11 items-center justify-center rounded-xl">
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 className="text-ink text-[1.125rem] font-semibold">For customers</h3>
              <p className="text-ink-muted mt-3 text-[0.9375rem] leading-relaxed">
                Submit a ticket and get live help from a real person. No wait times, no email
                chains, no automated loops.
              </p>
            </div>
            <ul className="text-ink-muted flex flex-col gap-2.5 text-[0.9375rem]">
              {[
                'Simple ticket submission',
                'Live chat with your agent',
                'Real-time status updates',
                'Clear resolution records',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check size={16} className="text-ink-dim shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full sm:w-auto">
                  Sign in to submit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
