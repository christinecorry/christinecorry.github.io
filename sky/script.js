document.getElementById("year").textContent = new Date().getFullYear();

// Tab switching (index page only)
const tabLinks = document.querySelectorAll(".tab-link");

const TAB_ALIASES = { songs: "curios", pictures: "curios", things: "curios" };

function showTab(name) {
  name = TAB_ALIASES[name] || name;
  const panel = document.getElementById("panel-" + name);
  if (!panel) return;
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  tabLinks.forEach(l => l.classList.toggle("active", l.dataset.tab === name));
  panel.classList.add("active");
}

if (tabLinks.length) {
  const fromHash = () => showTab((location.hash || "#home").slice(1));
  window.addEventListener("hashchange", fromHash);
  fromHash();
}

// Celestial map: pan and zoom the sky; dive into a constellation to open its tab
const starmap = document.querySelector(".starmap");
if (starmap) {
  const sky = document.getElementById("sky");
  const C = 500, RSKY = 452;
  let k = 1, tx = 0, ty = 0, kMin = 0.5, kMax = 9, kHome = 1;
  let dragged = false;

  const toView = (cx, cy) =>
    new DOMPoint(cx, cy).matrixTransform(starmap.getScreenCTM().inverse());

  function visibleRect() {
    const r = starmap.getBoundingClientRect();
    const p1 = toView(r.left, r.top), p2 = toView(r.right, r.bottom);
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
  }

  function apply() {
    if (!starmap.getBoundingClientRect().width) return;   // panel hidden
    const v = visibleRect();
    const cxv = (v.x1 + v.x2) / 2, cyv = (v.y1 + v.y2) / 2;
    // any point of the sky, rim included, may be brought to the window's
    // center — but the disc can never be pushed wholly off-screen
    const slack = k * RSKY;
    const dx = (k * C + tx) - cxv, dy = (k * C + ty) - cyv;
    const d = Math.hypot(dx, dy);
    if (d > slack) {
      const f = d ? slack / d : 0;
      tx = cxv + dx * f - k * C;
      ty = cyv + dy * f - k * C;
    }
    sky.setAttribute("transform", "translate(" + tx + " " + ty + ") scale(" + k + ")");
    starmap.style.setProperty("--lbl", Math.min(1, Math.sqrt(kHome / k)));
    starmap.classList.toggle("deep", k > 2.05 * kHome);
    starmap.classList.toggle("explored", k < 0.95 * kHome);
    starmap.classList.toggle("roaming", Math.abs(k - kHome) > 0.02 * kHome);
  }

  function home() {
    if (!starmap.getBoundingClientRect().width) return;   // panel hidden
    const v = visibleRect();
    kHome = Math.hypot((v.x2 - v.x1) / 2, (v.y2 - v.y1) / 2) / RSKY;
    kMin = Math.min(v.x2 - v.x1, v.y2 - v.y1) / (2 * 478);
    k = kHome;
    tx = (v.x1 + v.x2) / 2 - k * C;
    ty = (v.y1 + v.y2) / 2 - k * C;
    apply();
  }

  function zoomAt(px, py, factor) {
    const k2 = Math.min(kMax, Math.max(kMin, k * factor));
    const f = k2 / k;
    tx = px - f * (px - tx);
    ty = py - f * (py - ty);
    k = k2;
    apply();
  }

  starmap.addEventListener("wheel", e => {
    e.preventDefault();
    const p = toView(e.clientX, e.clientY);
    zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0022));
  }, { passive: false });

  const ptrs = new Map();
  let lastMid = null, lastDist = 0, moved = 0;
  starmap.addEventListener("pointerdown", e => {
    ptrs.set(e.pointerId, toView(e.clientX, e.clientY));
    moved = 0; dragged = false;
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      lastDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
    starmap.classList.add("dragging");
  });
  window.addEventListener("pointermove", e => {
    if (!ptrs.has(e.pointerId)) return;
    const p = toView(e.clientX, e.clientY), prev = ptrs.get(e.pointerId);
    ptrs.set(e.pointerId, p);
    if (ptrs.size === 1) {
      tx += p.x - prev.x; ty += p.y - prev.y;
      moved += Math.hypot(p.x - prev.x, p.y - prev.y);
      if (moved > 6 / k) dragged = true;
      apply();
    } else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      tx += mid.x - lastMid.x; ty += mid.y - lastMid.y;
      if (lastDist) zoomAt(mid.x, mid.y, dist / lastDist);
      lastMid = mid; lastDist = dist;
      dragged = true;
    }
  });
  const lift = e => {
    ptrs.delete(e.pointerId);
    lastDist = 0;
    if (!ptrs.size) starmap.classList.remove("dragging");
  };
  window.addEventListener("pointerup", lift);
  window.addEventListener("pointercancel", lift);
  starmap.addEventListener("dblclick", e => {
    e.preventDefault();
    const p = toView(e.clientX, e.clientY);
    zoomAt(p.x, p.y, 1.9);
  });
  window.addEventListener("resize", home);
  window.addEventListener("hashchange", () => requestAnimationFrame(() => {
    const p = document.getElementById("panel-home");
    if (p && p.classList.contains("active")) home();
  }));
  home();

  // every figure speaks on hover; the four nav constellations carry their page-head card
  const loreBox = document.querySelector(".map-lore-card");
  const showLore = g => {
    if (loreBox && g.dataset.lore) {
      loreBox.querySelector(".lore-name").textContent = g.dataset.name;
      loreBox.querySelector(".lore-text").textContent = g.dataset.lore;
      const door = g.querySelector(".const-label");
      loreBox.querySelector(".lore-hint").textContent = door ? "\u2726 click to explore " + door.textContent : "";
      loreBox.classList.add("show");
    }
    const lbl = starmap.querySelector('.cname[data-cid="' + g.dataset.cid + '"]');
    if (lbl) lbl.classList.add("lit");
  };
  const hideLore = () => {
    if (loreBox) loreBox.classList.remove("show");
    starmap.querySelectorAll(".cname.lit").forEach(l => l.classList.remove("lit"));
    starmap.querySelectorAll(".constel.lit").forEach(g => g.classList.remove("lit"));
  };
  starmap.querySelectorAll(".constel, .const").forEach(g => {
    g.addEventListener("mouseenter", () => showLore(g));
    g.addEventListener("mouseleave", hideLore);
  });
  // the names are hover targets too, and light their figures
  starmap.querySelectorAll(".cname").forEach(t => {
    const g = starmap.querySelector('.constel[data-cid="' + t.dataset.cid + '"]');
    if (!g) return;
    t.addEventListener("mouseenter", () => { g.classList.add("lit"); showLore(g); });
    t.addEventListener("mouseleave", hideLore);
  });

  starmap.querySelectorAll(".const").forEach(c => {
    c.addEventListener("click", e => {
      e.preventDefault();
      if (dragged) return;
      const scr = new DOMPoint(k * +c.dataset.cx + tx, k * +c.dataset.cy + ty)
        .matrixTransform(starmap.getScreenCTM());
      const r = starmap.getBoundingClientRect();
      starmap.style.transformOrigin = (scr.x - r.left) + "px " + (scr.y - r.top) + "px";
      starmap.classList.add("zooming");
      setTimeout(() => {
        const href = c.getAttribute("href");
        if (href.startsWith("#")) {
          location.hash = href;
          starmap.classList.remove("zooming");
          home();
        } else {
          location.href = href;
        }
      }, 480);
    });
  });
}

