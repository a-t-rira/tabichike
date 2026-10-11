import { watchCollaborativeTrip, saveCollaborativeItem, deleteCollaborativeItem, saveCollaborativePacking, deleteCollaborativePacking, saveCollaborativeExpense, deleteCollaborativeExpense, deleteCollaborativeTrip } from "../collab/repo.js";
import { getNickname, getTripChecks, updateTripSummary, removeJoinedTrip, storeTripChecks, upsertJoinedTrip } from "../collab/local.js";
import { renderTripDetail } from "./trip-detail.js";
import { toast } from "../utils/toast.js";
import { renderShiori } from "./shiori.js";
import { appRoot, escapeHTML } from "../utils/dom.js";
import { header } from "./common.js";
import { createId } from "../models.js";
import { loadData, saveData } from "../store.js";
import { getClient } from "../collab/client.js";

let unsubscribe = null;
let generation = 0;
let onlineHandler;

export function stopCollaborativeDetail() {
  generation++;
  unsubscribe?.(); unsubscribe = null;
  if (onlineHandler) { window.removeEventListener("online", onlineHandler); window.removeEventListener("offline", onlineHandler); onlineHandler = null; }
}

export function openCollaborativeDetail(tripId, tab = "itinerary", cachedSummary = null) {
  stopCollaborativeDetail();
  const current = ++generation;
  let latest;
  let uid;
  getClient().then((client) => { uid = client.uid; if (latest) { latest.isOwner = latest.ownerUid === uid; render(); } }).catch(() => {});
  const render = () => {
    if (!latest || current !== generation) return;
    const checks = getTripChecks(tripId);
    const trip = { ...latest, collaborative: true, packing: (latest.packing || []).map((item) => ({ ...item, checked: Boolean(checks[item.id]) })) };
    trip.isOwner = trip.ownerUid === uid || latest.isOwner || cachedSummary?.isOwner;
    updateTripSummary(trip);
    if (tab === "shiori") { renderShiori(trip); return; }
    const collaboration = {
      saveItem: (item) => saveCollaborativeItem(tripId, item, getNickname()),
      deleteItem: (itemId) => deleteCollaborativeItem(tripId, itemId, getNickname()),
      savePacking: (item) => saveCollaborativePacking(tripId, item, getNickname()),
      deletePacking: (itemId) => deleteCollaborativePacking(tripId, itemId, getNickname()),
      saveExpense: (item) => saveCollaborativeExpense(tripId, item, getNickname()),
      deleteExpense: (itemId) => deleteCollaborativeExpense(tripId, itemId, getNickname()),
      isOwner: trip.isOwner,
      leave: () => removeJoinedTrip(tripId),
      restore: () => { upsertJoinedTrip(trip); storeTripChecks(trip.id, Object.fromEntries((trip.packing || []).filter((item) => item.checked).map((item) => [item.id, true]))); },
      copySolo: () => copyToSolo(trip),
      deleteTrip: () => deleteCollaborativeTrip(tripId, trip.ownerUid),
    };
    renderTripDetail(trip, tab, { schemaVersion: 1, trips: [trip] }, false, collaboration);
  };
  onlineHandler = render;
  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", onlineHandler);
  watchCollaborativeTrip(tripId, (trip, metadata = {}) => {
    if (current !== generation) return;
    if (!trip) {
      if (metadata.fromCache) {
        if (latest) render();
        else toast("共同旅行の情報をオフラインで読み込めませんでした");
        return;
      }
      const lastKnown = latest || cachedSummary;
      const checks = getTripChecks(tripId);
      removeJoinedTrip(tripId);
      stopCollaborativeDetail();
      showDeletedTrip(tripId, lastKnown, checks);
      return;
    }
    trip.isOwner = trip.ownerUid === uid || cachedSummary?.isOwner;
    latest = trip; render();
  }, () => {
    if (current === generation && !latest) toast("共同旅行を読み込めませんでした");
  }).then((unsubscribeFn) => {
    if (current !== generation) unsubscribeFn(); else unsubscribe = unsubscribeFn;
  }).catch(() => { if (current === generation) toast("共同旅行を読み込めませんでした"); });
}

function copyToSolo(trip) {
  const data = loadData();
  const now = new Date().toISOString();
  const copy = { ...trip, id: createId(), collaborative: false, isOwner: undefined, ownerUid: undefined, createdAt: now, updatedAt: now,
    items: (trip.items || []).map((item) => ({ ...item })),
    packing: (trip.packing || []).map((item) => ({ ...item, checked: Boolean(item.checked) })),
    expenses: (trip.expenses || []).map((item) => ({ ...item })),
  };
  delete copy.ownerUid; delete copy.collaborative; delete copy.isOwner;
  if (!saveData({ ...data, trips: [...data.trips, copy] })) return false;
  removeJoinedTrip(trip.id);
  toast("ひとりの旅行としてコピーしました");
  return true;
}

function showDeletedTrip(tripId, trip, checks) {
  const recoverable = trip ? { ...trip, packing: (trip.packing || []).map((item) => ({ ...item, checked: Boolean(checks[item.id]) })) } : null;
  appRoot().innerHTML = `<div class="app-shell">${header("共同旅行", { back: "#/" })}<main class="page-content"><section class="empty-state"><div class="empty-illustration" aria-hidden="true">🎫</div><p>この旅行は、つくった人によって削除されました</p>${recoverable ? `<button class="primary-button" type="button" data-recover>ひとりの旅行としてコピー</button>` : ""}<a class="secondary-button" href="#/">ホームへ</a></section></main></div>`;
  appRoot().querySelector("[data-recover]")?.addEventListener("click", () => {
    const data = loadData(); const now = new Date().toISOString();
    const copy = { ...recoverable, id: createId(), createdAt: now, updatedAt: now };
    delete copy.ownerUid; delete copy.collaborative; delete copy.isOwner;
    if (saveData({ ...data, trips: [...data.trips, copy] })) { toast("ひとりの旅行としてコピーしました"); location.hash = "#/"; }
    else toast("保存できませんでした。データを書き出して控えを取ってください");
  });
}
