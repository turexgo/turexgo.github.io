// Browserele "in-app" (Telegram, Instagram, Facebook, WhatsApp etc.) ignoră
// adesea descărcarea automată prin <a download>. Pentru acestea deschidem
// fișierul într-o filă nouă, de unde se salvează manual.
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /Telegram|TelegramWebview|FBAN|FBAV|Instagram|Line\/|MicroMessenger|WhatsApp/i.test(ua) ||
    !!(window as any).TelegramWebviewProxy ||
    !!(window as any).Telegram?.WebApp
  );
}

export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);

  if (isInAppBrowser()) {
    window.open(url, '_blank');
  } else {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
