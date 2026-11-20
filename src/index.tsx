export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const win = window as unknown as { __mustakshifSwRegistered?: boolean };
  if (win.__mustakshifSwRegistered) {
    return;
  }
  win.__mustakshifSwRegistered = true;

  const doRegister = () => {
    if (import.meta.env?.DEV) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        try {
          if (sessionStorage.getItem('mustakshif_sw_dev_reloaded') === '1') return;
          sessionStorage.setItem('mustakshif_sw_dev_reloaded', '1');
        } catch {
          // Ignore storage failure
        }
        refreshing = true;
        window.location.reload();
      });
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('service worker registered', registration.scope);
        registration.update().catch(() => {});
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err);
      });
  };

  if (document.readyState === 'complete') {
    doRegister();
  } else {
    window.addEventListener('load', doRegister, { once: true });
  }
}

registerServiceWorker();

export {};
