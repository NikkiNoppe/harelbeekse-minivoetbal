import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Lazy import met automatische pagina-reload bij gefaalde dynamic import (Vite HMR).
 */
export function lazyImport<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((error: unknown) => {
      console.warn('[lazyImport] Module laden mislukt, pagina wordt vernieuwd…', error);
      window.location.reload();
      return new Promise(() => undefined as unknown as { default: T });
    }),
  );
}
