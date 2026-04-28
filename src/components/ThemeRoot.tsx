import { useEffect, useLayoutEffect } from 'react';
import { useThemeStore } from '@/stores/theme.store';

/** Syncs persisted theme and system preference to the document. */
export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  const syncFromPrefs = useThemeStore((s) => s.syncFromPrefs);

  useLayoutEffect(() => {
    syncFromPrefs();
    return useThemeStore.persist.onFinishHydration(() => {
      useThemeStore.getState().syncFromPrefs();
    });
  }, [syncFromPrefs]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (useThemeStore.getState().mode === 'system') {
        useThemeStore.getState().syncFromPrefs();
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return <>{children}</>;
}
