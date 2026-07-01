import { useState, useEffect } from 'react';

export function useBreakpoint(breakpoint: number = 768): boolean {
  const [matches, setMatches] = useState(() => window.innerWidth >= breakpoint);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [breakpoint]);

  return matches;
}
