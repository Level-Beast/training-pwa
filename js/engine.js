// engine.js — Workout state machine. Steps are pre-flattened from the routine so timing,
// voice, pause/resume, skip, and crash recovery all operate on one predictable sequence.
// Timing is timestamp-based (never a decrementing setInterval variable) so it survives
// background throttling, screen sleep, and full app reload.

function buildSteps(routine, settings) {
  const steps = [];
  const totalExercises = routine.exercises.length;
  const defaultTransition = (settings && settings.defaultTransition) || 12;
  const defaultRest = (settings && settings.defaultRest) || 45;

  routine.exercises.forEach((instance, exIdx) => {
    const ex = EX[instance.exerciseId];
    if (!ex) return;
    const sets = instance.sets || 1;
    const transitionDuration = instance.transitionDuration != null ? instance.transitionDuration : defaultTransition;
    const restDuration = instance.restDuration != null ? instance.restDuration : defaultRest;
    const isStrength = ex.type === 'STRENGTH_REPS';
    const isSides = !!ex.sides;

    steps.push({
      kind: 'transition', id: `t_${exIdx}`, exerciseId: ex.id, exerciseName: ex.name,
      duration: transitionDuration, exerciseIndexOverall: exIdx + 1, totalExercises,
      nextTotalSets: sets, firstSide: isSides ? 'LEFT' : null,
    });

    for (let s = 1; s <= sets; s++) {
      if (isSides) {
        steps.push({
          kind: 'exercise', id: `e_${exIdx}_${s}_L`, exerciseId: ex.id, exercise: ex, side: 'LEFT',
          setNumber: s, totalSets: sets, duration: instance.duration || ex.duration || null,
          targetReps: instance.targetReps, useReps: isStrength || instance.useReps,
          exerciseIndexOverall: exIdx + 1, totalExercises,
        });
        steps.push({
          kind: 'transition', id: `ts_${exIdx}_${s}`, exerciseId: ex.id, exerciseName: ex.name,
          duration: 8, exerciseIndexOverall: exIdx + 1, totalExercises, isSideSwitch: true,
          setNumber: s, totalSets: sets,
        });
        steps.push({
          kind: 'exercise', id: `e_${exIdx}_${s}_R`, exerciseId: ex.id, exercise: ex, side: 'RIGHT',
          setNumber: s, totalSets: sets, duration: instance.duration || ex.duration || null,
          targetReps: instance.targetReps, useReps: isStrength || instance.useReps,
          exerciseIndexOverall: exIdx + 1, totalExercises,
        });
      } else {
        steps.push({
          kind: 'exercise', id: `e_${exIdx}_${s}`, exerciseId: ex.id, exercise: ex, side: null,
          setNumber: s, totalSets: sets, duration: instance.duration || ex.duration || null,
          targetReps: instance.targetReps, useReps: isStrength || instance.useReps,
          exerciseIndexOverall: exIdx + 1, totalExercises,
        });
      }
      const isLastSetOfExercise = s === sets;
      if (!isLastSetOfExercise) {
        steps.push({
          kind: 'rest', id: `r_${exIdx}_${s}`, exerciseId: ex.id, duration: restDuration,
          nextExerciseName: ex.name, nextSetNumber: s + 1, nextTotalSets: sets,
          exerciseIndexOverall: exIdx + 1, totalExercises,
        });
      }
    }
  });

  steps.forEach(st => { if (st.kind === 'exercise' && st.duration == null) st.estDuration = 25; });
  return steps;
}

class WorkoutEngine {
  constructor(routine, opts = {}) {
    this.routine = routine;
    this.settings = opts.settings || {};
    this.steps = buildSteps(routine, this.settings);
    this.stepIndex = -1;
    this.status = 'PREPARING';
    this.prevStatus = 'EXERCISE';
    this.startedAt = null;
    this.stepStartedAt = null;
    this.stepEndsAt = null;
    this.pausedAt = null;
    this.completedExercises = new Set();
    this.skippedExercises = new Set();
    this.setsLog = [];
    this.listeners = [];
    this.countdownFlags = {};
    this.tickHandle = null;
    this.onSetLogged = opts.onSetLogged || (() => {});
    this.onComplete = opts.onComplete || (() => {});
    this.onEnded = opts.onEnded || (() => {});
    this._plannedDuration = (routine.estimatedDuration || 20) * 60;
    this._totalStepUnits = this.steps.reduce((sum, s) => sum + (s.duration || s.estDuration || 20), 0);
  }

  on(fn) { this.listeners.push(fn); }
  notify() { this.listeners.forEach(fn => { try { fn(this.getState()); } catch (e) { console.error(e); } }); }

  start() {
    this.startedAt = Date.now();
    this._tick = this._tick.bind(this);
    this.tickHandle = setInterval(this._tick, 250);
    this.enterStep(0);
  }

