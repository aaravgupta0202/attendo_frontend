// ─────────────────────────────────────────────────────────────
// pwa.js  ·  Attendo PWA layer
// Responsibilities:
//   1. Register the service worker
//   2. Capture the install prompt and show a tasteful banner
//   3. Detect when a new SW is waiting and offer a reload
// ─────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // ── 1. Service Worker registration ───────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./service-worker.js', { scope: './' })
        .then(reg => {
          // While the page is open, watch for a new SW being installed
          reg.addEventListener('updatefound', () => {
            const incoming = reg.installing;
            if (!incoming) return;
            incoming.addEventListener('statechange', () => {
              if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateBanner(reg);
              }
            });
          });
        })
        .catch(err => console.warn('[PWA] SW registration failed:', err));

      // SW posts SW_UPDATED after it activates
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data && e.data.type === 'SW_UPDATED') showUpdateBanner(null);
      });

      // Reload the page when a new SW takes control
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloading) { reloading = true; window.location.reload(); }
      });
    });
  }

  // ── 2. Install prompt ─────────────────────────────────────────
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();           // suppress the browser's own mini-bar
    deferredPrompt = e;
    // Wait a few seconds after page load before nudging the user
    setTimeout(maybeShowInstall, 4000);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideBanner('pwa-install');
    console.log('[PWA] App installed successfully');
  });

  function maybeShowInstall() {
    if (isRunningStandalone()) return;            // already installed
    if (sessionStorage.getItem('pwa-nodisplay')) return; // user said no this session

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      // iOS can't use beforeinstallprompt — show a "how to install" tip instead
      if (localStorage.getItem('pwa-ios-shown')) return; // shown before, don't repeat
      showBanner('pwa-install', buildIOSHTML());
      localStorage.setItem('pwa-ios-shown', '1');
    } else if (deferredPrompt) {
      showBanner('pwa-install', buildInstallHTML());
    }
  }

  // Called by the Install button inside the banner
  window._pwaDoInstall = async function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    hideBanner('pwa-install');
    console.log('[PWA] Install outcome:', outcome);
  };

  // Called by any dismiss button
  window._pwaDismiss = function (id) {
    sessionStorage.setItem('pwa-nodisplay', '1');
    hideBanner(id);
  };

  // ── 3. Update banner ──────────────────────────────────────────
  function showUpdateBanner(reg) {
    if (document.getElementById('pwa-update')) return;
    showBanner('pwa-update',
      '<div class="pwa-icon pwa-icon-update"><i class="fas fa-rotate"></i></div>' +
      '<div class="pwa-copy">' +
        '<strong>Update available</strong>' +
        '<span>A new version of Attendo is ready</span>' +
      '</div>' +
      '<button class="pwa-cta" onclick="(function(){' +
        'var r=window._pwaReg;' +
        'if(r&&r.waiting)r.waiting.postMessage(\'SKIP_WAITING\');' +
        'else location.reload();' +
      '})()">Reload</button>' +
      '<button class="pwa-close" onclick="document.getElementById(\'pwa-update\').remove()" aria-label="Dismiss">' +
        '<i class="fas fa-times"></i>' +
      '</button>'
    );
    window._pwaReg = reg;
  }

  // ── Banner helpers ─────────────────────────────────────────────
  function showBanner(id, html) {
    if (document.getElementById(id)) return;
    injectCSS();
    const el = document.createElement('div');
    el.id = id;
    el.className = 'pwa-banner';
    el.innerHTML = html;
    document.body.appendChild(el);
    // Double rAF ensures transition fires
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('pwa-in')));
  }

  function hideBanner(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('pwa-in');
    setTimeout(() => el.remove(), 360);
  }

  function isRunningStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
  }

  // ── HTML builders ──────────────────────────────────────────────
  function buildInstallHTML() {
    return (
      '<div class="pwa-icon"><i class="fas fa-graduation-cap"></i></div>' +
      '<div class="pwa-copy">' +
        '<strong>Install Attendo</strong>' +
        '<span>Works offline · Home screen icon · No app store needed</span>' +
      '</div>' +
      '<button class="pwa-cta" onclick="_pwaDoInstall()">Install</button>' +
      '<button class="pwa-close" onclick="_pwaDismiss(\'pwa-install\')" aria-label="Dismiss">' +
        '<i class="fas fa-times"></i>' +
      '</button>'
    );
  }

  function buildIOSHTML() {
    return (
      '<div class="pwa-icon"><i class="fas fa-graduation-cap"></i></div>' +
      '<div class="pwa-copy">' +
        '<strong>Add to Home Screen</strong>' +
        '<span>Tap <i class="fas fa-arrow-up-from-bracket"></i> then "Add to Home Screen"</span>' +
      '</div>' +
      '<button class="pwa-close" onclick="_pwaDismiss(\'pwa-install\')" aria-label="Dismiss">' +
        '<i class="fas fa-times"></i>' +
      '</button>'
    );
  }

  // ── Styles (injected once, self-contained) ─────────────────────
  function injectCSS() {
    if (document.getElementById('pwa-css')) return;
    const s = document.createElement('style');
    s.id = 'pwa-css';
    s.textContent = `
      /* ── shared banner shell ── */
      .pwa-banner {
        position: fixed;
        left: 50%;
        transform: translateX(-50%) translateY(14px);
        opacity: 0;
        width: min(440px, calc(100vw - 20px));
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 12px;
        border-radius: 14px;
        border: 1px solid rgba(255,255,255,0.08);
        background: #1e293b;
        color: #fff;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        font-size: 0.84rem;
        box-shadow: 0 10px 36px rgba(15,23,42,0.32), 0 2px 8px rgba(15,23,42,0.18);
        transition: opacity .32s ease, transform .32s cubic-bezier(0.16,1,0.3,1);
        pointer-events: none;
      }
      .pwa-banner.pwa-in {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
        pointer-events: all;
      }

      /* install banner — slides up above the bottom nav */
      #pwa-install {
        bottom: 74px;
      }
      /* update banner — slides down from below the header */
      #pwa-update {
        top: 66px;
        transform: translateX(-50%) translateY(-14px);
      }
      #pwa-update.pwa-in {
        transform: translateX(-50%) translateY(0);
      }

      /* icon pill */
      .pwa-icon {
        width: 36px; height: 36px; flex-shrink: 0;
        border-radius: 9px;
        background: rgba(79,70,229,0.22);
        color: #a5b4fc;
        display: flex; align-items: center; justify-content: center;
        font-size: 1rem;
      }
      .pwa-icon-update {
        background: rgba(16,185,129,0.18);
        color: #6ee7b7;
      }

      /* text */
      .pwa-copy {
        flex: 1; min-width: 0;
        display: flex; flex-direction: column; gap: 1px;
      }
      .pwa-copy strong {
        display: block; font-weight: 700; font-size: 0.86rem; color: #fff;
        letter-spacing: -0.01em;
      }
      .pwa-copy span {
        font-size: 0.73rem; color: rgba(255,255,255,0.48);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .pwa-copy i { color: rgba(255,255,255,0.7); font-size: 0.68rem; }

      /* primary CTA */
      .pwa-cta {
        flex-shrink: 0;
        background: #4f46e5; color: #fff;
        border: none; border-radius: 8px;
        padding: 7px 15px;
        font-family: inherit; font-size: 0.8rem; font-weight: 700;
        cursor: pointer; white-space: nowrap;
        box-shadow: 0 2px 10px rgba(79,70,229,0.4);
        transition: background .15s, transform .15s;
      }
      .pwa-cta:hover { background: #3730a3; transform: scale(1.04); }

      /* dismiss × */
      .pwa-close {
        flex-shrink: 0;
        width: 28px; height: 28px;
        background: rgba(255,255,255,0.07); border: none;
        border-radius: 7px; color: rgba(255,255,255,0.38);
        font-size: 0.73rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-family: inherit;
        transition: background .15s, color .15s;
      }
      .pwa-close:hover { background: rgba(255,255,255,0.15); color: #fff; }

      /* hide subtitle on very small phones */
      @media (max-width: 360px) { .pwa-copy span { display: none; } }
    `;
    document.head.appendChild(s);
  }

})();
