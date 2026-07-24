// views.js — Screen renderers. Each is registered as a route and renders into #app.
const $app = () => document.getElementById('app');
function h(strings, ...vals) { return strings.reduce((acc, s, i) => acc + s + (vals[i] != null ? vals[i] : ''), ''); }
function fmtMinSec(sec) { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; }
function greeting() { const hr = new Date().getHours(); return hr < 12 ? 'Good Morning' : hr < 18 ? 'Good Afternoon' : 'Good Evening'; }
const CATEGORY_LABEL = { HEIGHT: 'Height Experiment', EVENING_YOGA: 'Evening Yoga', NIGHT: 'Night Recovery', PUSH: 'Push Day', PULL: 'Pull Day', LEGS: 'Legs Day', SPRINT_WALK: 'Sprint/Walk' };

// ================= HOME =================
async function renderHome() {
  $app().innerHTML = `<div class="loading-spin safe-top">Loading…</div>`;
  const plan = await App.getTodayPlan();
  const todaySessions = await App.getTodaySessions();
  const settings = await App.getSettings();
  const active = await App.getActiveWorkout();

  const items = [
    { key: 'SPRINT_WALK', label: plan.sprintOrWalk, sub: 'Morning', routineId: null, action: 'sprintwalk' },
    { key: 'HEIGHT', label: 'Height Experiment', sub: routineShortName(plan.heightRoutineId), routineId: plan.heightRoutineId, action: 'player' },
    plan.strengthType !== 'REST'
      ? { key: plan.strengthType, label: CATEGORY_LABEL[plan.strengthType], sub: routineShortName(plan.strengthRoutineId), routineId: plan.strengthRoutineId, action: 'player' }
      : { key: 'REST', label: 'Rest Day', sub: 'Recovery from strength training', routineId: null, action: 'rest' },
    { key: 'EVENING_YOGA', label: 'Evening Yoga', sub: routineShortName(plan.eveningYogaId), routineId: plan.eveningYogaId, action: 'player' },
    { key: 'NIGHT', label: 'Night Recovery', sub: '10 min, optional', routineId: plan.nightRoutineId, action: 'player' },
  ];

  items.forEach(it => {
    it.done = it.key === 'REST' ? true : todaySessions.some(s => App.sessionCoversCategory(s, it.key));
  });

  const nextItem = items.find(it => !it.done);
  const effort = await App.getDailyEffort();
  const streak = await App.getStreak();

  let resumeBanner = '';
  if (active && active.status !== 'COMPLETED') {
    resumeBanner = `
      <div class="resume-banner" id="resumeBanner">
        <div>
          <div class="resume-title">WORKOUT IN PROGRESS</div>
          <div class="resume-sub">${active.routineName}</div>
        </div>
        <button class="btn-primary small" id="btnResume">RESUME</button>
      </div>`;
  }

  $app().innerHTML = `
    <div class="screen home safe-top">
      <div class="greeting">${greeting()}</div>
      ${resumeBanner}
      ${nextItem ? `
        <div class="next-up-card">
          <div class="next-up-label">NEXT UP</div>
          <div class="next-up-name">${nextItem.label}</div>
          <div class="next-up-sub">${nextItem.sub}</div>
          <button class="btn-primary big" id="btnStartNext">START WORKOUT</button>
        </div>` : `
        <div class="next-up-card all-done">
          <div class="next-up-label">🎉 ALL DONE</div>
          <div class="next-up-name">Every planned session complete</div>
        </div>`}

      <div class="section-title">Today's Progress</div>
      <div class="checklist">
        ${items.map(it => `<div class="checklist-row ${it.done ? 'done' : ''}">
          <span>${it.label}</span><span class="check-mark">${it.done ? '✓' : '○'}</span>
        </div>`).join('')}
      </div>

      <div class="effort-row">
        <div class="effort-ring" style="--pct:${effort}">
          <div class="effort-ring-inner">${effort}%</div>
        </div>
        <div class="effort-text">
          <div class="effort-title">DAILY EFFORT</div>
          <div class="effort-sub">${App.effortLabel(effort)}</div>
        </div>
        <div class="streak-badge">🔥 ${streak}</div>
      </div>
    </div>
  `;

  if (resumeBanner) {
    document.getElementById('btnResume').onclick = () => App.navigate(`#/player/${active.routineId}?resume=1`);
  }
  if (nextItem) {
    document.getElementById('btnStartNext').onclick = () => {
      if (nextItem.action === 'sprintwalk') App.navigate('#/sprintwalk');
      else if (nextItem.routineId) App.navigate(`#/player/${nextItem.routineId}`);
    };
  }
}

