// ============================================================
// pwa.js — Attendo PWA layer v2.2
// Handles: SW registration, install prompt, update banner
// ============================================================
(function () {

  // ── 1. Service Worker ────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js', { scope: './' })
        .then(reg => {
          // New SW found while app is open → show update banner
          reg.addEventListener('updatefound', () => {
            const sw = reg.installing;
            if (!sw) return;
            sw.addEventListener('statechange', () => {
              if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateBanner(reg);
              }
            });
          });
        })
        .catch(err => console.warn('[PWA] SW failed:', err));

      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data && e.data.type === 'SW_UPDATED') showUpdateBanner(null);
      });
    });
  }

  // ── 2. Install prompt ────────────────────────────────────────
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // Small delay so the page finishes loading first
    setTimeout(showInstallBanner, 3500);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideBanner('pwa-install-banner');
  });

  // ── 3. Show/hide helpers ─────────────────────────────────────
  function showInstallBanner() {
    if (isStandalone()) return;
    if (sessionStorage.getItem('pwa-dismissed')) return;
    if (document.getElementById('pwa-install-banner')) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    createBanner('pwa-install-banner',
      isIOS
        ? iosHTML()
        : androidHTML()
    );

    const install = document.querySelector('#pwa-install-banner .pwa-install-btn');
    if (install) {
      install.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        hideBanner('pwa-install-banner');
      });
    }

    document.querySelector('#pwa-install-banner .pwa-dismiss-btn')
      .addEventListener('click', () => {
        sessionStorage.setItem('pwa-dismissed', '1');
        hideBanner('pwa-install-banner');
      });
  }

  function showUpdateBanner(reg) {
    if (document.getElementById('pwa-update-banner')) return;

    createBanner('pwa-update-banner',
      '<div class="pwa-icon"><i class="fas fa-rotate"></i></div>' +
      '<div class="pwa-text"><strong>Update ready</strong>' +
      '<span>Reload to get the latest version</span></div>' +
      '<button class="pwa-reload-btn pwa-cta">Reload</button>' +
      '<button class="pwa-dismiss-btn" aria-label="Dismiss"><i class="fas fa-times"></i></button>'
    );

    document.querySelector('#pwa-update-banner .pwa-reload-btn')
      .addEventListener('click', () => {
        if (reg && reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        window.location.reload();
      });

    document.querySelector('#pwa-update-banner .pwa-dismiss-btn')
      .addEventListener('click', () => hideBanner('pwa-update-banner'));
  }

  function createBanner(id, html) {
    injectStyles();
    const el = document.createElement('div');
    el.id = id;
    el.className = 'pwa-banner';
    el.innerHTML = html;
    document.body.appendChild(el);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => el.classList.add('pwa-banner-in'))
    );
  }

  function hideBanner(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('pwa-banner-in');
    setTimeout(() => el.remove(), 340);
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // ── HTML templates ───────────────────────────────────────────
  function androidHTML() {
    return (
      '<div class="pwa-icon"><i class="fas fa-graduation-cap"></i></div>' +
      '<div class="pwa-text"><strong>Install Attendo</strong>' +
      '<span>Add to your home screen — works offline too</span></div>' +
      '<button class="pwa-install-btn pwa-cta">Install</button>' +
      '<button class="pwa-dismiss-btn" aria-label="Dismiss"><i class="fas fa-times"></i></button>'
    );
  }

  function iosHTML() {
    return (
      '<div class="pwa-icon"><i class="fas fa-graduation-cap"></i></div>' +
      '<div class="pwa-text"><strong>Add to Home Screen</strong>' +
      '<span>Tap <i class="fas fa-arrow-up-from-bracket"></i> then "Add to Home Screen"</span></div>' +
      '<button class="pwa-dismiss-btn" aria-label="Dismiss"><i class="fas fa-times"></i></button>'
    );
  }

  // ── Styles (injected once) ───────────────────────────────────
  function injectStyles() {
    if (document.getElementById('pwa-styles')) return;
    const s = document.createElement('style');
    s.id = 'pwa-styles';
    s.textContent = `
      .pwa-banner {
        position: fixed;
        bottom: 76px;
        left: 50%;
        transform: translateX(-50%) translateY(18px);
        opacity: 0;
        width: min(430px, calc(100vw - 22px));
        background: #1e293b;
        color: #fff;
        border-radius: 14px;
        padding: 11px 13px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 8px 30px rgba(15,23,42,0.3), 0 2px 8px rgba(15,23,42,0.18);
        z-index: 310;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        font-size: 0.84rem;
        border: 1px solid rgba(255,255,255,0.08);
        transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1);
      }
      .pwa-banner.pwa-banner-in {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      .pwa-icon {
        width: 36px; height: 36px; flex-shrink: 0;
        background: rgba(79,70,229,0.22);
        border-radius: 9px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem; color: #a5b4fc;
      }
      .pwa-text {
        flex: 1; min-width: 0;
        display: flex; flex-direction: column; gap: 1px;
      }
      .pwa-text strong {
        font-weight: 700; font-size: 0.87rem; color: #fff; display: block;
      }
      .pwa-text span {
        font-size: 0.75rem; color: rgba(255,255,255,0.5);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .pwa-text i { font-size: 0.7rem; color: rgba(255,255,255,0.65); }
      .pwa-cta {
        background: #4f46e5; color: #fff; border: none;
        border-radius: 8px; padding: 7px 14px;
        font-size: 0.8rem; font-weight: 700; cursor: pointer;
        font-family: inherit; white-space: nowrap; flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(79,70,229,0.38);
        transition: background 0.15s, transform 0.15s;
      }
      .pwa-cta:hover { background: #3730a3; transform: scale(1.03); }
      .pwa-dismiss-btn {
        width: 28px; height: 28px; flex-shrink: 0;
        background: rgba(255,255,255,0.07); border: none;
        border-radius: 7px; color: rgba(255,255,255,0.4);
        font-size: 0.73rem; cursor: pointer; font-family: inherit;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.15s, color 0.15s;
      }
      .pwa-dismiss-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
      @media (max-width: 360px) { .pwa-text span { display: none; } }
    `;
    document.head.appendChild(s);
  }

})();
