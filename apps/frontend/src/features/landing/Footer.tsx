import { ThemeToggle } from '@/design-system/ThemeToggle';

const linkGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help center', href: '/help' },
      { label: 'API docs', href: '/docs' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Cookies', href: '/cookies' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-border bg-surface-sunken border-t">
      <div className="mx-auto max-w-7xl px-5 py-16 md:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {linkGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <span className="text-ink-muted text-[0.75rem] font-semibold tracking-wide uppercase">
                {group.title}
              </span>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-ink-muted hover:text-ink text-[0.875rem] transition-colors duration-150"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border mt-16 flex items-center justify-between border-t pt-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand flex h-6 w-6 items-center justify-center rounded-md text-[0.625rem] leading-none font-bold text-white">
              CS
            </div>
            <span className="text-ink-muted text-[0.8125rem]">
              &copy; {new Date().getFullYear()} Chat Support. All rights reserved.
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