function routineShortName(id) {
  const r = ROUTINES[id];
  if (!r) return '';
  const mins = r.estimatedDuration;
  return `${mins} MIN`;
}

// ================= SPRINT / WALK =================
async function renderSprintWalk() {
  const plan = await App.getTodayPlan();
  $app().innerHTML = `
    <div class="screen safe-top">
      <div class="section-title-lg">${plan.sprintOrWalk}</div>
      <p class="muted">Day ${plan.dayNum} of the experiment. Tracked mainly for consistency.</p>
      <label class="field-label">Duration (minutes, optional)</label>
      <input type="number" id="swDuration" class="text-input" placeholder="e.g. 20" inputmode="numeric" />
      <div class="stack-btns">
        <button class="btn-primary big" id="swComplete">MARK COMPLETED</button>
        <button class="btn-secondary big" id="swSkip">MARK SKIPPED</button>
      </div>
    </div>`;
  document.getElementById('swComplete').onclick = async () => {
    const d = +document.getElementById('swDuration').value || 0;
    await App.markSprintWalk(plan.sprintOrWalk, 'completed', d);
    App.navigate('#/home');
  };
  document.getElementById('swSkip').onclick = async () => {
    await App.markSprintWalk(plan.sprintOrWalk, 'skipped', 0);
    App.navigate('#/home');
  };
}

// ================= TRAIN =================
async function renderTrain() {
  const plan = await App.getTodayPlan();
  const routinesByCat = {};
  Object.values(ROUTINES).forEach(r => { (routinesByCat[r.category] = routinesByCat[r.category] || []).push(r); });
  const catLabels = { HEIGHT: 'Height Experiment', EVENING_YOGA: 'Evening Yoga', NIGHT: 'Night Recovery', PUSH: 'Push', PULL: 'Pull', LEGS: 'Legs' };

  $app().innerHTML = `
    <div class="screen safe-top">
      <div class="section-title-lg">Train</div>
      <div class="section-title">Today's Workouts</div>
      <div class="card-list">
        ${routineCard(plan.heightRoutineId)}
        ${plan.strengthType !== 'REST' ? routineCard(plan.strengthRoutineId) : '<div class="rest-card">Rest day — recovery from strength training</div>'}
        ${routineCard(plan.eveningYogaId)}
        ${routineCard(plan.nightRoutineId)}
      </div>
      <div class="section-title">Routines</div>
      ${Object.keys(catLabels).map(cat => `
        <div class="mini-section-title">${catLabels[cat]}</div>
        <div class="card-list">${(routinesByCat[cat] || []).map(r => routineCard(r.id)).join('')}</div>
      `).join('')}
      <div class="section-title">Exercise Library</div>
      <input class="text-input" id="exSearch" placeholder="Search exercises…" />
      <div class="ex-grid" id="exGrid"></div>
    </div>`;

  function routineCard(id) {
    const r = ROUTINES[id];
    if (!r) return '';
    return `<div class="routine-card" data-id="${r.id}">
      <div class="routine-card-name">${r.name}</div>
      <div class="routine-card-meta">${r.estimatedDuration} MIN · ${r.exercises.length} exercises</div>
    </div>`;
  }

  document.querySelectorAll('.routine-card').forEach(el => {
    el.onclick = () => App.navigate(`#/player/${el.dataset.id}`);
  });

  function renderExGrid(filter) {
    const list = Object.values(EX).filter(e => !filter || e.name.toLowerCase().includes(filter.toLowerCase()));
    document.getElementById('exGrid').innerHTML = list.map(e => `
      <div class="ex-card" data-id="${e.id}">
        <div class="ex-card-cat">${e.category}</div>
        <div class="ex-card-name">${e.name}</div>
      </div>`).join('');
    document.querySelectorAll('.ex-card').forEach(el => { el.onclick = () => App.navigate(`#/exercise/${el.dataset.id}`); });
  }
  renderExGrid('');
  document.getElementById('exSearch').oninput = (e) => renderExGrid(e.target.value);
}

