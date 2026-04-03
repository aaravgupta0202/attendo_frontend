// Setup Logic — Attendo v2
document.addEventListener('DOMContentLoaded', () => {

  let currentStep = 1;
  let selectedPillId = null;

  const COLORS = [
    '#4f46e5','#0ea5e9','#10b981','#f59e0b','#f43f5e',
    '#8b5cf6','#06b6d4','#84cc16','#f97316','#ec4899',
    '#6366f1','#14b8a6','#a3e635','#fb923c','#e879f9'
  ];

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // ── Step navigation ──
  document.querySelectorAll('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.next)));
  });
  document.querySelectorAll('[data-prev]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.prev)));
  });

  function goToStep(n) {
    if (n === 2 && Storage.getSubjects().length === 0) {
      Utils.showToast('Add at least one subject first!', 'warning');
      return;
    }
    currentStep = n;
    document.querySelectorAll('.step-block').forEach(el => el.classList.remove('active'));
    document.getElementById('step' + n).classList.add('active');
    updateStepper();
    if (n === 2) renderTimetable();
    if (n === 3) renderTargets();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateStepper() {
    [1,2,3].forEach(i => {
      const node = document.getElementById('stepNode' + i);
      node.classList.remove('active','done');
      if (i < currentStep) {
        node.classList.add('done');
        node.querySelector('.step-circle').innerHTML = '<i class="fas fa-check"></i>';
      } else if (i === currentStep) {
        node.classList.add('active');
        node.querySelector('.step-circle').textContent = i;
      } else {
        node.querySelector('.step-circle').textContent = i;
      }
    });
    [1,2].forEach(i => {
      const line = document.getElementById('stepLine' + i);
      line.classList.toggle('done', i < currentStep);
    });
  }

  // ── Step 1: Subjects ──
  const subjectInput = document.getElementById('subjectName');
  const addBtn = document.getElementById('addSubjectBtn');
  const subjectsGrid = document.getElementById('subjectsGrid');

  renderSubjects();

  addBtn.addEventListener('click', addSubject);
  subjectInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addSubject();
  });

  function addSubject() {
    const name = subjectInput.value.trim();
    const error = Utils.validateSubjectName(name);
    if (error) { Utils.showToast(error, 'warning'); return; }

    const subjects = Storage.getSubjects();
    if (subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      Utils.showToast('Subject already exists!', 'warning');
      return;
    }

    const colorIndex = subjects.length % COLORS.length;
    Storage.addSubject({ name, target: 75, color: COLORS[colorIndex] });
    subjectInput.value = '';
    subjectInput.focus();
    renderSubjects();
    Utils.showToast('"' + name + '" added!', 'success');
  }

  function renderSubjects() {
    const subjects = Storage.getSubjects();
    subjectsGrid.innerHTML = '';

    if (!subjects.length) {
      subjectsGrid.innerHTML = '<div class="empty-subjects"><i class="fas fa-book-open"></i>No subjects yet. Add your first one above!</div>';
      return;
    }

    subjects.forEach(s => {
      const card = document.createElement('div');
      card.className = 'subj-item';
      card.innerHTML =
        '<div class="subj-color" style="background:' + s.color + '"></div>' +
        '<div class="subj-item-info">' +
          '<div class="subj-item-name">' + s.name + '</div>' +
          '<div class="subj-item-meta">Target: ' + s.target + '%</div>' +
        '</div>' +
        '<div class="subj-item-actions">' +
          '<button class="subj-action-btn" data-id="' + s.id + '" title="Delete"><i class="fas fa-trash-alt"></i></button>' +
        '</div>';

      card.querySelector('.subj-action-btn').addEventListener('click', () => {
        if (confirm('Delete "' + s.name + '"?')) {
          Storage.deleteSubject(s.id);
          const tt = Storage.getTimetable();
          Object.keys(tt).forEach(day => { tt[day] = tt[day].filter(id => id !== s.id); });
          Storage.saveTimetable(tt);
          renderSubjects();
          Utils.showToast('"' + s.name + '" deleted', 'info');
        }
      });
      subjectsGrid.appendChild(card);
    });
  }

  // ── Step 2: Timetable ──
  function renderTimetable() {
    const grid = document.getElementById('timetableGrid');
    const pool = document.getElementById('dragPool');
    const subjects = Storage.getSubjects();
    const timetable = Storage.getTimetable();

    grid.innerHTML = '';
    DAYS.forEach((day, di) => {
      const dayKey = day.toLowerCase();
      const col = document.createElement('div');
      col.className = 'day-col';
      col.dataset.day = dayKey;

      const assigned = (timetable[dayKey] || [])
        .map(id => subjects.find(s => s.id === id))
        .filter(Boolean);

      const subjectsHtml = assigned.map(s =>
        '<div class="day-subject-chip" style="background:' + s.color + '">' +
          s.name +
          '<button class="chip-remove" data-id="' + s.id + '" data-day="' + dayKey + '"><i class="fas fa-times"></i></button>' +
        '</div>'
      ).join('');

      col.innerHTML =
        '<div class="day-col-head">' + DAY_SHORT[di] + '</div>' +
        '<div class="day-col-subjects" id="daySubjects_' + dayKey + '">' +
          subjectsHtml +
          (assigned.length === 0 ? '<div class="empty-col-hint">Drop here</div>' : '') +
        '</div>';

      col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
      col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
      col.addEventListener('drop', e => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const subjectId = e.dataTransfer.getData('subjectId');
        if (subjectId) assignSubjectToDay(subjectId, dayKey);
      });

      col.addEventListener('click', () => {
        if (selectedPillId) {
          assignSubjectToDay(selectedPillId, dayKey);
          clearPillSelection();
        }
      });

      grid.appendChild(col);
    });

    // Remove buttons
    grid.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        removeFromDay(btn.dataset.id, btn.dataset.day);
      });
    });

    // Drag pool
    pool.innerHTML = '';
    subjects.forEach(s => {
      const pill = document.createElement('div');
      pill.className = 'drag-pill';
      pill.dataset.id = s.id;
      pill.draggable = true;
      pill.innerHTML = '<div class="drag-pill-dot" style="background:' + s.color + '"></div>' + s.name;

      pill.addEventListener('dragstart', e => {
        e.dataTransfer.setData('subjectId', s.id);
        pill.classList.add('dragging');
      });
      pill.addEventListener('dragend', () => pill.classList.remove('dragging'));

      pill.addEventListener('click', () => {
        if (selectedPillId === s.id) {
          clearPillSelection();
        } else {
          clearPillSelection();
          selectedPillId = s.id;
          pill.style.borderColor = 'var(--brand)';
          pill.style.color = 'var(--brand)';
          pill.style.background = 'rgba(79,70,229,0.06)';
          Utils.showToast('Now tap a day column to assign', 'info', 2000);
        }
      });

      pool.appendChild(pill);
    });
  }

  function assignSubjectToDay(subjectId, dayKey) {
    const timetable = Storage.getTimetable();
    if (!timetable[dayKey]) timetable[dayKey] = [];
    if (!timetable[dayKey].includes(subjectId)) {
      timetable[dayKey].push(subjectId);
      Storage.saveTimetable(timetable);
    }
    renderTimetable();
  }

  function removeFromDay(subjectId, dayKey) {
    const timetable = Storage.getTimetable();
    if (timetable[dayKey]) {
      timetable[dayKey] = timetable[dayKey].filter(id => id !== subjectId);
      Storage.saveTimetable(timetable);
      renderTimetable();
    }
  }

  function clearPillSelection() {
    selectedPillId = null;
    document.querySelectorAll('.drag-pill').forEach(p => {
      p.style.borderColor = '';
      p.style.color = '';
      p.style.background = '';
    });
  }

  // ── Step 3: Targets ──
  function renderTargets() {
    const subjects = Storage.getSubjects();
    const list = document.getElementById('targetsList');
    list.innerHTML = '';

    subjects.forEach(s => {
      const row = document.createElement('div');
      row.className = 'target-row';
      row.innerHTML =
        '<div class="target-row-head">' +
          '<span class="target-subj-name">' + s.name + '</span>' +
          '<span class="target-val-display" id="tVal_' + s.id + '">' + s.target + '%</span>' +
        '</div>' +
        '<input type="range" class="target-slider" min="50" max="100" step="5" value="' + s.target + '" data-id="' + s.id + '" id="tSlider_' + s.id + '">' +
        '<div class="target-hint" id="tHint_' + s.id + '">' + getHint(s.target) + '</div>';

      row.querySelector('.target-slider').addEventListener('input', e => {
        const val = parseInt(e.target.value);
        document.getElementById('tVal_' + s.id).textContent = val + '%';
        document.getElementById('tHint_' + s.id).textContent = getHint(val);
      });
      list.appendChild(row);
    });
  }

  function getHint(val) {
    if (val >= 85) return '🎯 High commitment';
    if (val >= 75) return '📚 Standard requirement';
    return '⚠️ Below average — be careful';
  }

  // ── Save ──
  document.getElementById('saveSetupBtn').addEventListener('click', () => {
    document.querySelectorAll('.target-slider').forEach(slider => {
      Storage.updateSubject(slider.dataset.id, { target: parseInt(slider.value) });
    });
    Utils.showToast('Setup saved!', 'success');
    document.getElementById('targetsList').style.display = 'none';
    document.getElementById('step3Footer').style.display = 'none';
    document.getElementById('completionCard').classList.remove('hidden');
  });
});
