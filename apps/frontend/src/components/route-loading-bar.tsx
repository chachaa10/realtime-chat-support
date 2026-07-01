import { useRouter } from '@tanstack/react-router';
import { useEffect, useState, useCallback } from 'react';

export function RouteLoadingBar() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleStart = useCallback(() => {
    setProgress(30);
    setVisible(true);
  }, []);

  const handleComplete = useCallback(() => {
    setProgress(100);
  }, []);

  useEffect(() => {
    return router.subscribe('onBeforeLoad', () => {
      handleStart();
    });
  }, [router, handleStart]);

  useEffect(() => {
    return router.subscribe('onLoad', () => {
      handleComplete();
    });
  }, [router, handleComplete]);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="bg-brand fixed top-0 left-0 z-[9999] h-[2px] transition-all duration-[400ms] ease-out"
      style={{
        width: `${progress}%`,
        opacity: visible ? 1 : 0,
        boxShadow: '0 0 8px var(--color-brand)',
      }}
    >
      <div className="animate-loading-bar-shimmer absolute inset-0" />
    </div>
  );
}
