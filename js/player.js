// player.js — Full-screen workout player. Subscribes to WorkoutEngine state and renders it.
const Player = (() => {
  let engine = null;
  let container = null;
  let routine = null;
  let lastActualReps = {};

  function fmtTime(sec) {
    sec = Math.max(0, Math.round(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function mount(root, routineId, resumeSnapshot) {
    container = root;
    routine = ROUTINES[routineId];
    if (!routine) { App.navigate('#/train'); return; }
    const settings = await App.getSettings();
    engine = new WorkoutEngine(routine, {
      settings,
      onSetLogged: async (step, data) => { await App.recordStrengthSet(step, data); },
      onComplete: async (summary) => { await App.finishWorkout(summary); render(engine.getState(), true); },
      onEnded: async (summary) => { await App.finishWorkout(summary); },
    });
    Voice.updateSettings(settings);
    engine.on((state) => render(state));

    if (window.__wakeLockSentinel) releaseWakeLock();
    if (settings.keepScreenAwake !== false) requestWakeLock();

    if (resumeSnapshot) {
      engine.restoreSnapshot(resumeSnapshot);
    } else {
      engine.start();
    }
    window.__activeEngine = engine;
  }

  function unmount() {
    if (engine && engine.tickHandle) clearInterval(engine.tickHandle);
    releaseWakeLock();
    Voice.cancelAll();
    engine = null;
    window.__activeEngine = null;
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        window.__wakeLockSentinel = await navigator.wakeLock.request('screen');
      }
    } catch (e) { /* unsupported or denied — fail gracefully */ }
  }
  function releaseWakeLock() {
    try { if (window.__wakeLockSentinel) { window.__wakeLockSentinel.release(); window.__wakeLockSentinel = null; } } catch (e) {}
  }

  function render(state, isFinal) {
    if (!container) return;
    if (state.status === 'COMPLETED') { renderComplete(state); return; }
    if (state.status === 'ENDED') { return; }
    const step = state.step;
    if (!step) return;

    const pct = state.progressPercent;
    const headerLabel = `${step.exerciseIndexOverall} / ${step.totalExercises}`;

    let body = '';
    if (step.kind === 'transition') {
      body = renderTransition(step, state);
    } else if (step.kind === 'rest') {
      body = renderRest(step, state);
    } else {
      body = step.useReps ? renderStrengthExercise(step, state) : renderTimedExercise(step, state);
    }

    const nextStep = state.nextStep;
    const nextLabel = nextStep ? describeNext(nextStep) : 'Last exercise';

    container.innerHTML = `
      <div class="player">
        <div class="player-top safe-top">
          <button class="icon-btn" id="btnEnd" aria-label="End workout">✕</button>
          <div class="player-title">${routine.name}</div>
          <div class="player-count">${headerLabel}</div>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="player-body">${body}</div>
        <div class="player-controls">
          <button class="ctrl-btn" id="btnPrev">PREV</button>
          <button class="ctrl-btn ctrl-btn-main" id="btnPause">${state.status === 'PAUSED' ? '▶ RESUME' : '⏸ PAUSE'}</button>
          <button class="ctrl-btn" id="btnSkip">SKIP</button>
        </div>
        <button class="restart-btn" id="btnRestart">↻ RESTART EXERCISE</button>
        <div class="next-up safe-bottom">NEXT: ${nextLabel}</div>
      </div>
    `;

    bindControls(step);
  }

  function describeNext(step) {
    if (step.kind === 'transition') return step.isSideSwitch ? 'Other side' : step.exerciseName;
    if (step.kind === 'rest') return `Rest — ${step.nextExerciseName}, set ${step.nextSetNumber} of ${step.nextTotalSets}`;
    if (step.kind === 'exercise') {
      const dur = step.useReps ? `${step.targetReps} reps` : `${step.duration} sec`;
      return `${step.exercise.name} — ${dur}`;
    }
    return '';
  }

  function renderTransition(step, state) {
    return `
      <div class="stage-label">${step.isSideSwitch ? 'SWITCH SIDES' : 'GET READY'}</div>
      <div class="exercise-name">${step.isSideSwitch ? 'Other side' : step.exerciseName}</div>
      <div class="big-timer">${fmtTime(state.remainingSec ?? step.duration)}</div>
      <div class="sub-label">Get into position</div>
    `;
  }

  function renderRest(step, state) {
    return `
      <div class="stage-label rest">REST</div>
      <div class="big-timer">${fmtTime(state.remainingSec ?? step.duration)}</div>
      <div class="sub-label">Next: ${step.nextExerciseName} — Set ${step.nextSetNumber} of ${step.nextTotalSets}</div>
      <div class="rest-btn-row">
        <button class="chip-btn" id="btnAdd15">+15 SEC</button>
        <button class="chip-btn" id="btnSkipRest">SKIP REST</button>
      </div>
    `;
  }

  function renderTimedExercise(step, state) {
    const ex = step.exercise;
    const sideLine = step.side ? `<div class="side-label">${step.side} SIDE</div>` : '';
    const setLine = step.totalSets > 1 ? `<div class="set-label">SET ${step.setNumber} OF ${step.totalSets}</div>` : '';
    return `
      <div class="exercise-media">${mediaPlaceholder(ex)}</div>
      <div class="exercise-name">${ex.name.toUpperCase()}</div>
      ${sideLine}${setLine}
      <div class="big-timer">${fmtTime(state.remainingSec ?? step.duration)}</div>
      ${ex.formCues && ex.formCues[0] ? `<div class="form-cue">${ex.formCues[0]}</div>` : ''}
    `;
  }

  function renderStrengthExercise(step, state) {
    const ex = step.exercise;
    const key = `${step.exerciseId}_${step.setNumber}_${step.side || ''}`;
    const prefill = lastActualReps[key] != null ? lastActualReps[key] : step.targetReps;
    const sideLine = step.side ? `<div class="side-label">${step.side} SIDE</div>` : '';
    const setLine = step.totalSets > 1 ? `<div class="set-label">SET ${step.setNumber} OF ${step.totalSets}</div>` : '';
    const showWeight = ex.equipment && ex.equipment.includes('plates');
    return `
      <div class="exercise-media">${mediaPlaceholder(ex)}</div>
      <div class="exercise-name">${ex.name.toUpperCase()}</div>
      ${sideLine}${setLine}
      <div class="target-reps">TARGET: ${step.targetReps > 0 ? step.targetReps + ' REPS' : (step.duration ? step.duration + ' SEC' : '—')}</div>
      <div class="reps-input-row">
        <label>Actual reps</label>
        <div class="stepper">
          <button class="stepper-btn" id="repMinus">−</button>
          <input type="number" id="repInput" value="${prefill}" inputmode="numeric" />
          <button class="stepper-btn" id="repPlus">+</button>
        </div>
        ${showWeight ? `<label>Weight (kg)</label><input type="number" id="weightInput" value="0" inputmode="decimal" step="0.5" />` : ''}
      </div>
      <div class="difficulty-row">
        <button class="diff-btn" data-diff="EASY">EASY</button>
        <button class="diff-btn" data-diff="MODERATE">MODERATE</button>
        <button class="diff-btn" data-diff="HARD">HARD</button>
        <button class="diff-btn" data-diff="FAILURE">FAILURE</button>
      </div>
      <button class="log-set-btn" id="btnLogSet">✓ DONE — LOG SET</button>
    `;
  }

  function mediaPlaceholder(ex) {
    const initials = ex.name.split(' ').slice(0, 2).map(w => w[0]).join('');
    return `<div class="media-placeholder" aria-hidden="true">${initials}</div>`;
  }

  let selectedDifficulty = null;

  function bindControls(step) {
    const $ = (id) => container.querySelector('#' + id);
    if ($('btnEnd')) $('btnEnd').onclick = confirmEnd;
    if ($('btnPrev')) $('btnPrev').onclick = () => engine.previous();
    if ($('btnPause')) $('btnPause').onclick = () => { engine.status === 'PAUSED' ? engine.resume() : engine.pause(); };
    if ($('btnSkip')) $('btnSkip').onclick = () => engine.skip();
    if ($('btnRestart')) $('btnRestart').onclick = () => engine.restartExercise();
    if ($('btnAdd15')) $('btnAdd15').onclick = () => { engine.stepEndsAt += 15000; engine.notify(); };
    if ($('btnSkipRest')) $('btnSkipRest').onclick = () => engine.skip();

    if ($('repInput')) {
      $('repMinus').onclick = () => { $('repInput').value = Math.max(0, (+$('repInput').value || 0) - 1); };
      $('repPlus').onclick = () => { $('repInput').value = (+$('repInput').value || 0) + 1; };
    }
    if ($('btnLogSet')) {
      selectedDifficulty = null;
      container.querySelectorAll('.diff-btn').forEach(btn => {
        btn.onclick = () => {
          container.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedDifficulty = btn.dataset.diff;
        };
      });
      $('btnLogSet').onclick = () => {
        const reps = +($('repInput') ? $('repInput').value : 0) || 0;
        const weight = $('weightInput') ? (+$('weightInput').value || 0) : 0;
        const key = `${step.exerciseId}_${step.setNumber}_${step.side || ''}`;
        lastActualReps[key] = reps;
        engine.logSet(reps, weight, selectedDifficulty);
      };
    }
  }

  function confirmEnd() {
    const state = engine.getState();
    const elapsed = fmtTime(engine.getElapsedSeconds());
    const planned = fmtTime(engine._plannedDuration);
    const done = engine.completedExercises.size;
    const total = routine.exercises.length;
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal">
        <h3>End workout?</h3>
        <div class="modal-stats">
          <div>Completed: <strong>${elapsed}</strong></div>
          <div>Planned: <strong>${planned}</strong></div>
          <div>Exercises: <strong>${done}/${total}</strong></div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" id="mKeep">KEEP TRAINING</button>
          <button class="btn-danger" id="mEnd">END & SAVE</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#mKeep').onclick = () => modal.remove();
    modal.querySelector('#mEnd').onclick = () => {
      modal.remove();
      engine.end('user');
      App.navigate('#/home');
    };
  }

  function renderComplete(state) {
    const summary = engine.getSummary('completed');
    App.getHeightSessionExtras(summary).then(extra => {
      const isHeight = routine.category === 'HEIGHT' || routine.category === 'EVENING_YOGA' || routine.category === 'NIGHT';
      container.innerHTML = `
        <div class="player complete-screen safe-top safe-bottom">
          <div class="complete-title">WORKOUT COMPLETE</div>
          <div class="complete-routine">${routine.name}</div>
          <div class="complete-time">${fmtTime(summary.actualDuration)}</div>
          <div class="complete-grid">
            <div class="complete-stat"><div class="cs-val">${summary.completedExercises.length}/${summary.totalExercises}</div><div class="cs-label">Exercises</div></div>
            ${isHeight ? `
              <div class="complete-stat"><div class="cs-val">${extra.completionPct}%</div><div class="cs-label">Completion</div></div>
              <div class="complete-stat"><div class="cs-val">${fmtTime(extra.hangingSeconds)}</div><div class="cs-label">Hanging</div></div>
            ` : `
              <div class="complete-stat"><div class="cs-val">${extra.totalSets}</div><div class="cs-label">Sets</div></div>
              <div class="complete-stat"><div class="cs-val">${extra.totalReps}</div><div class="cs-label">Total Reps</div></div>
              <div class="complete-stat"><div class="cs-val">${extra.volumeKg} kg</div><div class="cs-label">Volume</div></div>
            `}
            <div class="complete-stat"><div class="cs-val">${extra.effortScore}/100</div><div class="cs-label">Effort</div></div>
          </div>
          <div class="complete-streak">🔥 ${extra.streak} Day Streak</div>
          <div class="complete-actions">
            <button class="btn-primary" id="cDone">DONE</button>
          </div>
        </div>`;
      container.querySelector('#cDone').onclick = () => { unmount(); App.navigate('#/home'); };
    });
  }

  return { mount, unmount };
})();

window.Player = Player;
