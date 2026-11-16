/* ============================================================
   UI — screens, modals, memory cards, envelope & letter (anime.js)
   ============================================================ */
const UI = (() => {
  const $ = (id) => document.getElementById(id);
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const D = (ms) => (reduced ? 1 : ms);
  const show = (el) => el.classList.remove("hidden");
  const hide = (el) => el.classList.add("hidden");
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const WRONG = ["hmm, not quite 💕", "try again, cutie 🥺", "so close! 🌙", "nope~ think harder 😚"];
  const RIGHT = ["yes!! you remember ✨", "of course you knew 💗", "perfect 🌟"];
  let toastTimer = null;

  function init() {
    $("her-name").textContent = CONFIG.herName;
    $("start-title").textContent = CONFIG.intro.title;
    $("start-sub").textContent = CONFIG.intro.subtitle;
    document.title = CONFIG.intro.title;
  }

  function setStartMode(hasProgress, finished) {
    $("begin").textContent = finished ? "Open your letter 💌" : hasProgress ? "Continue ✨" : CONFIG.intro.button;
    $("restart").classList.toggle("hidden", !hasProgress);
  }

  function introStart() {
    anime
      .timeline({ easing: "easeOutCubic" })
      .add({ targets: ".start-card", opacity: [0, 1], translateY: [30, 0], duration: D(1200), delay: D(300) })
      .add(
        { targets: ".start-card > *", opacity: [0, 1], translateY: [12, 0], delay: anime.stagger(D(130)), duration: D(700) },
        "-=800"
      );
  }

  function hideStart() {
    return anime({ targets: "#start", opacity: 0, duration: D(700), easing: "easeInOutQuad" }).finished.then(() =>
      hide($("start"))
    );
  }

  function showHud() {
    show($("hud"));
    anime({ targets: "#hud", opacity: [0, 1], translateY: [-12, 0], duration: D(700), easing: "easeOutCubic" });
  }

  function renderHearts(n, total, animateLast) {
    const box = $("hearts");
    box.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const s = document.createElement("span");
      s.className = "heart" + (i < n ? " on" : "");
      s.textContent = "♥";
      box.appendChild(s);
    }
    if (animateLast && n > 0) {
      anime({ targets: box.children[n - 1], scale: [0.2, 1.5, 1], duration: D(1000), easing: "easeOutElastic(1, .5)" });
    }
  }

  function cta(text) {
    const b = $("cta");
    b.textContent = text;
    show($("cta-wrap"));
    anime({ targets: b, opacity: [0, 1], translateY: [20, 0], duration: D(600), easing: "easeOutCubic" });
  }
  const hideCta = () => hide($("cta-wrap"));

  function label(x, y) {
    $("hub-label").style.transform = `translate(${x}px, ${y}px) translate(-50%, 0)`;
  }
  function showLabel(on) {
    $("hub-label").classList.toggle("visible", on);
  }

  function toast(html, ms) {
    const el = $("toast");
    el.innerHTML = html;
    el.classList.add("show");
    clearTimeout(toastTimer);
    if (ms) toastTimer = setTimeout(hideToast, ms);
  }
  function hideToast() {
    clearTimeout(toastTimer);
    $("toast").classList.remove("show");
  }

  function openModal(el) {
    el.style.opacity = "1";
    show(el);
    anime({ targets: el, opacity: [0, 1], duration: D(400), easing: "linear" });
    anime({ targets: el.querySelector(".card"), opacity: [0, 1], scale: [0.85, 1], translateY: [20, 0], duration: D(700), easing: "easeOutBack" });
  }
  function closeModal(el) {
    return anime({ targets: el, opacity: [1, 0], duration: D(450), easing: "easeInQuad" }).finished.then(() => {
      hide(el);
      el.style.opacity = "";
    });
  }

  function quiz(q, num, total) {
    return new Promise((resolve) => {
      const modal = $("quiz");
      $("quiz-num").textContent = `${num} of ${total}`;
      $("quiz-q").textContent = q.q;
      $("quiz-feedback").textContent = "";
      const opts = $("quiz-options");
      opts.innerHTML = "";
      let done = false;
      q.options.forEach((text, i) => {
        const b = document.createElement("button");
        b.className = "option";
        b.textContent = text;
        b.addEventListener("click", () => {
          if (done) return;
          const ok = Array.isArray(q.answer) ? q.answer.includes(i) : i === q.answer;
          if (ok) {
            done = true;
            b.classList.add("right");
            $("quiz-feedback").textContent = pick(RIGHT);
            anime({ targets: b, scale: [1, 1.07, 1], duration: D(500), easing: "easeOutQuad" });
            const r = b.getBoundingClientRect();
            sparkle((r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight, 30);
            setTimeout(() => closeModal(modal).then(resolve), D(1100));
          } else {
            b.classList.add("wrong");
            b.disabled = true;
            $("quiz-feedback").textContent = pick(WRONG);
            anime({ targets: "#quiz .card", translateX: [0, -10, 10, -6, 6, 0], duration: D(450), easing: "easeInOutSine" });
          }
        });
        opts.appendChild(b);
      });
      openModal(modal);
      anime({ targets: "#quiz .option", opacity: [0, 1], translateY: [10, 0], delay: anime.stagger(D(90), { start: D(300) }), duration: D(500), easing: "easeOutQuad" });
    });
  }

  function title(name) {
    const el = $("const-title");
    el.innerHTML = `<small>you found</small>${name}`;
    show(el);
    return anime
      .timeline({ easing: "easeOutCubic" })
      .add({ targets: el, opacity: [0, 1], translateY: [16, 0], scale: [0.9, 1], duration: D(900) })
      .add({ targets: el, opacity: 0, translateY: -10, duration: D(600), easing: "easeInQuad" }, `+=${D(1200)}`)
      .finished.then(() => hide(el));
  }

  function memory(m, idx) {
    return new Promise((resolve) => {
      const img = $("mem-img"), fb = $("mem-fallback");
      fb.textContent = m.emoji || "💞";
      const fallback = () => { hide(img); show(fb); };
      show(img);
      hide(fb);
      // "images/Pic-1" (no extension) → try .png, .jpg, .jpeg, .webp in turn
      const base = m.photo || "";
      const candidates = !base ? [] : /\.\w{3,4}$/.test(base) ? [base] : [".png", ".jpg", ".jpeg", ".webp"].map((e) => base + e);
      let k = 0;
      const tryNext = () => (k < candidates.length ? (img.src = candidates[k++]) : fallback());
      img.onerror = tryNext;
      tryNext();
      $("mem-caption").textContent = m.caption || "";
      $("mem-caption").classList.toggle("long", (m.caption || "").length > 80);
      $("mem-date").textContent = m.date || "";
      const modal = $("memory");
      modal.style.opacity = "1";
      show(modal);
      anime({ targets: modal, opacity: [0, 1], duration: D(400), easing: "linear" });
      anime({
        targets: "#memory .polaroid",
        opacity: [0, 1], rotateY: [-100, 0], rotate: [-10, idx % 2 ? 2.5 : -2.5], scale: [0.75, 1],
        duration: D(1300), easing: "easeOutBack",
      });
      anime({ targets: "#mem-next", opacity: [0, 1], translateY: [12, 0], delay: D(1100), duration: D(500), easing: "easeOutQuad" });
      const btn = $("mem-next");
      btn.onclick = () => {
        btn.onclick = null;
        closeModal(modal).then(resolve);
      };
    });
  }

  function envelope() {
    return new Promise((resolve) => {
      const wrap = $("envelope-wrap");
      const env = $("envelope");
      show(wrap);
      let wiggle = null;
      anime
        .timeline()
        .add({ targets: env, translateY: ["-80vh", 0], rotate: [-16, 0], opacity: [0, 1], duration: D(1500), easing: "easeOutBounce" })
        .add({ targets: ".env-hint", opacity: [0, 1], translateY: [10, 0], duration: D(700), easing: "easeOutQuad" })
        .finished.then(() => {
          if (!reduced) wiggle = anime({ targets: env, rotate: [-2.5, 2.5], direction: "alternate", loop: true, duration: 1100, easing: "easeInOutSine" });
        });

      env.onclick = () => {
        env.onclick = null;
        if (wiggle) wiggle.pause();
        let flipped = false;
        anime
          .timeline({ easing: "easeInOutCubic" })
          .add({ targets: env, rotate: 0, duration: D(200) })
          .add({ targets: ".env-hint", opacity: 0, duration: D(300) }, 0)
          .add({ targets: ".env-seal", scale: [1, 1.3, 0], opacity: [1, 0], duration: D(500) })
          .add({
            targets: ".env-flap", rotateX: [0, 180], duration: D(800),
            update: (a) => { if (!flipped && a.progress > 50) { flipped = true; env.classList.add("open"); } },
          })
          .add({ targets: ".env-letter", translateY: ["0%", "-62%"], duration: D(1000), easing: "easeOutCubic" })
          .finished.then(() => wait(D(500)))
          .then(resolve);
      };
    });
  }

  function letter(L, fromName) {
    $("letter-greeting").textContent = L.greeting;
    const body = $("letter-body");
    body.innerHTML = "";
    (L.body || []).forEach((p) => {
      const el = document.createElement("p");
      el.className = "reveal";
      el.textContent = p;
      body.appendChild(el);
    });
    $("letter-signoff").textContent = L.signoff;
    $("letter-name").textContent = fromName;
    const ov = $("letter");
    show(ov);
    anime
      .timeline({ easing: "easeOutCubic" })
      .add({ targets: "#envelope-wrap", opacity: [1, 0], scale: [1, 1.1], duration: D(600), complete: () => hide($("envelope-wrap")) })
      .add({ targets: ov, opacity: [0, 1], duration: D(500) }, "-=300")
      .add({ targets: "#letter .paper", opacity: [0, 1], translateY: [60, 0], scale: [0.94, 1], duration: D(1100) })
      .add({ targets: "#letter .reveal", opacity: [0, 1], translateY: [12, 0], delay: anime.stagger(D(650)), duration: D(1000) })
      .add({ targets: "#replay", opacity: [0, 1], duration: D(600) });
    setTimeout(heartRain, D(900));
  }

  /* ---------- confetti ---------- */
  let heartShapes = null;
  function shapes() {
    if (heartShapes !== null) return heartShapes;
    try {
      heartShapes = [confetti.shapeFromText({ text: "💗", scalar: 2 }), confetti.shapeFromText({ text: "💕", scalar: 2 })];
    } catch (e) {
      heartShapes = false;
    }
    return heartShapes;
  }
  const COLORS = ["#F8C8D4", "#E89AAE", "#FFE7A8", "#FFF6EC", "#E7D8F0"];

  function sparkle(x, y, count = 40) {
    if (!window.confetti) return;
    confetti({
      particleCount: count, spread: 70, startVelocity: 22, ticks: 120, gravity: 0.6, scalar: 0.8,
      origin: { x, y }, colors: COLORS, shapes: ["star", "circle"], disableForReducedMotion: true,
    });
  }

  function heartRain() {
    if (!window.confetti) return;
    const s = shapes();
    const base = { particleCount: 35, spread: 75, startVelocity: 38, ticks: 260, scalar: s ? 2 : 1.1, colors: COLORS, disableForReducedMotion: true };
    if (s) base.shapes = s;
    confetti({ ...base, angle: 60, origin: { x: 0, y: 0.75 } });
    confetti({ ...base, angle: 120, origin: { x: 1, y: 0.75 } });
    setTimeout(() => confetti({ ...base, particleCount: 50, spread: 130, origin: { x: 0.5, y: 0.35 } }), 800);
  }

  return {
    init, setStartMode, introStart, hideStart, showHud, renderHearts, cta, hideCta, label, showLabel,
    toast, hideToast, quiz, title, memory, envelope, letter, sparkle, wait,
  };
})();
