import { PASSWORD_RULES } from '@repo/shared';

interface PasswordRequirementsProps {
  value: string;
}

const iconCheck = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const iconEmpty = (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="shrink-0 opacity-40"
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export function PasswordRequirements({ value }: PasswordRequirementsProps) {
  const touched = value.length > 0;

  return (
    <ul className="mt-0.5 flex flex-col gap-1">
      {PASSWORD_RULES.map((rule) => {
        const valid = touched && rule.test(value);
        const inactive = !touched;

        let className = 'text-muted-foreground';
        if (valid) className = 'text-success';
        else if (!inactive) className = 'text-destructive';

        return (
          <li
            key={rule.key}
            className={`flex items-center gap-2 text-[0.75rem] leading-tight transition-colors duration-150 ${className}`}
          >
            {valid ? iconCheck : iconEmpty}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