// ================= EXERCISE DETAIL =================
async function renderExerciseDetail(params) {
  const ex = EX[params.id];
  if (!ex) { App.navigate('#/train'); return; }
  $app().innerHTML = `
    <div class="screen safe-top">
      <button class="back-btn" id="backBtn">‹ Back</button>
      <div class="ex-detail-media">${ex.name.split(' ').slice(0, 2).map(w => w[0]).join('')}</div>
      <div class="ex-detail-name">${ex.name}</div>
      <div class="ex-detail-cat">${ex.category}${ex.sides ? ' · Both sides' : ''}</div>
      <div class="detail-block"><h4>Instructions</h4><p>${ex.instructions || ex.shortInstructions}</p></div>
      ${ex.formCues && ex.formCues.length ? `<div class="detail-block"><h4>Form Cues</h4><ul>${ex.formCues.map(c => `<li>${c}</li>`).join('')}</ul></div>` : ''}
      ${ex.safety ? `<div class="detail-block"><h4>Safety Notes</h4><p>${ex.safety}</p></div>` : `<div class="detail-block"><h4>Safety Notes</h4><p>Move into a strong but controlled range. Do not force it, and stop if you feel sharp pain.</p></div>`}
      <div class="detail-block"><h4>Recommended</h4><p>${ex.duration ? ex.duration + ' seconds hold' : 'Sets × reps as prescribed in your routine'}${ex.sides ? ', each side' : ''}</p></div>
      ${ex.equipment && ex.equipment.length ? `<div class="detail-block"><h4>Equipment</h4><p>${ex.equipment.join(', ')}</p></div>` : ''}
    </div>`;
  document.getElementById('backBtn').onclick = () => history.back();
}

