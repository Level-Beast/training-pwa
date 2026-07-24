// app.js — App-level logic: settings, daily plan, session persistence, progression, router.
const App = (() => {
  const DEFAULT_SETTINGS = {
    key: 'settings',
    theme: 'SYSTEM',
    voiceEnabled: true, countdown: true, formCues: true, restAnnouncements: true,
    soundEffects: true, vibration: true, rate: 1.0, voiceURI: null,
    heightUnit: 'cm', defaultTransition: 12, defaultRest: 45,
    keepScreenAwake: true,
    equipment: { bar: true, plates: true, mat: true, rope: true },
    plateWeights: [2.5, 5, 10],
    schedule: { 0: 'REST', 1: 'PUSH', 2: 'PULL', 3: 'LEGS', 4: 'PUSH', 5: 'PULL', 6: 'LEGS' },
  };

  let cachedSettings = null;

  async function getSettings() {
    if (cachedSettings) return cachedSettings;
    let s = await DB.get('settings', 'settings');
    if (!s) { s = Object.assign({}, DEFAULT_SETTINGS); await DB.put('settings', s); }
    cachedSettings = Object.assign({}, DEFAULT_SETTINGS, s);
    return cachedSettings;
  }
  async function saveSettings(patch) {
    const s = Object.assign({}, await getSettings(), patch);
    cachedSettings = s;
    await DB.put('settings', s);
    Voice.updateSettings(s);
    applyTheme(s.theme);
    return s;
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'DARK') root.setAttribute('data-theme', 'dark');
    else if (theme === 'LIGHT') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
  }

  async function getMeta(key, fallback) {
    const m = await DB.get('meta', key);
    return m ? m.value : fallback;
  }
  async function setMeta(key, value) { await DB.put('meta', { key, value }); }

  async function getExperimentStart() {
    let start = await getMeta('experimentStart', null);
    if (!start) { start = todayISO(); await setMeta('experimentStart', start); }
    return start;
  }

  function todayISO(d) { const dt = d || new Date(); return dt.toISOString().slice(0, 10); }
  function daysBetween(isoStart, isoEnd) {
    const a = new Date(isoStart + 'T00:00:00');
    const b = new Date(isoEnd + 'T00:00:00');
    return Math.round((b - a) / 86400000);
  }

  // ---- Daily plan: which routines are "today's" workouts ----
  async function getTodayPlan() {
    const start = await getExperimentStart();
    const today = todayISO();
    const dayNum = daysBetween(start, today); // 0-indexed day of experiment
    const weekday = new Date().getDay();
    const settings = await getSettings();
    const schedule = settings.schedule || DEFAULT_SETTINGS.schedule;
    const strengthType = schedule[weekday]; // 'PUSH' | 'PULL' | 'LEGS' | 'REST'
    const weekIdx = Math.floor(dayNum / 7) % 2;

    const heightRoutineId = HEIGHT_ROUTINE_ORDER[((dayNum % 3) + 3) % 3];
    const eveningYogaId = EVENING_YOGA_ORDER[((dayNum % 3) + 3) % 3];
    let strengthRoutineId = null;
    if (strengthType === 'PUSH') strengthRoutineId = PUSH_VARIANTS[weekIdx];
    if (strengthType === 'PULL') strengthRoutineId = PULL_VARIANTS[weekIdx];
    if (strengthType === 'LEGS') strengthRoutineId = LEGS_VARIANTS[weekIdx];
    const sprintOrWalk = SPRINT_WALK_SCHEDULE[((dayNum % 2) + 2) % 2];

    return {
      dayNum: dayNum + 1, sprintOrWalk, heightRoutineId, strengthType, strengthRoutineId,
      eveningYogaId, nightRoutineId: 'night_recovery',
    };
  }

  // ---- Today's completion status (reads today's saved sessions) ----
  async function getTodaySessions() {
    const all = await DB.getAll('sessions');
    const today = todayISO();
    return all.filter(s => s.date === today);
  }

  function sessionCoversCategory(session, category) {
    return session.category === category && (session.status === 'completed' || session.status === 'partial');
  }

  // ---- Effort score (0-100). Never rewards merely opening the app. ----
  function computeEffortScore(session) {
    if (!session) return 0;
    const totalEx = session.totalExercises || 1;
    const completedRatio = Math.min(1, (session.completedExercises || []).length / totalEx);
    const durationRatio = session.plannedDuration ? Math.min(1, session.actualDuration / session.plannedDuration) : completedRatio;
    const skippedRatio = (session.skippedExercises || []).length / totalEx;
    let score = durationRatio * 40 + completedRatio * 45 + 15;
    score -= skippedRatio * 20;
    if (session.status === 'partial' && completedRatio < 0.3) score = Math.min(score, 35);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function effortLabel(score) {
    if (score >= 90) return 'VERY STRONG DAY';
    if (score >= 70) return 'SOLID EFFORT';
    if (score >= 45) return 'PARTIAL PROGRESS';
    if (score > 0) return 'LIGHT DAY';
    return 'NO TRAINING YET';
  }

  async function getDailyEffort(dateISO) {
    const all = await DB.getAll('sessions');
    const todays = all.filter(s => s.date === (dateISO || todayISO()) && s.category !== 'SPRINT_WALK');
    if (!todays.length) return 0;
    const sum = todays.reduce((acc, s) => acc + (s.effortScore != null ? s.effortScore : computeEffortScore(s)), 0);
    return Math.round(sum / todays.length);
  }

  // ---- Streak: consecutive days where the plan was followed (rest days count) ----
  async function getStreak() {
    const all = await DB.getAll('sessions');
    let streak = 0;
    let cursor = new Date();
    for (let i = 0; i < 400; i++) {
      const iso = todayISO(cursor);
      const weekday = cursor.getDay();
      const daySessions = all.filter(s => s.date === iso && s.category !== 'SPRINT_WALK');
      const settings = await getSettings();
      const isRestDay = (settings.schedule || DEFAULT_SETTINGS.schedule)[weekday] === 'REST';
      const hasMeaningfulSession = daySessions.some(s => (s.status === 'completed' || s.status === 'partial') && s.actualDuration > 120);
      if (hasMeaningfulSession || (isRestDay && i > 0)) {
        if (hasMeaningfulSession) streak++;
        // rest day with no session simply doesn't break streak, but doesn't increment either
      } else if (i === 0) {
        // today: no session yet is fine, don't break streak, just don't count today
      } else {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  // ---- Session recording ----
  async function finishWorkout(summary) {
    const effortScore = computeEffortScore(summary);
    const session = {
      id: 'sess_' + Date.now(), date: todayISO(new Date(summary.startedAt)), routineId: summary.routineId,
      routineName: summary.routineName, category: summary.category, startTime: summary.startedAt,
      endTime: summary.completedAt, plannedDuration: summary.plannedDuration, actualDuration: summary.actualDuration,
      completedExercises: summary.completedExercises, skippedExercises: summary.skippedExercises,
      totalExercises: summary.totalExercises, setsLog: summary.setsLog, effortScore, status: summary.status,
      completionPercent: Math.round((summary.completedExercises.length / summary.totalExercises) * 100),
    };
    await DB.put('sessions', session);
    return session;
  }

  async function markSprintWalk(type, status, durationMin) {
    const session = {
      id: 'sess_' + Date.now(), date: todayISO(), routineId: 'sprint_walk', routineName: type,
      category: 'SPRINT_WALK', startTime: Date.now(), endTime: Date.now(),
      plannedDuration: (durationMin || 20) * 60, actualDuration: (durationMin || 0) * 60,
      completedExercises: status === 'completed' ? [type] : [], skippedExercises: status === 'skipped' ? [type] : [],
      totalExercises: 1, setsLog: [], effortScore: status === 'completed' ? 100 : 0, status,
      completionPercent: status === 'completed' ? 100 : 0,
    };
    await DB.put('sessions', session);
    return session;
  }

  // ---- Progressive overload ----
  async function recordStrengthSet(step, data) {
    const exerciseId = step.exerciseId;
    let rec = await DB.get('strengthProgress', exerciseId);
    if (!rec) rec = { exerciseId, exerciseName: step.exercise.name, history: [], personalBest: 0 };
    const today = todayISO();
    let entry = rec.history.find(h => h.date === today);
    if (!entry) { entry = { date: today, sets: [] }; rec.history.push(entry); }
    entry.sets.push({ setNumber: step.setNumber, targetReps: step.targetReps, actualReps: data.actualReps, weight: data.weight, difficulty: data.difficulty });
    if (data.actualReps > rec.personalBest) rec.personalBest = data.actualReps;
    rec.history = rec.history.slice(-60);
    await DB.put('strengthProgress', rec);
    return rec;
  }

  function suggestNextTarget(rec) {
    if (!rec || !rec.history.length) return null;
    const last = rec.history[rec.history.length - 1];
    if (!last.sets.length) return null;
    const avgReps = last.sets.reduce((a, s) => a + (s.actualReps || 0), 0) / last.sets.length;
    const hardOrFailure = last.sets.some(s => s.difficulty === 'HARD' || s.difficulty === 'FAILURE');
    const allEasy = last.sets.every(s => s.difficulty === 'EASY');
    const targetReps = last.sets[0].targetReps || Math.round(avgReps);
    if (hardOrFailure) return { sets: last.sets.length, reps: targetReps, note: 'Repeat this target — build consistency first.' };
    if (avgReps >= targetReps && allEasy) return { sets: last.sets.length, reps: targetReps + 2, note: 'Great work — try a slightly higher target.' };
    if (avgReps >= targetReps) return { sets: last.sets.length, reps: targetReps + 1, note: 'Solid — small step up next time.' };
    return { sets: last.sets.length, reps: targetReps, note: 'Keep at this target until it feels consistent.' };
  }

  async function getStrengthHistory(exerciseId) { return DB.get('strengthProgress', exerciseId); }

  // ---- Height measurements ----
  async function addMeasurement(m) {
    const rec = Object.assign({ id: 'm_' + Date.now() }, m);
    await DB.put('measurements', rec);
    return rec;
  }
  async function getMeasurements() {
    const all = await DB.getAll('measurements');
    return all.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  }

  // ---- Height/hanging extras for completion screen ----
  async function getHeightSessionExtras(summary) {
    const isHeight = summary.category === 'HEIGHT' || summary.category === 'EVENING_YOGA' || summary.category === 'NIGHT';
    const effortScore = computeEffortScore(summary);
    const streak = await getStreak();
    if (isHeight) {
      const routine = ROUTINES[summary.routineId];
      let hangingSeconds = 0;
      routine.exercises.forEach(inst => {
        const ex = EX[inst.exerciseId];
        if (ex && ex.id.includes('hang')) hangingSeconds += (inst.duration || ex.duration || 0) * (inst.sets || 1);
      });
      return {
        effortScore, streak, hangingSeconds,
        completionPct: Math.round((summary.completedExercises.length / summary.totalExercises) * 100),
      };
    }
    const totalSets = summary.setsLog.length;
    const totalReps = summary.setsLog.reduce((a, s) => a + (s.actualReps || 0), 0);
    const volumeKg = Math.round(summary.setsLog.reduce((a, s) => a + (s.actualReps || 0) * (s.weight || 0), 0));
    return { effortScore, streak, totalSets, totalReps, volumeKg };
  }

  // ---- Crash recovery ----
  async function getActiveWorkout() { return DB.get('currentWorkout', 'active'); }

  // ---- Router ----
  const routes = {};
  function route(pattern, handler) { routes[pattern] = handler; }
  function navigate(hash) { if (location.hash === hash) { handleRoute(); } else { location.hash = hash; } }

  function matchRoute(hash) {
    const cleanHash = hash.split('?')[0];
    for (const pattern in routes) {
      const parts = pattern.split('/');
      const hparts = cleanHash.replace(/^#/, '').split('/');
      if (parts.length !== hparts.length) continue;
      const params = {};
      let ok = true;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith(':')) params[parts[i].slice(1)] = decodeURIComponent(hparts[i]);
        else if (parts[i] !== hparts[i]) { ok = false; break; }
      }
      if (ok) return { handler: routes[pattern], params };
    }
    return null;
  }

  let currentUnmount = null;
  function handleRoute() {
    if (currentUnmount) { try { currentUnmount(); } catch (e) {} currentUnmount = null; }
    const hash = location.hash || '#/home';
    const m = matchRoute(hash);
    updateNavActive(hash);
    if (m) currentUnmount = m.handler(m.params) || null;
    else routes['/home'](({}));
  }
  function setUnmount(fn) { currentUnmount = fn; }

  function updateNavActive(hash) {
    document.querySelectorAll('.bottom-nav a').forEach(a => {
      a.classList.toggle('active', hash.startsWith(a.getAttribute('href')));
    });
    const showNav = !hash.startsWith('#/player');
    const nav = document.getElementById('bottomNav');
    if (nav) nav.style.display = showNav ? '' : 'none';
  }

  async function init() {
    const settings = await getSettings();
    Voice.updateSettings(settings);
    applyTheme(settings.theme);
    window.addEventListener('hashchange', handleRoute);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    handleRoute();
  }

  return {
    getSettings, saveSettings, getTodayPlan, getTodaySessions, sessionCoversCategory,
    computeEffortScore, effortLabel, getDailyEffort, getStreak, finishWorkout, markSprintWalk,
    recordStrengthSet, suggestNextTarget, getStrengthHistory, addMeasurement, getMeasurements,
    getHeightSessionExtras, getActiveWorkout, route, navigate, setUnmount, init, todayISO, daysBetween,
    getExperimentStart,
  };
})();

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
