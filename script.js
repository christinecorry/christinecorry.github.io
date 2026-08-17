document.getElementById("year").textContent = new Date().getFullYear();

// Tab switching (index page only)
const tabLinks = document.querySelectorAll(".tab-link");

function showTab(name) {
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