// ================= PROGRESS =================
async function renderProgress() {
  const streak = await App.getStreak();
  const sessions = await DB.getAll('sessions');
  const today = new Date();
  const weekDays = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(today.getDate() - i); weekDays.push(d); }
  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const totalTrainingSec = sessions.reduce((a, s) => a + (s.actualDuration || 0), 0);
  const heightSec = sessions.filter(s => s.category === 'HEIGHT' || s.category === 'EVENING_YOGA' || s.category === 'NIGHT').reduce((a, s) => a + (s.actualDuration || 0), 0);
  const strengthSec = sessions.filter(s => ['PUSH', 'PULL', 'LEGS'].includes(s.category)).reduce((a, s) => a + (s.actualDuration || 0), 0);
  let hangingSec = 0;
  sessions.forEach(s => { const r = ROUTINES[s.routineId]; if (r) r.exercises.forEach(inst => { const ex = EX[inst.exerciseId]; if (ex && ex.id.includes('hang')) hangingSec += (inst.duration || 0) * (inst.sets || 1); }); });
  const workoutsCompleted = sessions.filter(s => s.status === 'completed').length;
  const exercisesCompleted = sessions.reduce((a, s) => a + (s.completedExercises ? s.completedExercises.length : 0), 0);
  const setsCompleted = sessions.reduce((a, s) => a + (s.setsLog ? s.setsLog.length : 0), 0);
  const avgEffort = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.effortScore || 0), 0) / sessions.length) : 0;
  const completionRate = sessions.length ? Math.round((sessions.filter(s => s.status === 'completed').length / sessions.length) * 100) : 0;

  $app().innerHTML = `
    <div class="screen safe-top">
      <div class="section-title-lg">Progress</div>
      <div class="streak-hero">🔥 ${streak} DAYS</div>
      <div class="section-title">This Week</div>
      <div class="week-row">
        ${weekDays.map((d, i) => {
          const iso = App.todayISO(d);
          const has = sessions.some(s => s.date === iso && (s.status === 'completed' || s.status === 'partial'));
          return `<div class="week-day ${has ? 'active' : ''}" data-date="${iso}"><div class="wd-letter">${dayLetters[d.getDay()]}</div><div class="wd-dot">${has ? '●' : '○'}</div></div>`;
        }).join('')}
      </div>
      <div class="section-title">Statistics</div>
      <div class="stat-grid">
        ${statBox('Total Training Time', fmtMinSec(totalTrainingSec))}
        ${statBox('Height Experiment Time', fmtMinSec(heightSec))}
        ${statBox('Strength Time', fmtMinSec(strengthSec))}
        ${statBox('Hanging Time', fmtMinSec(hangingSec))}
        ${statBox('Workouts Completed', workoutsCompleted)}
        ${statBox('Exercises Completed', exercisesCompleted)}
        ${statBox('Sets Completed', setsCompleted)}
        ${statBox('Average Effort', avgEffort + '/100')}
        ${statBox('Completion Rate', completionRate + '%')}
      </div>
      <div class="section-title">Consistency</div>
      <div class="heatmap" id="heatmap"></div>
      <div class="section-title">Strength Progress</div>
      <div class="card-list" id="strengthList"></div>
    </div>`;

  renderHeatmap(sessions);
  renderStrengthList();

  function statBox(label, val) { return `<div class="stat-box"><div class="stat-val">${val}</div><div class="stat-label">${label}</div></div>`; }

  function renderHeatmap(sessions) {
    const el = document.getElementById('heatmap');
    const days = [];
    for (let i = 55; i >= 0; i--) { const d = new Date(); d.setDate(today.getDate() - i); days.push(d); }
    el.innerHTML = days.map(d => {
      const iso = App.todayISO(d);
      const daySessions = sessions.filter(s => s.date === iso && s.category !== 'SPRINT_WALK');
      const avg = daySessions.length ? daySessions.reduce((a, s) => a + (s.effortScore || 0), 0) / daySessions.length : 0;
      const level = avg === 0 ? 0 : avg < 40 ? 1 : avg < 75 ? 2 : 3;
      return `<div class="heat-cell heat-${level}" data-date="${iso}" title="${iso}"></div>`;
    }).join('');
    el.querySelectorAll('.heat-cell').forEach(c => { c.onclick = () => App.navigate(`#/day/${c.dataset.date}`); });
  }

  async function renderStrengthList() {
    const progress = await DB.getAll('strengthProgress');
    const el = document.getElementById('strengthList');
    if (!progress.length) { el.innerHTML = '<div class="muted">Complete a strength workout to see progression here.</div>'; return; }
    el.innerHTML = progress.map(p => {
      const last = p.history[p.history.length - 1];
      const lastSets = last ? last.sets.length : 0;
      const lastReps = last ? Math.round(last.sets.reduce((a, s) => a + (s.actualReps || 0), 0) / last.sets.length) : 0;
      return `<div class="routine-card" data-ex="${p.exerciseId}">
        <div class="routine-card-name">${p.exerciseName}</div>
        <div class="routine-card-meta">${last ? `${lastSets} × ${lastReps} on ${last.date}` : 'No sessions yet'} · PB: ${p.personalBest} reps</div>
      </div>`;
    }).join('');
    el.querySelectorAll('.routine-card').forEach(c => { c.onclick = () => App.navigate(`#/strength/${c.dataset.ex}`); });
  }
}

async function renderStrengthDetail(params) {
  const rec = await App.getStrengthHistory(params.id);
  if (!rec) { App.navigate('#/progress'); return; }
  const suggestion = App.suggestNextTarget(rec);
  $app().innerHTML = `
    <div class="screen safe-top">
      <button class="back-btn" id="backBtn">‹ Back</button>
      <div class="section-title-lg">${rec.exerciseName}</div>
      <div class="pb-badge">Personal Best: ${rec.personalBest} reps</div>
      ${suggestion ? `<div class="suggestion-card"><div class="suggestion-title">Suggested Next</div><div class="suggestion-val">${suggestion.sets} × ${suggestion.reps}</div><div class="suggestion-note">${suggestion.note}</div></div>` : ''}
      <div class="section-title">History</div>
      <div class="card-list">
        ${rec.history.slice().reverse().map(h => `
          <div class="routine-card">
            <div class="routine-card-name">${h.date}</div>
            <div class="routine-card-meta">${h.sets.map(s => `${s.actualReps}${s.weight ? '@' + s.weight + 'kg' : ''}`).join(' / ')} reps</div>
          </div>`).join('')}
      </div>
    </div>`;
  document.getElementById('backBtn').onclick = () => history.back();
}

