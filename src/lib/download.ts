// URL-ul Worker-ului Cloudflare (vezi cloudflare-worker/worker.js) care
// trimite poza/Excel-ul în chatul Telegram al utilizatorului. Completează-l
// cu URL-ul tău real după ce publici Worker-ul pe Cloudflare, altfel
// trimiterea în chat nu poate funcționa.
const TELEGRAM_WORKER_URL = 'https://hot-cobra-3037.turexgo.deno.net/';

// Detectează dacă suntem într-un Mini App Telegram real (deschis dintr-un bot
// printr-un buton web_app). telegram-web-app.js expune window.Telegram.WebApp.
export function isTelegramMiniApp(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp?.initData;
}

// Browserele "in-app" obișnuite (Telegram folosit ca simplu link, Instagram,
// Facebook, WhatsApp etc.) ignoră adesea descărcarea automată prin
// <a download>. Pentru acestea deschidem fișierul într-o filă nouă, de unde
// se salvează manual.
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Telegram|TelegramWebview|FBAN|FBAV|Instagram|Line\/|MicroMessenger|WhatsApp/i.test(ua);
}

// Trimite fișierul direct în chatul Telegram al utilizatorului curent, prin
// Worker-ul Cloudflare. Returnează true dacă a reușit.
async function sendToTelegramChat(
  blob: Blob,
  fileName: string,
  kind: 'photo' | 'document'
): Promise<boolean> {
  const tg = (window as any).Telegram?.WebApp;
  const initData: string | undefined = tg?.initData;
  if (!initData) return false;

  const form = new FormData();
  form.append('initData', initData);
  form.append('kind', kind);
  form.append('fileName', fileName);
  form.append('file', blob, fileName);

  try {
    const res = await fetch(TELEGRAM_WORKER_URL, { method: 'POST', body: form });
    const data = await res.json().catch(() => null);
    return !!data?.ok;
  } catch {
    return false;
  }
}

// Descărcare "clasică", pentru orice altceva decât Mini App Telegram.
function triggerBrowserDownload(blob: Blob, fileName: string) {
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

// Punctul unic folosit de restul site-ului pentru a "livra" un fișier
// generat (poză sau Excel) către utilizator: în Mini App Telegram îl trimite
// direct în chat; altfel, descarcă normal.
export async function deliverFile(
  blob: Blob,
  fileName: string,
  kind: 'photo' | 'document'
) {
  if (isTelegramMiniApp()) {
    const tg = (window as any).Telegram.WebApp;
    const sent = await sendToTelegramChat(blob, fileName, kind);

    if (sent) {
      const okMsg = 'Trimis! Verifică chatul cu botul.';
      if (typeof tg.showAlert === 'function') tg.showAlert(okMsg);
      else alert(okMsg);
      return;
    }

    // Trimiterea în chat a eșuat (Worker-ul nu e configurat încă, sau a
    // apărut o eroare) — încercăm varianta de rezervă: deschidem site-ul
    // într-un browser normal, unde se poate descărca manual.
    const failMsg =
      'Nu am putut trimite fișierul în chat. Se deschide într-un browser normal, de unde îl poți descărca manual.';
    const openExternally = () => {
      try {
        tg.openLink(window.location.href, { try_instant_view: false });
      } catch {
        window.open(window.location.href, '_blank');
      }
    };
    if (typeof tg.showAlert === 'function') tg.showAlert(failMsg, openExternally);
    else {
      alert(failMsg);
      openExternally();
    }
    return;
  }

  triggerBrowserDownload(blob, fileName);
}
