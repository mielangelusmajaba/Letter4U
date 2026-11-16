/* ============================================================
   Sky — the three.js night sky: background stars, sparkles,
   constellation stars, glowing lines, camera moves.
   ============================================================ */
const Sky = (() => {
  const S = 2.4; // constellation radius in world units
  const LAYOUTS = {
    landscape: [[-8, 3.2], [0, 5.2], [8, 3.2], [-4.6, -2.9], [4.6, -2.9]],
    portrait: [[-2.3, 9.4], [2.3, 4.7], [-2.3, 0], [2.3, -4.7], [-0.4, -9.4]],
  };
  const LINK_ORDER = { landscape: [0, 1, 2, 4, 3, 0], portrait: [0, 1, 2, 3, 4] };
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const D = (ms) => (reduced ? 1 : ms);

  let renderer, scene, camera, starTex, lineTex, sparkles;
  const cons = [];
  const bg = [];
  const links = [];
  const cam = { x: 0, y: 0, z: 40 };
  const par = { x: 0, y: 0, tx: 0, ty: 0, on: true };
  let view = { type: "overview" };
  let layout = "";
  let rubber = null;
  let hubIdx = -1;
  let camAnim = null;
  let frameHook = null;
  const clock = new THREE.Clock();
  const v3 = new THREE.Vector3();
  const planeGeo = new THREE.PlaneGeometry(1, 1);
  planeGeo.translate(0.5, 0, 0); // origin at left edge so scale.x "grows" a line

  /* ---------- textures (generated on canvas, so no file loading) ---------- */
  function makeStarTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.1, "rgba(255,252,240,1)");
    grd.addColorStop(0.25, "rgba(255,228,190,0.6)");
    grd.addColorStop(0.55, "rgba(255,175,205,0.2)");
    grd.addColorStop(1, "rgba(255,175,205,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    // little sparkle cross
    const ray = (horizontal) => {
      const lg = horizontal ? g.createLinearGradient(0, 0, 128, 0) : g.createLinearGradient(0, 0, 0, 128);
      lg.addColorStop(0, "rgba(255,255,255,0)");
      lg.addColorStop(0.5, "rgba(255,255,255,0.85)");
      lg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = lg;
      horizontal ? g.fillRect(4, 63, 120, 2) : g.fillRect(63, 4, 2, 120);
    };
    ray(true);
    ray(false);
    const t = new THREE.CanvasTexture(c);
    return t;
  }

  function makeLineTexture() {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 64;
    const g = c.getContext("2d");
    const lg = g.createLinearGradient(0, 0, 0, 64);
    lg.addColorStop(0, "rgba(255,255,255,0)");
    lg.addColorStop(0.5, "rgba(255,255,255,1)");
    lg.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = lg;
    g.fillRect(0, 0, 4, 64);
    return new THREE.CanvasTexture(c);
  }

  /* ---------- glowing line segment ---------- */
  function makeSeg(parent, opts = {}) {
    const { core = 0xfff3da, glow = 0xffb3c6, coreW = 0.075, glowW = 0.45 } = opts;
    const g = new THREE.Group();
    const mk = (color, op) =>
      new THREE.Mesh(
        planeGeo,
        new THREE.MeshBasicMaterial({ map: lineTex, color, transparent: true, opacity: op, depthWrite: false })
      );
    const glowM = mk(glow, 0.5);
    const coreM = mk(core, 0.95);
    g.add(glowM, coreM);
    parent.add(g);
    return {
      g,
      set(a, b, p) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.max(Math.hypot(dx, dy) * p, 1e-4);
        g.position.set(a.x, a.y, -0.02);
        g.rotation.z = Math.atan2(dy, dx);
        coreM.scale.set(len, coreW, 1);
        glowM.scale.set(len, glowW, 1);
      },
      opacity(o) {
        coreM.material.opacity = 0.95 * o;
        glowM.material.opacity = 0.5 * o;
      },
      dispose() {
        parent.remove(g);
        coreM.material.dispose();
        glowM.material.dispose();
      },
    };
  }

  /* ---------- background ---------- */
  function makeBackground() {
    const palette = [0xffffff, 0xffffff, 0xffe7a8, 0xffc4d6, 0xe9d8ff].map((h) => new THREE.Color(h));
    for (let L = 0; L < 3; L++) {
      const n = 260;
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 150;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
        pos[i * 3 + 2] = -10 - L * 10 - Math.random() * 10;
        const c = palette[(Math.random() * palette.length) | 0];
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.55 + L * 0.3, map: starTex, vertexColors: true, transparent: true,
        depthWrite: false, opacity: 0.8, sizeAttenuation: true,
      });
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      bg.push({ pts, phase: L * 2.1, speed: 0.6 + L * 0.45 });
    }
    // drifting sparkles close to the camera
    const n = 80;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = -2 - Math.random() * 6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    sparkles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ size: 0.22, map: starTex, color: 0xffd6e2, transparent: true, depthWrite: false, opacity: 0.7 })
    );
    scene.add(sparkles);
  }

  /* ---------- constellations ---------- */
  function normalize(points) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(([x, y]) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const half = Math.max((maxX - minX) / 2, (maxY - minY) / 2) || 1;
    return points.map(([x, y]) => new THREE.Vector2(((x - cx) / half) * S, ((y - cy) / half) * S));
  }

  function buildConstellations() {
    CONFIG.constellations.forEach((d) => {
      const pts = normalize(d.points);
      const group = new THREE.Group();
      scene.add(group);
      const stars = pts.map((p) => {
        const s = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, opacity: 0.3 })
        );
        s.position.set(p.x, p.y, 0);
        s.userData = { phase: Math.random() * Math.PI * 2, pop: 0, lit: false };
        group.add(s);
        return s;
      });
      const path = (d.path && d.path.length ? d.path : pts.map((_, k) => k)).filter((k) => k < pts.length);
      cons.push({ group, pts, stars, path, segs: [], state: "dim", pulse: -1, glow: 0 });
    });
  }

  /* ---------- camera ---------- */
  function fitZ(hw, hh) {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return Math.max(hh / tan, hw / (tan * camera.aspect));
  }

  function viewTarget(v) {
    if (v.type === "focus" && cons[v.ci]) {
      const p = cons[v.ci].group.position;
      const r = S * 1.5;
      return { x: p.x, y: p.y, z: fitZ(r, r * 1.08) };
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    cons.forEach((c) => {
      const p = c.group.position;
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    });
    const pad = S * 1.35;
    const hw = (maxX - minX) / 2 + pad;
    const hh = ((maxY - minY) / 2 + pad) * 1.12; // room for the hearts HUD + bottom button
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: fitZ(hw, hh) * (v.pad || 1) };
  }

  function go(v, dur) {
    view = v;
    const tgt = viewTarget(v);
    if (camAnim) camAnim.pause();
    if (!dur || reduced) {
      Object.assign(cam, tgt);
      return Promise.resolve();
    }
    camAnim = anime({ targets: cam, x: tgt.x, y: tgt.y, z: tgt.z, duration: dur, easing: "easeInOutSine" });
    return camAnim.finished.then(() => {
      camAnim = null;
      Object.assign(cam, viewTarget(view)); // in case the window resized mid-flight
    });
  }

  function applyLayout() {
    const name = innerWidth / innerHeight < 0.85 ? "portrait" : "landscape";
    if (name === layout) return;
    layout = name;
    cons.forEach((c, i) => {
      const p = LAYOUTS[name][i] || [((i % 3) - 1) * 7, -9 - Math.floor(i / 3) * 6];
      c.group.position.set(p[0], p[1], 0);
    });
    links.forEach((s) => {
      const [A, B] = linkEndpoints(s.pair[0], s.pair[1]);
      s.set(A, B, 1);
    });
  }

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    applyLayout();
    if (!camAnim) Object.assign(cam, viewTarget(view));
  }

  /* ---------- render loop ---------- */
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const k = Math.min(1, dt * 3);
    par.x += ((par.on ? par.tx : 0) - par.x) * k;
    par.y += ((par.on ? par.ty : 0) - par.y) * k;
    camera.position.set(cam.x + par.x, cam.y + par.y, cam.z);
    camera.lookAt(cam.x, cam.y, 0);

    bg.forEach((b) => (b.pts.material.opacity = 0.62 + 0.28 * Math.sin(t * b.speed + b.phase)));
    const sp = sparkles.geometry.attributes.position;
    for (let i = 0; i < sp.count; i++) {
      let y = sp.getY(i) + dt * (0.25 + (i % 5) * 0.06);
      if (y > 30) y = -30;
      sp.setY(i, y);
      sp.setX(i, sp.getX(i) + Math.sin(t * 0.5 + i) * dt * 0.08);
    }
    sp.needsUpdate = true;

    const ease = Math.min(1, dt * 4);
    cons.forEach((c, ci) => {
      c.stars.forEach((s, si) => {
        const u = s.userData;
        const lit = u.lit || c.state === "done";
        let tgt = lit ? 1 : c.state === "dim" ? 0.6 : 0.85;
        if (ci === hubIdx) tgt = 1;
        s.material.opacity += (tgt - s.material.opacity) * ease;
        let sc = lit ? 0.62 : c.state === "dim" ? 0.48 : 0.55;
        sc *= 1 + 0.08 * Math.sin(t * 2.2 + u.phase);
        if (si === c.pulse) sc *= 1 + 0.6 * (0.5 + 0.5 * Math.sin(t * 5));
        if (ci === hubIdx) sc *= 1 + 0.3 * (0.5 + 0.5 * Math.sin(t * 3 - si * 0.5));
        if (c.state === "done") sc *= 1 + c.glow * 0.5;
        sc *= 1 + u.pop;
        s.scale.set(sc, sc, 1);
      });
    });

    if (frameHook) frameHook();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  /* ---------- public helpers ---------- */
  function init(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 300);
    starTex = makeStarTexture();
    lineTex = makeLineTexture();
    makeBackground();
    buildConstellations();
    resize();
    Object.assign(cam, viewTarget(view));
    cam.z *= 1.6; // start zoomed out a little; the first move drifts in
    window.addEventListener("resize", resize);
    if (window.matchMedia && matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", (e) => {
        par.tx = (e.clientX / innerWidth - 0.5) * 1.4;
        par.ty = -(e.clientY / innerHeight - 0.5) * 0.9;
      });
    }
    requestAnimationFrame(tick);
  }

  function toScreen(x, y, z) {
    v3.set(x, y, z).project(camera);
    return { x: ((v3.x + 1) / 2) * innerWidth, y: ((1 - v3.y) / 2) * innerHeight };
  }

  function starScreen(ci, si) {
    cons[ci].stars[si].getWorldPosition(v3);
    return toScreen(v3.x, v3.y, v3.z);
  }

  function screenCenter(ci) {
    const p = cons[ci].group.position;
    return toScreen(p.x, p.y, 0);
  }

  function screenRadius(ci) {
    const p = cons[ci].group.position;
    const a = toScreen(p.x, p.y, 0), b = toScreen(p.x + S, p.y, 0);
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function distToStar(ci, si, x, y) {
    const p = starScreen(ci, si);
    return Math.hypot(p.x - x, p.y - y);
  }

  function nearestStar(ci, x, y, R) {
    let best = -1, bd = R;
    cons[ci].stars.forEach((_, si) => {
      const d = distToStar(ci, si, x, y);
      if (d < bd) { bd = d; best = si; }
    });
    return best;
  }

  function screenToLocal(ci, x, y) {
    const ndc = new THREE.Vector3((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, 0.5).unproject(camera);
    const dir = ndc.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    const world = camera.position.clone().add(dir.multiplyScalar(dist));
    return cons[ci].group.worldToLocal(world);
  }

  function lightStar(ci, si) {
    const s = cons[ci].stars[si];
    s.userData.lit = true;
    s.material.color.setHex(0xfff0c8);
    anime({ targets: s.userData, pop: [0.9, 0], duration: D(800), easing: "easeOutElastic(1, .6)" });
  }

  function nudge(ci, si) {
    anime({ targets: cons[ci].stars[si].userData, pop: [0.7, 0], duration: D(700), easing: "easeOutElastic(1, .5)" });
  }

  function addSegment(ci, a, b) {
    const c = cons[ci];
    const A = c.pts[a], B = c.pts[b];
    const seg = makeSeg(c.group);
    c.segs.push(seg);
    const o = { p: 0 };
    seg.set(A, B, 0.001);
    return anime({ targets: o, p: 1, duration: D(420), easing: "easeOutQuad", update: () => seg.set(A, B, o.p) }).finished;
  }

  function setRubber(ci, fromSi, x, y) {
    const c = cons[ci];
    if (!rubber) {
      rubber = makeSeg(c.group, { core: 0xffffff, glow: 0xffc4d6, coreW: 0.05, glowW: 0.3 });
      rubber.opacity(0.55);
      rubber.ci = ci;
    }
    rubber.set(c.pts[fromSi], screenToLocal(ci, x, y), 1);
  }

  function clearRubber() {
    if (rubber) { rubber.dispose(); rubber = null; }
  }

  function wake(ci) { cons[ci].state = "awake"; }

  function celebrate(ci) {
    const c = cons[ci];
    c.state = "done";
    c.stars.forEach((s) => s.material.color.setHex(0xfff0c8));
    anime({ targets: c, glow: [1, 0], duration: D(2400), easing: "easeOutQuad" });
  }

  function completeInstant(ci) {
    const c = cons[ci];
    for (let k = 1; k < c.path.length; k++) {
      const seg = makeSeg(c.group);
      seg.set(c.pts[c.path[k - 1]], c.pts[c.path[k]], 1);
      c.segs.push(seg);
    }
    c.stars.forEach((s) => { s.userData.lit = true; s.material.color.setHex(0xfff0c8); });
    c.state = "done";
  }

  function linkEndpoints(i, j) {
    const a = cons[i], b = cons[j];
    let best = null, bd = Infinity;
    a.pts.forEach((p) => {
      b.pts.forEach((q) => {
        const A = { x: a.group.position.x + p.x, y: a.group.position.y + p.y };
        const B = { x: b.group.position.x + q.x, y: b.group.position.y + q.y };
        const d = (A.x - B.x) ** 2 + (A.y - B.y) ** 2;
        if (d < bd) { bd = d; best = [A, B]; }
      });
    });
    return best;
  }

  async function linkAll() {
    const order = (LINK_ORDER[layout] || []).filter((i) => i < cons.length);
    for (let k = 0; k < order.length - 1; k++) {
      const pair = [order[k], order[k + 1]];
      const seg = makeSeg(scene, { core: 0xffe7a8, glow: 0xffc4d6, coreW: 0.045, glowW: 0.3 });
      seg.opacity(0.75);
      seg.pair = pair;
      links.push(seg);
      const [A, B] = linkEndpoints(pair[0], pair[1]);
      const o = { p: 0 };
      seg.set(A, B, 0.001);
      await anime({ targets: o, p: 1, duration: D(650), easing: "easeInOutSine", update: () => seg.set(A, B, o.p) }).finished;
    }
    cons.forEach((_, i) => setTimeout(() => celebrate(i), i * 140));
  }

  function shootingStar() {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visH = cam.z * tan, visW = visH * camera.aspect;
    const start = { x: cam.x - visW * 0.95, y: cam.y + visH * 0.85 };
    const end = { x: cam.x + visW * 0.12, y: cam.y + visH * 0.05 };
    const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, color: 0xfff6dc }));
    const hs = cam.z * 0.09;
    head.scale.set(hs, hs, 1);
    scene.add(head);
    const trail = makeSeg(scene, { core: 0xfffbea, glow: 0xffc4d6, coreW: cam.z * 0.006, glowW: cam.z * 0.03 });
    const o = { p: 0, fade: 1 };
    const frame = () => {
      const x = start.x + (end.x - start.x) * o.p, y = start.y + (end.y - start.y) * o.p;
      const tp = Math.max(0, o.p - 0.35);
      const tx = start.x + (end.x - start.x) * tp, ty = start.y + (end.y - start.y) * tp;
      head.position.set(x, y, 0.1);
      trail.set({ x: tx, y: ty }, { x, y }, 1);
      trail.opacity(o.fade);
      head.material.opacity = o.fade;
    };
    frame();
    return anime({ targets: o, p: 1, duration: D(1500), easing: "easeInQuad", update: frame })
      .finished.then(() => anime({ targets: o, fade: 0, duration: D(600), easing: "easeOutQuad", update: frame }).finished)
      .then(() => {
        scene.remove(head);
        head.material.dispose();
        trail.dispose();
      });
  }

  return {
    init, go, wake, celebrate, completeInstant, lightStar, nudge, addSegment,
    setRubber, clearRubber, linkAll, shootingStar,
    screenCenter, screenRadius, distToStar, nearestStar, starScreen,
    path: (ci) => cons[ci].path,
    setPulse: (ci, si) => { cons[ci].pulse = si; },
    setHub: (ci) => { hubIdx = ci; },
    setParallax: (on) => { par.on = on; },
    onFrame: (fn) => { frameHook = fn; },
  };
})();
