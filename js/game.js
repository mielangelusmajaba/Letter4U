/* ============================================================
   Game — the state machine:
   start → hub → (travel → quiz → connect → memory) ×5 → finale
   ============================================================ */
(() => {
  const KEY = "constellation-of-us-progress";
  const N = CONFIG.constellations.length;
  const load = () => {
    try { return Math.min(N, parseInt(localStorage.getItem(KEY) || "0", 10) || 0); } catch (e) { return 0; }
  };
  const save = (n) => {
    try { localStorage.setItem(KEY, String(n)); } catch (e) { /* storage unavailable: progress just won't persist */ }
  };

  const canvas = document.getElementById("sky");
  let progress = load();
  let state = "start";
  let conn = null; // { ci, path, step, dragging }

  Sky.init(canvas);
  for (let i = 0; i < progress; i++) Sky.completeInstant(i);
  UI.init();
  UI.renderHearts(progress, N);
  UI.setStartMode(progress > 0, progress >= N);
  UI.introStart();

  Sky.onFrame(() => {
    if (state === "hub" && progress < N) {
      // label below constellations in the top half, above those in the bottom half (clear of the button)
      const p = Sky.screenCenter(progress);
      const r = Sky.screenRadius(progress) * 1.15;
      UI.label(p.x, p.y < innerHeight / 2 ? p.y + r + 6 : p.y - r - 40);
    }
  });

  /* ---------- buttons ---------- */
  document.getElementById("begin").addEventListener("click", async () => {
    if (state !== "start") return;
    state = "intro";
    await UI.hideStart();
    UI.showHud();
    if (progress >= N) finale();
    else goHub();
  });
  document.getElementById("restart").addEventListener("click", () => {
    save(0);
    location.reload();
  });
  document.getElementById("cta").addEventListener("click", visit);
  document.getElementById("replay").addEventListener("click", () => {
    save(0);
    location.reload();
  });

  /* ---------- flow ---------- */
  function goHub() {
    state = "hub";
    Sky.setHub(progress);
    Sky.go({ type: "overview" }, 1600).then(() => {
      if (state !== "hub") return;
      UI.cta(progress === 0 ? "Visit the first star ✨" : `Visit star ${progress + 1} of ${N} ✨`);
      UI.showLabel(true);
    });
  }

  async function visit() {
    if (state !== "hub") return;
    state = "travel";
    UI.hideCta();
    UI.showLabel(false);
    Sky.setHub(-1);
    const ci = progress;
    const c = CONFIG.constellations[ci];
    await Sky.go({ type: "focus", ci }, 1800);

    if (c.quiz && c.quiz.options && c.quiz.options.length) {
      state = "quiz";
      await UI.quiz(c.quiz, ci + 1, N);
    }

    Sky.wake(ci);
    Sky.setParallax(false);
    state = "connect";
    conn = { ci, path: Sky.path(ci), step: 0, dragging: false };
    Sky.setPulse(ci, conn.path[0]);
    UI.toast("Tap the glowing star to begin ✨");
  }

  function advance() {
    const { ci, path } = conn;
    const si = path[conn.step];
    if (conn.step > 0) Sky.addSegment(ci, path[conn.step - 1], si);
    Sky.lightStar(ci, si);
    conn.step++;
    if (conn.step === 1) UI.toast("Now follow the glowing stars 💫<small>tap each one, or drag between them</small>", 4500);
    if (conn.step >= path.length) finishConstellation();
    else Sky.setPulse(ci, path[conn.step]);
  }

  async function finishConstellation() {
    const ci = conn.ci;
    conn = null;
    Sky.clearRubber();
    state = "memory";
    Sky.setPulse(ci, -1);
    UI.hideToast();
    await UI.wait(450);
    Sky.celebrate(ci);
    const p = Sky.screenCenter(ci);
    UI.sparkle(p.x / innerWidth, p.y / innerHeight, 70);
    await UI.title(CONFIG.constellations[ci].name);
    await UI.memory(CONFIG.constellations[ci].memory || {}, ci);
    Sky.setParallax(true);
    progress = ci + 1;
    save(progress);
    UI.renderHearts(progress, N, true);
    if (progress >= N) finale();
    else goHub();
  }

  async function finale() {
    state = "finale";
    UI.hideCta();
    UI.showLabel(false);
    Sky.setHub(-1);
    await Sky.go({ type: "overview", pad: 1.15 }, 2200);
    UI.toast("look… the stars are connecting 🌌");
    await Sky.linkAll();
    await UI.wait(900);
    UI.toast("something is falling from the sky…");
    await Sky.shootingStar();
    UI.hideToast();
    await UI.envelope();
    UI.letter(CONFIG.letter, CONFIG.fromName);
  }

  /* ---------- pointer input (mouse + touch) ---------- */
  const radius = (e) => (e.pointerType === "touch" ? 46 : 34);

  canvas.addEventListener("pointerdown", (e) => {
    if (state === "hub") {
      const p = Sky.screenCenter(progress);
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < Sky.screenRadius(progress) * 1.3) visit();
      return;
    }
    if (state !== "connect" || !conn) return;
    const R = radius(e);
    const target = conn.path[conn.step];
    const last = conn.step > 0 ? conn.path[conn.step - 1] : -1;
    const grab = () => {
      conn.dragging = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    };
    if (Sky.distToStar(conn.ci, target, e.clientX, e.clientY) < R) {
      advance();
      if (conn) grab();
    } else if (last >= 0 && Sky.distToStar(conn.ci, last, e.clientX, e.clientY) < R) {
      grab();
    } else if (Sky.nearestStar(conn.ci, e.clientX, e.clientY, R) !== -1) {
      Sky.nudge(conn.ci, target);
      UI.toast("follow the glowing star 💫", 1800);
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (!conn || !conn.dragging || conn.step === 0) return;
    Sky.setRubber(conn.ci, conn.path[conn.step - 1], e.clientX, e.clientY);
    const target = conn.path[conn.step];
    if (Sky.distToStar(conn.ci, target, e.clientX, e.clientY) < radius(e) * 0.85) {
      advance();
      if (conn) Sky.setRubber(conn.ci, conn.path[conn.step - 1], e.clientX, e.clientY);
    }
  });

  const release = () => {
    if (conn) conn.dragging = false;
    Sky.clearRubber();
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
})();
