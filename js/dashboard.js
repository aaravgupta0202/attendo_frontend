// Dashboard — Attendo v2 (revised)
document.addEventListener('DOMContentLoaded', () => {

  // ── DOM refs ──
  const setupPrompt     = document.getElementById('setupPrompt');
  const heroStats       = document.getElementById('heroStats');
  const scheduleSection = document.getElementById('scheduleSection');
  const classesContainer= document.getElementById('classesContainer');
  const emptyDay        = document.getElementById('emptyDay');
  const swipeGuide      = document.getElementById('swipeGuide');
  const statTotal       = document.getElementById('statTotal');
  const statAttended    = document.getElementById('statAttended');
  const statMissed      = document.getElementById('statMissed');
  const dayPill         = document.getElementById('dayPill');
  const scheduleCount   = document.getElementById('scheduleCount');
  const dateChip        = document.getElementById('dateChip');
  const undoBtn         = document.getElementById('undoBtn');
  const markAllBtn      = document.getElementById('markAllBtn');
  const refreshBtn      = document.getElementById('refreshBtn');
  const menuBtn         = document.getElementById('menuBtn');
  const sideMenu        = document.getElementById('sideMenu');
  const menuClose       = document.getElementById('menuClose');
  const menuOverlay     = document.getElementById('menuOverlay');
  const storageFill     = document.getElementById('storageFill');
  const storageText     = document.getElementById('storageText');

  // Ring constants — viewBox="0 0 64 64", cx=cy=32, r=25
  // circumference = 2π × 25 ≈ 157.08
  const RING_R   = 25;
  const RING_C   = 2 * Math.PI * RING_R; // 157.08

  let undoStack = [];

  // ── Boot ──
  init();

  function init() {
    updateDateChip();
    dayPill.textContent = Utils.getDayName(new Date());
    checkSetup();
    loadClasses();
    setupMenu();
    setupActions();
    updateStorage();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    }

    const settings = JSON.parse(localStorage.getItem('attendo_settings') || '{}');
    if (settings.firstRun !== false) {
      setTimeout(() => {
        Utils.showToast('Welcome to Attendo! Set up your subjects to get started.', 'info', 5000);
        settings.firstRun = false;
        localStorage.setItem('attendo_settings', JSON.stringify(settings));
      }, 800);
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  function updateDateChip() {
    const now = new Date();
    dateChip.textContent = now.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
  }

  // ── Setup check ──
  function checkSetup() {
    const subjects  = Storage.getSubjects();
    const timetable = Storage.getTimetable();
    const ok = subjects.length > 0 && Object.values(timetable).some(d => d.length > 0);

    setupPrompt.classList.toggle('hidden', ok);
    heroStats.classList.toggle('hidden', !ok);
    scheduleSection.classList.toggle('hidden', !ok);
  }

  // ── Load classes ──
  function loadClasses() {
    const today        = new Date();
    const dayName      = Utils.getDayName(today).toLowerCase();
    const subjectIds   = Storage.getSubjectsForDay(dayName);
    const subjects     = Storage.getSubjects();
    const todayHistory = Storage.getHistoryForDate(Utils.formatDate(today));

    const todaySubjects = subjects.filter(s => subjectIds.includes(s.id));

    const attended = todayHistory.entries.filter(e => e.status === 'attended').length;
    const missed   = todayHistory.entries.filter(e => e.status === 'missed').length;
    statTotal.textContent    = todaySubjects.length;
    statAttended.textContent = attended;
    statMissed.textContent   = missed;
    scheduleCount.textContent = todaySubjects.length
      ? todaySubjects.length + ' class' + (todaySubjects.length !== 1 ? 'es' : '') + ' today'
      : 'No classes today';

    classesContainer.innerHTML = '';

    if (todaySubjects.length === 0) {
      emptyDay.classList.remove('hidden');
      swipeGuide.classList.add('hidden');
      return;
    }

    emptyDay.classList.add('hidden');
    swipeGuide.classList.remove('hidden');

    todaySubjects.forEach((subject, i) => {
      const card = buildCard(subject, todayHistory);
      card.style.animationDelay = (i * 0.07) + 's';
      card.classList.add('animate-up');
      classesContainer.appendChild(card);
      attachSwipe(card, subject.id);
    });

    updateUndoBtn();
  }

  // ── Build card ──
  function buildCard(subject, todayHistory) {
    const pct    = Utils.calculatePercentage(subject.attended, subject.total);
    const risk   = Utils.getRiskLevel(pct, subject.target);
    const status = (todayHistory.entries.find(e => e.subjectId === subject.id) || {}).status || 'pending';

    // Progress bar colour
    const fillClass = risk === 'low' ? 'fill-emerald' : risk === 'medium' ? 'fill-amber' : 'fill-rose';

    // Ring stroke colour
    const ringColor = risk === 'low' ? '#10b981' : risk === 'medium' ? '#f59e0b' : '#f43f5e';

    // Ring dash: clamp pct to 0–100
    const clamped   = Math.min(Math.max(pct, 0), 100);
    const dashOffset = RING_C * (1 - clamped / 100);

    // Risk label & class
    const riskMap = {
      low:    { cls: 'on-track',  icon: 'fa-circle-check',     label: 'On track' },
      medium: { cls: 'watch-out', icon: 'fa-triangle-exclamation', label: 'Watch out' },
      high:   { cls: 'at-risk',   icon: 'fa-circle-exclamation', label: 'At risk' }
    };
    const riskInfo = riskMap[risk] || riskMap.high;

    // Status icon
    const statusMap = {
      pending:   { icon: 'fa-clock',         label: 'Pending' },
      attended:  { icon: 'fa-circle-check',  label: 'Attended' },
      missed:    { icon: 'fa-circle-xmark',  label: 'Absent' },
      cancelled: { icon: 'fa-ban',           label: 'Cancelled' }
    };
    const statusInfo = statusMap[status] || statusMap.pending;

    const card = document.createElement('div');
    card.className = 'class-card';
    card.dataset.subjectId = subject.id;
    card.style.setProperty('--card-color', subject.color || '#4f46e5');

    card.innerHTML =
      '<div class="card-stripe"></div>' +

      // Swipe badges
      '<div class="swipe-badge swipe-badge-present"><i class="fas fa-circle-check"></i> Present</div>' +
      '<div class="swipe-badge swipe-badge-absent"><i class="fas fa-circle-xmark"></i> Absent</div>' +

      // Body
      '<div class="card-body">' +
        '<div class="card-info">' +
          '<div class="subject-title">' + subject.name + '</div>' +
          '<span class="risk-tag ' + riskInfo.cls + '">' +
            '<i class="fas ' + riskInfo.icon + '"></i>' + riskInfo.label +
          '</span>' +
        '</div>' +

        // Ring — viewBox="0 0 64 64", r=25, circle centred at 32,32
        '<div class="ring-wrap">' +
          '<svg class="ring-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">' +
            '<circle class="ring-bg"   cx="32" cy="32" r="' + RING_R + '"/>' +
            '<circle class="ring-fill" cx="32" cy="32" r="' + RING_R + '"' +
              ' stroke="' + ringColor + '"' +
              ' stroke-dasharray="' + RING_C + '"' +
              ' stroke-dashoffset="' + dashOffset + '"/>' +
          '</svg>' +
          '<div class="ring-label">' + pct + '%</div>' +
        '</div>' +
      '</div>' +

      // Progress bar
      '<div class="card-progress">' +
        '<div class="progress-meta">' +
          '<span>' + subject.attended + '/' + subject.total + ' classes</span>' +
          '<span>Target: ' + subject.target + '%</span>' +
        '</div>' +
        '<div class="progress-track">' +
          '<div class="progress-fill ' + fillClass + '" style="width:' + Math.min(pct, 100) + '%"></div>' +
        '</div>' +
      '</div>' +

      // Footer
      '<div class="card-footer">' +
        '<div class="status-row">' +
          '<div class="status-icon ' + status + '"><i class="fas ' + statusInfo.icon + '"></i></div>' +
          '<span>' + statusInfo.label + '</span>' +
        '</div>' +
        '<div class="swipe-hint">' +
          '<span><i class="fas fa-arrow-left"></i> Absent</span>' +
          '<span>Present <i class="fas fa-arrow-right"></i></span>' +
        '</div>' +
      '</div>';

    return card;
  }

  // Update card status text/icon in-place (for cancelled tap)
  function updateCardStatus(card, status) {
    const statusMap = {
      pending:   { icon: 'fa-clock',         label: 'Pending' },
      attended:  { icon: 'fa-circle-check',  label: 'Attended' },
      missed:    { icon: 'fa-circle-xmark',  label: 'Absent' },
      cancelled: { icon: 'fa-ban',           label: 'Cancelled' }
    };
    const info = statusMap[status] || statusMap.pending;
    const iconEl  = card.querySelector('.status-icon');
    const labelEl = card.querySelector('.status-row span');
    if (iconEl)  { iconEl.className = 'status-icon ' + status; iconEl.innerHTML = '<i class="fas ' + info.icon + '"></i>'; }
    if (labelEl) { labelEl.textContent = info.label; }
  }

  // ── Swipe ──
  function attachSwipe(card, subjectId) {
    let active = false, startX = 0, dx = 0, vel = 0, lastX = 0, lastT = 0;
    let tapPossible = true;

    function onStart(e) {
      if (e.type === 'touchstart') e.preventDefault();
      active = true;
      tapPossible = true;
      dx = 0; vel = 0;
      startX = lastX = (e.touches ? e.touches[0].clientX : e.clientX);
      lastT = Date.now();

      // Kill CSS transition on transform while dragging
      card.style.transition = 'border-color 100ms ease, background 100ms ease';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup',   onEnd);
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend',  onEnd);
    }

    function onMove(e) {
      if (!active) return;
      if (e.type === 'touchmove') e.preventDefault();
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      dx = cx - startX;

      // Velocity
      const now = Date.now(), dt = now - lastT;
      if (dt > 0) vel = (cx - lastX) / dt;
      lastX = cx; lastT = now;

      // Resistance: full travel at ±120px feels comfortable
      const t = dx * 0.42;
      const rot = dx * 0.03; // subtle rotation
      card.style.transform = 'translateX(' + t + 'px) rotate(' + rot + 'deg)';

      // State classes for tint + badge
      if (dx > 35) {
        card.classList.add('sw-right');
        card.classList.remove('sw-left');
      } else if (dx < -35) {
        card.classList.add('sw-left');
        card.classList.remove('sw-right');
      } else {
        card.classList.remove('sw-right', 'sw-left');
      }

      // Once moved more than 8px it's a drag, not a tap
      if (Math.abs(dx) > 8) tapPossible = false;
    }

    function onEnd() {
      if (!active) return;
      active = false;

      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onEnd);

      const absDx  = Math.abs(dx);
      const absVel = Math.abs(vel * 1000); // px/s

      // Threshold: 90px OR fast flick
      if (absDx > 90 || (absDx > 40 && absVel > 400)) {
        const dir = dx > 0 ? 1 : -1;
        const status = dir > 0 ? 'attended' : 'missed';

        // Fly out
        card.style.transition = 'transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.28s ease';
        card.style.transform  = 'translateX(' + (dir * 110) + 'vw) rotate(' + (dir * 18) + 'deg)';
        card.style.opacity    = '0';

        markAttendance(subjectId, status);
        setTimeout(() => { card.remove(); refreshStats(); }, 320);
      } else {
        // Spring back
        card.style.transition = 'transform 0.45s cubic-bezier(0.16,1,0.3,1), border-color 100ms ease, background 100ms ease';
        card.style.transform  = '';
        card.classList.remove('sw-right', 'sw-left');
      }
    }

    card.addEventListener('mousedown',  onStart);
    card.addEventListener('touchstart', onStart, { passive: false });

    // Tap = cancelled
    card.addEventListener('click', () => {
      if (!tapPossible) return;
      markAttendance(subjectId, 'cancelled');
      updateCardStatus(card, 'cancelled');
      card.style.animation = 'none';
      card.offsetHeight; // reflow
      card.style.animation = 'shake 0.38s ease';
    });
  }

  function refreshStats() {
    const today       = new Date();
    const dayName     = Utils.getDayName(today).toLowerCase();
    const subjectIds  = Storage.getSubjectsForDay(dayName);
    const subjects    = Storage.getSubjects();
    const history     = Storage.getHistoryForDate(Utils.formatDate(today));
    const todaySubs   = subjects.filter(s => subjectIds.includes(s.id));
    const attended    = history.entries.filter(e => e.status === 'attended').length;
    const missed      = history.entries.filter(e => e.status === 'missed').length;
    statTotal.textContent    = todaySubs.length;
    statAttended.textContent = attended;
    statMissed.textContent   = missed;
  }

  // ── Attendance ──
  function markAttendance(subjectId, status) {
    const today = Utils.formatDate();
    if (Storage.markAttendance(today, subjectId, status)) {
      undoStack.push({ subjectId, status, timestamp: Date.now() });
      updateUndoBtn();
      const msgs  = { attended: 'Marked present', missed: 'Marked absent', cancelled: 'Marked cancelled' };
      const types = { attended: 'success', missed: 'error', cancelled: 'info' };
      Utils.showToast(msgs[status], types[status]);
    }
  }

  function updateUndoBtn() {
    undoBtn.disabled = undoStack.length === 0;
  }

  // ── Menu ──
  function openMenu()  { sideMenu.classList.add('open'); menuOverlay.classList.add('show'); }
  function closeMenu() { sideMenu.classList.remove('open'); menuOverlay.classList.remove('show'); }

  function setupMenu() {
    menuBtn.addEventListener('click', openMenu);
    menuClose.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', closeMenu);
  }

  function updateStorage() {
    const info = Utils.calculateStorageUsage();
    storageFill.style.width = info.percentage + '%';
    storageText.textContent = info.formatted + ' used';
  }

  // ── Actions ──
  function setupActions() {
    undoBtn.addEventListener('click', () => {
      const action = Storage.undoLastAction();
      if (action) {
        undoStack.pop();
        updateUndoBtn();
        loadClasses();
        Utils.showToast('Undo successful', 'success');
      }
    });

    refreshBtn.addEventListener('click', () => {
      loadClasses();
      Utils.showToast('Refreshed', 'info');
    });

    markAllBtn.addEventListener('click', () => {
      const dayName = Utils.getDayName(new Date()).toLowerCase();
      const ids = Storage.getSubjectsForDay(dayName);
      ids.forEach(id => markAttendance(id, 'attended'));
      setTimeout(() => loadClasses(), 100);
      Utils.showToast('All classes marked present', 'success');
    });

    // Export
    document.getElementById('menuExport').addEventListener('click', () => {
      const data = Storage.exportData();
      const url  = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const a    = Object.assign(document.createElement('a'), {
        href: url, download: 'attendo-' + Utils.formatDate() + '.json'
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      Utils.showToast('Data exported', 'success');
      closeMenu();
    });

    // Import
    document.getElementById('menuImport').addEventListener('click', () => {
      document.getElementById('importInput').click();
      closeMenu();
    });
    document.getElementById('importInput').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const result = Storage.importData(ev.target.result);
          if (result.success) {
            Utils.showToast('Data imported!', 'success');
            setTimeout(() => location.reload(), 900);
          } else {
            Utils.showToast('Import failed: ' + result.error, 'error');
          }
        } catch (err) {
          Utils.showToast('Invalid file format', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    // Reset
    document.getElementById('menuReset').addEventListener('click', () => {
      if (confirm('Reset ALL data? This cannot be undone.')) {
        Storage.clearAllData();
        Utils.showToast('All data cleared', 'info');
        setTimeout(() => location.reload(), 900);
      }
      closeMenu();
    });
  }
});