  restoreSnapshot(snap) {
    this.startedAt = snap.startedAt;
    this.stepIndex = snap.stepIndex;
    this.stepStartedAt = snap.stepStartedAt;
    this.stepEndsAt = snap.stepEndsAt;
    this.pausedAt = snap.pausedAt;
    this.status = snap.status;
    this.prevStatus = snap.prevStatus || 'EXERCISE';
    this.completedExercises = new Set(snap.completedExercises || []);
    this.skippedExercises = new Set(snap.skippedExercises || []);
    this.setsLog = snap.setsLog || [];
    this.countdownFlags = {};
    this._tick = this._tick.bind(this);
    this.tickHandle = setInterval(this._tick, 250);
    this.notify();
  }

  currentStep() { return this.steps[this.stepIndex] || null; }

  enterStep(index) {
    if (index >= this.steps.length) { this._complete(); return; }
    this.stepIndex = index;
    const step = this.steps[index];
    this.stepStartedAt = Date.now();
    this.pausedAt = null;
    this.countdownFlags = {};
    const dur = step.duration != null ? step.duration : null;
    this.stepEndsAt = dur != null ? this.stepStartedAt + dur * 1000 : null;
    this.status = step.kind === 'rest' ? 'REST' : step.kind === 'transition' ? 'TRANSITION' : 'EXERCISE';
    this._announceEnter(step);
    this._persist();
    this.notify();
  }

  _tick() {
    if (this.status === 'PAUSED' || this.status === 'COMPLETED' || this.status === 'ENDED') { this.notify(); return; }
    const step = this.currentStep();
    if (!step) return;
    if (this.stepEndsAt != null) {
      const now = Date.now();
      const remainingMs = this.stepEndsAt - now;
      const remainingSec = Math.ceil(remainingMs / 1000);
      this._maybeAnnounceCountdown(step, remainingSec);
      if (remainingMs <= 0) {
        this._advanceFromTimedStep(step);
        return;
      }
    }
    this.notify();
  }

  _maybeAnnounceCountdown(step, remainingSec) {
    if (step.kind === 'exercise' && step.duration && step.duration >= 20) {
      if (remainingSec === 10 && !this.countdownFlags.ten) {
        this.countdownFlags.ten = true;
        Voice.speak('10 seconds remaining', { isCountdown: true });
      }
    }
    if ((step.kind === 'transition' || step.kind === 'rest') && remainingSec <= 3 && remainingSec > 0 && !this.countdownFlags.final) {
      this.countdownFlags.final = true;
      Voice.speak('3, 2, 1', { isCountdown: true });
      Voice.beepStart();
    }
    if (step.kind === 'rest' && remainingSec === 15 && !this.countdownFlags.restWarn) {
      this.countdownFlags.restWarn = true;
      Voice.speak('15 seconds left', { isRest: true, isCountdown: true });
    }
  }

  _advanceFromTimedStep(step) {
    if (step.kind === 'exercise') this._markExerciseStepDone(step);
    Voice.beepComplete();
    this.enterStep(this.stepIndex + 1);
  }

  _markExerciseStepDone(step) {
    const nextStep = this.steps[this.stepIndex + 1];
    const stillSameExercise = nextStep && nextStep.exerciseId === step.exerciseId &&
      ((nextStep.kind === 'transition' && nextStep.isSideSwitch) || nextStep.kind === 'rest' || (nextStep.kind === 'exercise' && nextStep.setNumber === step.setNumber));
    if (!stillSameExercise && !this.skippedExercises.has(step.exerciseId)) {
      this.completedExercises.add(step.exerciseId);
    }
  }

  pause() {
    if (this.status === 'PAUSED') return;
    this.prevStatus = this.status;
    this.pausedAt = Date.now();
    this.status = 'PAUSED';
    Voice.cancelAll();
    this._persist();
    this.notify();
  }

  resume() {
    if (this.status !== 'PAUSED') return;
    const pausedDuration = Date.now() - this.pausedAt;
    if (this.stepEndsAt != null) this.stepEndsAt += pausedDuration;
    this.pausedAt = null;
    this.status = this.prevStatus;
    this._persist();
    this.notify();
  }

  skip() {
    const step = this.currentStep();
    if (!step) return;
    Voice.cancelAll();
    if (step.kind === 'exercise') {
      this.skippedExercises.add(step.exerciseId);
      this.completedExercises.delete(step.exerciseId);
      let idx = this.stepIndex + 1;
      while (idx < this.steps.length && this.steps[idx].exerciseId === step.exerciseId) idx++;
      this.enterStep(idx);
    } else {
      this.enterStep(this.stepIndex + 1);
    }
  }

  previous() {
    Voice.cancelAll();
    const newIdx = Math.max(0, this.stepIndex - 1);
    this.enterStep(newIdx);
  }

  restartExercise() {
    const step = this.currentStep();
    if (!step) return;
    Voice.cancelAll();
    let start = this.stepIndex;
    while (start > 0 && this.steps[start - 1].exerciseId === step.exerciseId) start--;
    this.completedExercises.delete(step.exerciseId);
    this.skippedExercises.delete(step.exerciseId);
    this.setsLog = this.setsLog.filter(s => s.exerciseId !== step.exerciseId);
    this.enterStep(start);
  }