// Living-picture videos: silent loop, hover controls, play only when visible
const wraps = document.querySelectorAll(".video-wrap");
if (wraps.length) {
  const seen = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const w = e.target, v = w.querySelector("video");
      if (e.isIntersecting && !w.classList.contains("paused")) v.play().catch(() => {});
      else v.pause();
    });
  }, { threshold: 0.2 });

  wraps.forEach(w => {
    const v = w.querySelector("video");
    seen.observe(w);
    // non-looping clips play once, then hold on their last frame
    v.addEventListener("ended", () => w.classList.add("paused"));
    w.querySelector(".vbtn-play").addEventListener("click", () => {
      if (v.paused) {
        if (v.ended) v.currentTime = 0;
        w.classList.remove("paused");
        v.play().catch(() => {});
      } else { w.classList.add("paused"); v.pause(); }
    });
    w.querySelector(".vbtn-mute").addEventListener("click", () => {
      v.muted = !v.muted;
      w.classList.toggle("muted", v.muted);
    });
  });
}

// CV seals: hover or click an institution's seal to read the matching entry
const seals = document.getElementById("seals");
if (seals) {
  const card = document.getElementById("seal-card");
  const all = seals.querySelectorAll(".seal");
  let pinned = null;

  function show(seal) {
    all.forEach(s => s.classList.toggle("active", s === seal));
    card.innerHTML = "";
    seal.dataset.entry.split(" ").forEach(id => {
      const entry = document.getElementById(id);
      const wrap = document.createElement("div");
      wrap.className = "card-entry";
      [...entry.children].forEach(c => wrap.append(c.cloneNode(true)));
      card.append(wrap);
    });
    card.classList.add("show");
  }

  all.forEach(seal => {
    seal.addEventListener("mouseenter", () => { if (!pinned) show(seal); });
    seal.addEventListener("focus", () => { if (!pinned) show(seal); });
    seal.addEventListener("click", () => {
      if (pinned === seal) {
        pinned = null;
        seal.classList.remove("pinned");
      } else {
        if (pinned) pinned.classList.remove("pinned");
        pinned = seal;
        seal.classList.add("pinned");
        show(seal);
      }
    });
  });
  show(all[0]);
}

