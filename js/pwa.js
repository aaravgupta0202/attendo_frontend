// ─────────────────────────────────────────────────────────────
// pwa.js · Attendo PWA
// Must be loaded FIRST (moved to <head>) so beforeinstallprompt
// is never missed.
// ─────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // ── Capture install prompt immediately — BEFORE anything else ──
  // This must fire before the event, so the script is in <head>
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] beforeinstallprompt captured');
    // Show banner after a short delay so the page has rendered
    setTimeout(maybeShowInstallBanner, 2500);
  });

  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    hideBanner('pwa-install');
    console.log('[PWA] App installed!');
  });

  // ── Service Worker ────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('./service-worker.js', { scope: './' })
        .then(function (reg) {
          console.log('[PWA] SW registered:', reg.scope);

          // New SW waiting → show update banner
          if (reg.waiting) {
            showUpdateBanner(reg);
          }
          reg.addEventListener('updatefound', function () {
            var sw = reg.installing;
            if (!sw) return;
            sw.addEventListener('statechange', function () {
              if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateBanner(reg);
              }
            });
          });
        })
        .catch(function (err) {
          console.warn('[PWA] SW registration failed:', err);
        });

      // Reload when new SW takes control
      var reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!reloading) { reloading = true; location.reload(); }
      });
    });
  }

  // ── Install banner ────────────────────────────────────────────
  function maybeShowInstallBanner() {
    if (isStandalone()) return;
    if (sessionStorage.getItem('pwa-dismissed')) return;

    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      // iOS Safari — show manual "Add to Home Screen" instructions
      // Only once per browser (not per session)
      if (localStorage.getItem('pwa-ios-tip-shown')) return;
      localStorage.setItem('pwa-ios-tip-shown', '1');
      showBanner('pwa-install',
        icon('fa-graduation-cap') +
        copy('Add to Home Screen',
          'Tap the Share button <i class="fas fa-arrow-up-from-bracket"></i> then "Add to Home Screen"') +
        closeBtn('pwa-install')
      );
    } else if (deferredPrompt) {
      // Android / Chrome / Edge desktop
      showBanner('pwa-install',
        icon('fa-graduation-cap') +
        copy('Install Attendo', 'Works offline &middot; Home screen icon &middot; No app store') +
        '<button class="pwa-cta" onclick="window._pwaInstall()">Install</button>' +
        closeBtn('pwa-install')
      );
    }
  }

  // Public — called by Install button
  window._pwaInstall = function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (result) {
      console.log('[PWA] User choice:', result.outcome);
      deferredPrompt = null;
      hideBanner('pwa-install');
    });
  };

  window._pwaDismiss = function (id) {
    sessionStorage.setItem('pwa-dismissed', '1');
    hideBanner(id);
  };

  // ── Update banner ─────────────────────────────────────────────
  function showUpdateBanner(reg) {
    if (document.getElementById('pwa-update')) return;
    window._pwaUpdateReg = reg;
    showBanner('pwa-update',
      '<div class="pwa-icon pwa-icon-update"><i class="fas fa-rotate"></i></div>' +
      copy('Update ready', 'Reload to get the latest version of Attendo') +
      '<button class="pwa-cta" onclick="window._pwaReload()">Reload</button>' +
      closeBtn('pwa-update')
    );
  }

  window._pwaReload = function () {
    var reg = window._pwaUpdateReg;
    if (reg && reg.waiting) {
      reg.waiting.postMessage('SKIP_WAITING');
    } else {
      location.reload();
    }
  };

  // ── DOM helpers ───────────────────────────────────────────────
  function icon(faClass) {
    return '<div class="pwa-icon"><i class="fas ' + faClass + '"></i></div>';
  }
  function copy(title, sub) {
    return '<div class="pwa-copy"><strong>' + title + '</strong><span>' + sub + '</span></div>';
  }
  function closeBtn(bannerId) {
    return '<button class="pwa-close" onclick="window._pwaDismiss(\'' + bannerId + '\')" aria-label="Dismiss"><i class="fas fa-times"></i></button>';
  }

  function showBanner(id, html) {
    if (document.getElementById(id)) return;
    injectCSS();
    var el = document.createElement('div');
    el.id = id;
    el.className = id === 'pwa-update' ? 'pwa-banner pwa-banner-top' : 'pwa-banner pwa-banner-bottom';
    el.innerHTML = html;
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('pwa-in'); });
    });
  }

  function hideBanner(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('pwa-in');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 380);
  }

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
  }

  // ── Self-contained CSS ────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('pwa-css')) return;
    var s = document.createElement('style');
    s.id = 'pwa-css';
    s.textContent = [
      '.pwa-banner{',
        'position:fixed;left:50%;',
        'opacity:0;pointer-events:none;',
        'width:min(440px,calc(100vw - 20px));',
        'z-index:9999;',
        'display:flex;align-items:center;gap:10px;',
        'padding:11px 13px;',
        'border-radius:14px;',
        'border:1px solid rgba(255,255,255,0.08);',
        'background:#1e293b;color:#fff;',
        "font-family:'Plus Jakarta Sans',system-ui,sans-serif;",
        'font-size:0.84rem;',
        'box-shadow:0 10px 36px rgba(15,23,42,0.32),0 2px 8px rgba(15,23,42,0.16);',
        'transition:opacity .32s ease,transform .32s cubic-bezier(0.16,1,0.3,1);',
      '}',
      '.pwa-banner-bottom{',
        'bottom:74px;',
        'transform:translateX(-50%) translateY(16px);',
      '}',
      '.pwa-banner-top{',
        'top:66px;',
        'transform:translateX(-50%) translateY(-16px);',
      '}',
      '.pwa-banner.pwa-in{',
        'opacity:1;pointer-events:all;',
        'transform:translateX(-50%) translateY(0);',
      '}',
      '.pwa-icon{',
        'width:36px;height:36px;flex-shrink:0;',
        'border-radius:9px;',
        'background:rgba(79,70,229,0.2);color:#a5b4fc;',
        'display:flex;align-items:center;justify-content:center;',
        'font-size:1rem;',
      '}',
      '.pwa-icon-update{background:rgba(16,185,129,0.18);color:#6ee7b7;}',
      '.pwa-copy{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;}',
      '.pwa-copy strong{display:block;font-weight:700;font-size:0.87rem;color:#fff;letter-spacing:-0.01em;}',
      '.pwa-copy span{font-size:0.73rem;color:rgba(255,255,255,0.5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.pwa-copy i{color:rgba(255,255,255,0.7);font-size:0.7rem;}',
      '.pwa-cta{',
        'flex-shrink:0;',
        'background:#4f46e5;color:#fff;border:none;border-radius:8px;',
        'padding:7px 15px;',
        "font-family:inherit;font-size:0.8rem;font-weight:700;",
        'cursor:pointer;white-space:nowrap;',
        'box-shadow:0 2px 10px rgba(79,70,229,0.38);',
        'transition:background .15s,transform .15s;',
      '}',
      '.pwa-cta:hover{background:#3730a3;transform:scale(1.04);}',
      '.pwa-close{',
        'flex-shrink:0;width:28px;height:28px;',
        'background:rgba(255,255,255,0.07);border:none;',
        'border-radius:7px;color:rgba(255,255,255,0.38);',
        'font-size:0.73rem;cursor:pointer;',
        'display:flex;align-items:center;justify-content:center;',
        "font-family:inherit;",
        'transition:background .15s,color .15s;',
      '}',
      '.pwa-close:hover{background:rgba(255,255,255,0.15);color:#fff;}',
      '@media(max-width:360px){.pwa-copy span{display:none;}}',
    ].join('');
    document.head.appendChild(s);
  }

})();
