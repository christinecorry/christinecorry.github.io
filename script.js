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
