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

// Celestial map: zoom into a constellation, then open its tab
const starmap = document.querySelector(".starmap");
if (starmap) {
  starmap.querySelectorAll(".const").forEach(c => {
    c.addEventListener("click", e => {
      e.preventDefault();
      const vb = starmap.viewBox.baseVal;
      starmap.style.transformOrigin =
        (c.dataset.cx / vb.width * 100) + "% " + (c.dataset.cy / vb.height * 100) + "%";
      starmap.classList.add("zooming");
      setTimeout(() => {
        const href = c.getAttribute("href");
        if (href.startsWith("#")) {
          location.hash = href;
          starmap.classList.remove("zooming");
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
    const entry = document.getElementById(seal.dataset.entry);
    all.forEach(s => s.classList.toggle("active", s === seal));
    card.innerHTML = "";
    card.append(entry.querySelector(".entry-header").cloneNode(true),
                entry.querySelector(".entry-org").cloneNode(true),
                entry.querySelector("ul").cloneNode(true));
    const more = entry.querySelector(".entry-more");
    if (more) card.append(more.cloneNode(true));
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
