import { loadData, saveData } from "./store.js";
import { renderHome } from "./ui/home.js";
import { renderTripForm } from "./ui/trip-form.js";
import { renderTripDetail } from "./ui/trip-detail.js";
import { toast } from "./utils/toast.js";
import { appRoot } from "./utils/dom.js";
import { confirmDialog } from "./utils/dialog.js";
import { renderSettings } from "./ui/settings.js";
import { renderShiori } from "./ui/shiori.js";

let data;
let lastRoute = "#/";

function route() {
  data = loadData();
  const hash = location.hash || "#/";
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  if (parts.length === 0) {
    lastRoute = "#/";
    window.onbeforeunload = null;
    renderHome(data);
    return;
  }
  if (parts[0] === "trip" && parts[1] === "new" && parts.length === 2) {
    lastRoute = hash;
    renderTripForm(data);
    return;
  }
  if (parts[0] === "settings" && parts.length === 1) {
    lastRoute = hash;
    window.onbeforeunload = null;
    renderSettings(data);
    return;
  }
  if (parts[0] === "trip" && parts.length === 3 && parts[2] === "edit") {
    lastRoute = hash;
    const found = renderTripForm(data, parts[1]);
    if (!found) missingTrip();
    return;
  }
  if (parts[0] === "trip" && parts.length >= 2) {
    const trip = data.trips.find((candidate) => candidate.id === parts[1]);
    if (!trip) { missingTrip(); return; }
    if (parts.length === 3 && parts[2] === "shiori") {
      lastRoute = hash;
      window.onbeforeunload = null;
      renderShiori(trip);
      return;
    }
    const tab = parts[2] === "packing" ? "packing" : parts[2] === "expenses" ? "expenses" : "itinerary";
    lastRoute = hash;
    window.onbeforeunload = null;
    renderTripDetail(trip, tab, data);
    return;
  }
  window.onbeforeunload = null;
  appRoot().innerHTML = `<div class="app-shell"><header class="app-header"><a class="icon-button" href="#/" aria-label="ホームへ戻る">‹</a><h1>たびチケ</h1><span></span></header></div>`;
}

function missingTrip() {
  window.onbeforeunload = null;
  location.hash = "#/";
  renderHome(data);
  toast("その旅行は見つかりませんでした");
}

window.addEventListener("hashchange", route);
document.addEventListener("tabichike:delete-trip", (event) => {
  data = { ...data, trips: data.trips.filter((trip) => trip.id !== event.detail) };
  saveData(data);
  location.hash = "#/";
  toast("旅行を削除しました");
});

document.addEventListener("click", async (event) => {
  const link = event.target.closest('a[href^="#/"]');
  const form = document.getElementById("trip-form");
  if (!form || !link) return;
  const changed = form.dataset.initialSnapshot !== JSON.stringify({
    title: document.getElementById("title").value,
    destination: document.getElementById("destination").value,
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    members: [...document.querySelectorAll("#member-list .tag")].map((tag) => tag.firstChild.textContent),
    memberDraft: document.getElementById("member-input").value,
    budgetText: document.getElementById("budget").value,
    color: document.querySelector('[data-color][aria-pressed="true"]')?.dataset.color,
    memo: document.getElementById("memo").value,
    basicPackingChecked: document.getElementById("basic-packing")?.checked ?? null,
  });
  if (!changed) return;
  event.preventDefault();
  const confirmed = await confirmDialog({ title: "入力中の内容は保存されません。戻りますか？", message: "", confirmLabel: "戻る" });
  if (confirmed) { window.onbeforeunload = null; location.hash = link.getAttribute("href"); }
});

route();

let serviceWorkerRegistration = null;
let hadServiceWorkerController = Boolean(navigator.serviceWorker?.controller);
let refreshingForUpdate = false;
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "UPDATE_AVAILABLE") return;
    toast("新しいバージョンがあります", "更新", () => {
      const waiting = serviceWorkerRegistration?.waiting;
      if (waiting) waiting.postMessage({ type: "SKIP_WAITING" });
      else location.reload();
    });
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadServiceWorkerController && !refreshingForUpdate) {
      refreshingForUpdate = true;
      location.reload();
    }
    hadServiceWorkerController = true;
  });
  navigator.serviceWorker.register("./sw.js").then((registration) => { serviceWorkerRegistration = registration; }).catch(() => {});
}