async function renderDayDetail(params) {
  const all = await DB.getAll('sessions');
  const daySessions = all.filter(s => s.date === params.date);
  $app().innerHTML = `
    <div class="screen safe-top">
      <button class="back-btn" id="backBtn">‹ Back</button>
      <div class="section-title-lg">${params.date}</div>
      ${daySessions.length ? '' : '<div class="muted">No training recorded this day.</div>'}
      <div class="card-list">
        ${daySessions.map(s => `
          <div class="routine-card">
            <div class="routine-card-name">${s.routineName}</div>
            <div class="routine-card-meta">${fmtMinSec(s.actualDuration)} · ${s.status} · Effort ${s.effortScore}/100</div>
          </div>`).join('')}
      </div>
    </div>`;
  document.getElementById('backBtn').onclick = () => history.back();
}

// ================= HEIGHT EXPERIMENT =================
async function renderExperiment() {
  const start = await App.getExperimentStart();
  const dayNum = App.daysBetween(start, App.todayISO()) + 1;
  const measurements = await App.getMeasurements();
  const startH = measurements[0] ? measurements[0].heightCm : null;
  const latest = measurements[measurements.length - 1];
  const change = (startH != null && latest) ? (latest.heightCm - startH).toFixed(1) : null;

  $app().innerHTML = `
    <div class="screen safe-top">
      <div class="section-title-lg">Height Experiment</div>
      <div class="day-badge">DAY ${dayNum}</div>
      <div class="height-stat-row">
        <div class="height-stat"><div class="hs-val">${startH != null ? startH + ' cm' : '—'}</div><div class="hs-label">Starting</div></div>
        <div class="height-stat"><div class="hs-val">${latest ? latest.heightCm + ' cm' : '—'}</div><div class="hs-label">Latest</div></div>
        <div class="height-stat"><div class="hs-val">${change != null ? (change >= 0 ? '+' : '') + change + ' cm' : '—'}</div><div class="hs-label">Change</div></div>
      </div>
      <p class="muted small">Measure at a consistent time of day and position for the most useful data. This tracks your personal measurements only — it does not claim to prove skeletal height change.</p>
      <button class="btn-primary big" id="btnAddMeasure">+ ADD MEASUREMENT</button>
      <div class="section-title">Graph</div>
      <div class="filter-row">
        <button class="chip-btn active" data-f="ALL">ALL</button>
        <button class="chip-btn" data-f="MORNING">MORNING</button>
        <button class="chip-btn" data-f="EVENING">EVENING</button>
      </div>
      <canvas id="heightChart" width="640" height="240" class="height-chart"></canvas>
      <div class="section-title">Measurements</div>
      <div class="card-list" id="measureList">
        ${measurements.slice().reverse().map(m => `
          <div class="routine-card">
            <div class="routine-card-name">${m.heightCm} cm</div>
            <div class="routine-card-meta">${m.date} ${m.time || ''} · ${m.period}${m.notes ? ' · ' + m.notes : ''}</div>
          </div>`).join('') || '<div class="muted">No measurements yet.</div>'}
      </div>
    </div>`;

  function drawChart(filter) {
    const canvas = document.getElementById('heightChart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const data = measurements.filter(m => filter === 'ALL' || m.period === filter);
    if (data.length < 2) {
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted');
      ctx.font = '14px sans-serif';
      ctx.fillText('Add at least 2 measurements to see a trend', 20, 120);
      return;
    }
    const vals = data.map(d => d.heightCm);
    const min = Math.min(...vals) - 0.5, max = Math.max(...vals) + 0.5;
    const w = canvas.width, hgt = canvas.height, pad = 30;
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--accent');
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = hgt - pad - ((d.heightCm - min) / (max - min)) * (hgt - pad * 2);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent');
    data.forEach((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = hgt - pad - ((d.heightCm - min) / (max - min)) * (hgt - pad * 2);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill();
    });
  }
  drawChart('ALL');
  document.querySelectorAll('.filter-row .chip-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.filter-row .chip-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      drawChart(btn.dataset.f);
    };
  });

  document.getElementById('btnAddMeasure').onclick = () => showAddMeasurementModal();
}

function showAddMeasurementModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  const now = new Date();
  const hr = now.getHours();
  modal.innerHTML = `
    <div class="modal">
      <h3>Add Measurement</h3>
      <label class="field-label">Height (cm)</label>
      <input type="number" step="0.1" id="mHeight" class="text-input" placeholder="e.g. 175.2" />
      <label class="field-label">Date</label>
      <input type="date" id="mDate" class="text-input" value="${App.todayISO()}" />
      <label class="field-label">Time</label>
      <input type="time" id="mTime" class="text-input" value="${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}" />
      <label class="field-label">Period</label>
      <select id="mPeriod" class="text-input">
        <option value="MORNING" ${hr < 14 ? 'selected' : ''}>Morning</option>
        <option value="EVENING" ${hr >= 14 ? 'selected' : ''}>Evening</option>
      </select>
      <label class="field-label">Notes (optional)</label>
      <input type="text" id="mNotes" class="text-input" placeholder="Optional notes" />
      <div class="modal-actions">
        <button class="btn-secondary" id="mCancel">CANCEL</button>
        <button class="btn-primary" id="mSave">SAVE</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#mCancel').onclick = () => modal.remove();
  modal.querySelector('#mSave').onclick = async () => {
    const heightCm = +document.getElementById('mHeight').value;
    if (!heightCm) return;
    await App.addMeasurement({
      heightCm, date: document.getElementById('mDate').value, time: document.getElementById('mTime').value,
      period: document.getElementById('mPeriod').value, notes: document.getElementById('mNotes').value,
    });
    modal.remove();
    renderExperiment();
  };
}

// ================= MORE / SETTINGS =================
async function renderMore() {
  const s = await App.getSettings();
  $app().innerHTML = `
    <div class="screen safe-top safe-bottom">
      <div class="section-title-lg">Settings</div>

      <div class="mini-section-title">Appearance</div>
      <div class="setting-row"><span>Theme</span>${selectHtml('theme', s.theme, ['SYSTEM', 'LIGHT', 'DARK'])}</div>

      <div class="mini-section-title">Voice Coaching</div>
      <div class="setting-row"><span>Voice Coaching</span>${toggleHtml('voiceEnabled', s.voiceEnabled)}</div>
      <div class="setting-row"><span>Countdown</span>${toggleHtml('countdown', s.countdown)}</div>
      <div class="setting-row"><span>Form Cues</span>${toggleHtml('formCues', s.formCues)}</div>
      <div class="setting-row"><span>Rest Announcements</span>${toggleHtml('restAnnouncements', s.restAnnouncements)}</div>
      <div class="setting-row"><span>Sound Effects</span>${toggleHtml('soundEffects', s.soundEffects)}</div>
      <div class="setting-row"><span>Vibration</span>${toggleHtml('vibration', s.vibration)}</div>
      <div class="setting-row"><span>Speech Rate</span>${selectHtml('rate', String(s.rate), ['0.85', '1', '1.15'], { '0.85': 'Slower', '1': 'Normal', '1.15': 'Faster' })}</div>

      <div class="mini-section-title">Workout</div>
      <div class="setting-row"><span>Keep Screen Awake</span>${toggleHtml('keepScreenAwake', s.keepScreenAwake)}</div>
      <div class="setting-row"><span>Default Transition (sec)</span><input type="number" class="mini-input" id="set_defaultTransition" value="${s.defaultTransition}" /></div>
      <div class="setting-row"><span>Default Rest (sec)</span><input type="number" class="mini-input" id="set_defaultRest" value="${s.defaultRest}" /></div>
      <div class="setting-row"><span>Height Unit</span>${selectHtml('heightUnit', s.heightUnit, ['cm', 'ft/in'])}</div>

      <div class="mini-section-title">Equipment</div>
      <div class="setting-row"><span>Pull-Up Bar</span>${toggleHtml('eq_bar', s.equipment.bar)}</div>
      <div class="setting-row"><span>Weight Plates</span>${toggleHtml('eq_plates', s.equipment.plates)}</div>
      <div class="setting-row"><span>Mat</span>${toggleHtml('eq_mat', s.equipment.mat)}</div>
      <div class="setting-row"><span>Skipping Rope</span>${toggleHtml('eq_rope', s.equipment.rope)}</div>
      <label class="field-label">Plate weights (kg, comma-separated)</label>
      <input type="text" class="text-input" id="set_plateWeights" value="${s.plateWeights.join(', ')}" />

      <div class="mini-section-title">Data</div>
      <button class="btn-secondary" id="btnExport">EXPORT DATA (JSON)</button>
      <button class="btn-danger" id="btnClear">CLEAR ALL DATA</button>

      <div class="mini-section-title">About</div>
      <p class="muted small">Personal training PWA. Works offline once installed. This experiment tracks personal measurements only and does not claim to prove or guarantee changes to adult skeletal height.</p>
    </div>`;

  function selectHtml(key, val, opts, labels) {
    return `<select class="mini-select" id="set_${key}">${opts.map(o => `<option value="${o}" ${String(val) === String(o) ? 'selected' : ''}>${labels ? labels[o] : o}</option>`).join('')}</select>`;
  }
  function toggleHtml(key, val) {
    return `<button class="toggle-btn ${val ? 'on' : ''}" id="set_${key}" data-key="${key}">${val ? 'ON' : 'OFF'}</button>`;
  }

  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.onclick = async () => {
      const key = btn.dataset.key;
      const newVal = !btn.classList.contains('on');
      btn.classList.toggle('on', newVal);
      btn.textContent = newVal ? 'ON' : 'OFF';
      if (key.startsWith('eq_')) {
        const eq = Object.assign({}, s.equipment, { [key.slice(3)]: newVal });
        await App.saveSettings({ equipment: eq });
      } else {
        await App.saveSettings({ [key]: newVal });
      }
    };
  });
  ['theme', 'rate', 'heightUnit'].forEach(key => {
    const el = document.getElementById('set_' + key);
    if (el) el.onchange = async () => {
      const v = key === 'rate' ? +el.value : el.value;
      await App.saveSettings({ [key]: v });
      if (key === 'theme') App.saveSettings({ theme: el.value });
    };
  });
  ['defaultTransition', 'defaultRest'].forEach(key => {
    const el = document.getElementById('set_' + key);
    if (el) el.onchange = async () => App.saveSettings({ [key]: +el.value });
  });
  const pw = document.getElementById('set_plateWeights');
  if (pw) pw.onchange = async () => {
    const arr = pw.value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    await App.saveSettings({ plateWeights: arr });
  };

  document.getElementById('btnExport').onclick = async () => {
    const data = {
      sessions: await DB.getAll('sessions'), strengthProgress: await DB.getAll('strengthProgress'),
      measurements: await DB.getAll('measurements'), settings: await App.getSettings(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'height-training-export.json'; a.click();
    URL.revokeObjectURL(url);
  };
  document.getElementById('btnClear').onclick = async () => {
    if (!confirm('This permanently deletes all workout history, measurements, and progress. Continue?')) return;
    await Promise.all(['sessions', 'strengthProgress', 'measurements', 'currentWorkout', 'meta'].map(store => DB.clear(store)));
    location.reload();
  };
}

// ================= PLAYER ROUTE =================
async function renderPlayer(params) {
  const active = await App.getActiveWorkout();
  const wantsResume = location.hash.includes('resume=1');
  $app().innerHTML = `<div class="player-mount"></div>`;
  const mount = $app().querySelector('.player-mount');
  if (active && active.routineId === params.routineId && (wantsResume || true) && active.status !== 'COMPLETED') {
    await Player.mount(mount, params.routineId, active);
  } else {
    await Player.mount(mount, params.routineId, null);
  }
  App.setUnmount(() => Player.unmount());
}

// ================= REGISTER ROUTES =================
App.route('/home', renderHome);
App.route('/sprintwalk', renderSprintWalk);
App.route('/train', renderTrain);
App.route('/exercise/:id', renderExerciseDetail);
App.route('/progress', renderProgress);
App.route('/strength/:id', renderStrengthDetail);
App.route('/day/:date', renderDayDetail);
App.route('/experiment', renderExperiment);
App.route('/more', renderMore);
App.route('/player/:routineId', renderPlayer);