// Email links copy the address to the clipboard
document.querySelectorAll(".copy-email").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    const addr = a.dataset.email;
    navigator.clipboard.writeText(addr).then(() => {
      const orig = a.textContent;
      a.textContent = "copied";
      setTimeout(() => { a.textContent = orig; }, 1200);
    }).catch(() => { location.href = "mailto:" + addr; });
  });
});

// Song previews: the speaker arms them (a real click, so the browser allows
// sound); after that, hovering a song card plays a 30-second excerpt.
const songCards = document.querySelectorAll(".curio-song-card[data-preview]");
if (songCards.length) {
  const player = new Audio();
  player.preload = "none";
  let armed = false;
  let fade = null;
  const fadeTo = (target, then) => {
    clearInterval(fade);
    fade = setInterval(() => {
      const v = player.volume + (target > player.volume ? 0.07 : -0.07);
      if (Math.abs(v - target) < 0.07) {
        player.volume = target;
        clearInterval(fade);
        if (then) then();
      } else {
        player.volume = Math.min(1, Math.max(0, v));
      }
    }, 40);
  };
  const stop = () => {
    fadeTo(0, () => player.pause());
    songCards.forEach(c => c.classList.remove("playing"));
  };
  const play = card => {
    clearInterval(fade);
    songCards.forEach(c => c.classList.remove("playing"));
    player.src = card.dataset.preview;
    player.volume = 0;
    player.play().then(() => {
      card.classList.add("playing");
      fadeTo(0.6);
    }).catch(() => {});
  };
  songCards.forEach(card => {
    card.querySelector(".song-mute").addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      armed = !armed;
      document.body.classList.toggle("previews-on", armed);
      if (armed) play(card); else stop();
    });
    card.addEventListener("mouseenter", () => { if (armed) play(card); });
    card.addEventListener("mouseleave", () => { if (armed) stop(); });
  });
  player.addEventListener("ended", stop);
}
