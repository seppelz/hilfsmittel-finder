import { useEffect, useState } from 'react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installation accepted');
    }

    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-xl rounded-3xl border-2 border-primary bg-white p-6 shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-text">App installieren</h3>
          <p className="mt-2 text-sm text-gray-600">
            Installieren Sie den Aboelo Hilfsmittel-Finder für schnellen Zugriff und Offline-Nutzung.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Installieren
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Später
          </button>
        </div>
      </div>
    </div>
  );
}