  logSet(actualReps, weight, difficulty) {
    const step = this.currentStep();
    if (!step || step.kind !== 'exercise') return;
    this.setsLog.push({
      exerciseId: step.exerciseId, exerciseName: step.exercise.name, setNumber: step.setNumber,
      side: step.side, targetReps: step.targetReps, actualReps, weight: weight || 0, difficulty: difficulty || null,
      timestamp: Date.now(),
    });
    this.onSetLogged(step, { actualReps, weight, difficulty });
    this._markExerciseStepDone(step);
    Voice.beepComplete();
    this.enterStep(this.stepIndex + 1);
  }

  end(reason) {
    Voice.cancelAll();
    clearInterval(this.tickHandle);
    this.status = 'ENDED';
    this.onEnded(this.getSummary('partial'));
    DB.delete('currentWorkout', 'active');
    this.notify();
  }

  _complete() {
    Voice.cancelAll();
    Voice.beepWorkoutComplete();
    Voice.speak('Workout complete. Great job.', { interrupt: true });
    clearInterval(this.tickHandle);
    this.status = 'COMPLETED';
    DB.delete('currentWorkout', 'active');
    this.onComplete(this.getSummary('completed'));
    this.notify();
  }

  getElapsedSeconds() {
    if (!this.startedAt) return 0;
    const end = (this.status === 'COMPLETED' || this.status === 'ENDED') ? (this._endedAt || Date.now()) : Date.now();
    return Math.floor((end - this.startedAt) / 1000);
  }

  getProgressPercent() {
    let done = 0;
    for (let i = 0; i < this.stepIndex; i++) {
      const s = this.steps[i];
      done += (s.duration || s.estDuration || 20);
    }
    const cur = this.steps[this.stepIndex];
    if (cur && cur.duration != null && this.stepStartedAt) {
      done += Math.min(cur.duration, (Date.now() - this.stepStartedAt) / 1000);
    }
    return Math.min(100, Math.round((done / this._totalStepUnits) * 100));
  }

  getSummary(status) {
    this._endedAt = Date.now();
    return {
      routineId: this.routine.id, routineName: this.routine.name, category: this.routine.category,
      startedAt: this.startedAt, completedAt: this._endedAt,
      plannedDuration: this._plannedDuration, actualDuration: this.getElapsedSeconds(),
      completedExercises: Array.from(this.completedExercises), skippedExercises: Array.from(this.skippedExercises),
      totalExercises: this.routine.exercises.length, setsLog: this.setsLog, status,
    };
  }

  getState() {
    const step = this.currentStep();
    let remainingSec = null;
    if (step && this.stepEndsAt != null) {
      remainingSec = this.status === 'PAUSED'
        ? Math.max(0, Math.ceil((this.stepEndsAt - this.pausedAt) / 1000))
        : Math.max(0, Math.ceil((this.stepEndsAt - Date.now()) / 1000));
    }
    return {
      status: this.status, step, stepIndex: this.stepIndex, totalSteps: this.steps.length,
      remainingSec, elapsedSec: this.getElapsedSeconds(), progressPercent: this.getProgressPercent(),
      nextStep: this.steps[this.stepIndex + 1] || null,
    };
  }

  _persist() {
    DB.put('currentWorkout', {
      key: 'active', routineId: this.routine.id, routineName: this.routine.name, category: this.routine.category,
      stepIndex: this.stepIndex, startedAt: this.startedAt, stepStartedAt: this.stepStartedAt,
      stepEndsAt: this.stepEndsAt, pausedAt: this.pausedAt, status: this.status, prevStatus: this.prevStatus,
      completedExercises: Array.from(this.completedExercises), skippedExercises: Array.from(this.skippedExercises),
      setsLog: this.setsLog, plannedDuration: this._plannedDuration,
    }).catch(() => {});
  }

  _announceEnter(step) {
    if (step.kind === 'transition') {
      if (step.isSideSwitch) {
        Voice.speak('Switch sides', { interrupt: true });
      } else {
        Voice.speak(`Next exercise: ${step.exerciseName}. Get into position.`, { interrupt: true });
      }
      return;
    }
    if (step.kind === 'rest') {
      Voice.speak(`Rest for ${step.duration} seconds.`, { isRest: true, interrupt: true });
      return;
    }
    if (step.kind === 'exercise') {
      const ex = step.exercise;
      const sideTxt = step.side ? (step.side === 'LEFT' ? 'Left side. ' : 'Right side. ') : '';
      const setTxt = step.totalSets > 1 ? `Set ${step.setNumber} of ${step.totalSets}. ` : '';
      if (step.useReps) {
        Voice.speak(`${ex.name}. ${sideTxt}${setTxt}Target: ${step.targetReps} reps.`, { interrupt: true });
      } else {
        Voice.speak(`${ex.name}. ${sideTxt}Hold for ${step.duration} seconds.`, { interrupt: true });
        if (ex.formCues && ex.formCues.length) {
          const cue = ex.formCues[0];
          setTimeout(() => { if (this.currentStep() === step) Voice.speak(cue, { isFormCue: true }); }, 2500);
        }
      }
    }
  }
}

window.WorkoutEngine = WorkoutEngine;
window.buildSteps = buildSteps;
