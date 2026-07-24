# Height & Training Coach (PWA)

A personal, installable, mobile-first training app: morning height experiment, evening strength +
yoga, night recovery, a full-screen voice-guided workout player, progressive overload tracking,
height measurements/graph, streaks, and an effort score — all stored **locally on your phone**
(IndexedDB), no account, no server, no build step.

Plain HTML/CSS/JavaScript — no React, no bundler. You can open `index.html` directly, run it with
any static file server, or publish it on GitHub Pages.

## What's implemented

- **Full workout player**: timers, transitions, rest, sets, left/right sides, pause/resume/skip/previous/restart, end-early confirmation with a real summary.
- **Timestamps, not `setInterval` countdowns** — timers survive the screen sleeping, the tab backgrounding, or a full page reload.
- **Crash/refresh recovery** — closing or refreshing mid-workout shows a "Resume" banner and restores your exact position.
- **Voice coaching** via the Web Speech `SpeechSynthesis` API, synced to workout state (never double-speaks on re-render), with a settings panel (on/off, countdown, form cues, rest announcements, speech rate, voice pick).
- **Synthesized beep/completion sounds** via the Web Audio API — no external audio files to download.
- **Progressive overload**: every strength set is logged (reps, weight, difficulty), stored per-exercise, and used to suggest the next session's target.
- **Height Experiment**: Day counter, starting/latest/change, add measurements, filterable trend chart (drawn on `<canvas>`, no chart library needed), full measurement list.
- **Home / Train / Progress / Experiment / More** — five-tab bottom navigation.
- **Effort Score (0–100)** based on actual completion, not just opening the app; daily aggregate + per-workout score on the completion screen.
- **Streak, week strip, 8-week heatmap, and stats** (training time, hanging time, sets, completion rate, etc.), all computed from real saved sessions.
- **Settings**: voice, sounds, vibration, screen-wake-lock, theme (system/light/dark), default rest/transition, height unit, equipment, plate weights, data export (JSON) and data reset.
- **True PWA**: manifest, service worker (offline app-shell caching), installable, safe-area-aware layout for notches/home indicators.

## Project structure

```
height-pwa/
  index.html          entry point, loads all scripts, bottom nav
  manifest.json        PWA manifest
  sw.js                 service worker (offline caching)
  css/style.css         all styling, light + dark themes
  js/db.js               IndexedDB wrapper
  js/data.js             exercise library + all seed routines
  js/voice.js             speech coaching + synthesized beeps
  js/engine.js            workout state machine / timer engine
  js/player.js             full-screen workout player UI
  js/app.js                 settings, scheduling, sessions, progression, router
  js/views.js               Home/Train/Progress/Experiment/More screens
  icons/                     placeholder app icons (192, 512, maskable 512)
```

## Development

No build tools required. From the project folder, run any static server, for example:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

or, with Node installed:

```bash
npx serve .
```

Open it on your phone (same Wi-Fi, `http://<your-computer-ip>:8080`) to test on mobile, or use your
browser's device-emulation mode. Voice coaching, wake lock, and vibration all require a **real
mobile browser** (or a desktop browser with speech support) to fully test — some features degrade
gracefully in emulators.

> Service workers only work over `https://` or `http://localhost` — that's expected during local dev.

## Production build

There isn't one — this **is** the production build. Just make sure the files stay together as-is.

## Deploying to GitHub Pages

1. Create a new GitHub repository (e.g. `training-pwa`) and push this folder's contents to the
   repository root (or to a `/docs` folder — either works, just set the right source below):

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. On GitHub: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, then
   pick branch `main` and folder `/ (root)` (or `/docs` if you used that).

3. GitHub will give you a URL like:
   `https://<your-username>.github.io/<your-repo>/`

4. **Important — this project already uses relative paths everywhere** (`./css/...`, `./js/...`,
   `./manifest.json`, service worker registered as `./sw.js`) specifically so it works correctly
   whether it's hosted at the domain root or in a subpath like `/your-repo/`. You shouldn't need to
   change anything.

5. Open the GitHub Pages URL on your phone, then:
   - **iPhone (Safari)**: Share → *Add to Home Screen*.
   - **Android (Chrome)**: menu (⋮) → *Install app* / *Add to Home Screen*.

6. Open it once while online so the service worker installs and caches the app shell. After that,
   the core workout experience (timers, voice, sets, recording, history) works with no internet
   connection.

### Updating the app later

Whenever you change any file in `js/`, `css/`, or `index.html`, bump `CACHE_VERSION` at the top of
`sw.js` (e.g. `height-training-v2`) so installed devices pick up the new version instead of serving
the old cached copy.

## Data & privacy

Everything (workout history, strength progression, height measurements, settings) is stored only in
your browser's IndexedDB, on your device. Nothing is sent to a server. Use **More → Data → Export
Data** to back it up as JSON, or **Clear All Data** to reset.

Uninstalling the PWA or clearing your browser's site data for this app will delete this data — export
first if you want a backup.

## Notes on the Height Experiment

This app records your own height measurements over time and shows the trend — it does not claim or
imply that any exercise here is proven to increase adult skeletal height. For useful data, measure at
a consistent time of day, in a consistent position (e.g. always first thing in the morning before
getting up, or always standing against the same wall in the evening).

## Extending it

- **Add an exercise**: add an entry to `EX` in `js/data.js`.
- **Add/edit a routine**: add or edit an entry in `ROUTINES` in `js/data.js` — reference exercises by
  id with `inst(...)` (timed) or `strengthInst(...)` (rep-based) helpers.
- **Change your weekly split**: More → Settings, or edit `DEFAULT_SETTINGS.schedule` in `js/app.js`.
- **Real exercise media**: replace the placeholder squares in `player.js`'s `mediaPlaceholder()` and
  `views.js`'s exercise detail media block with `<img>`/`<video>` tags pointing at files you add under
  a new `media/` folder — the engine and UI don't depend on any particular media source.
