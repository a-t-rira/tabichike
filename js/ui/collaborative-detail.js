import { watchCollaborativeTrip, saveCollaborativeItem, deleteCollaborativeItem } from "../collab/repo.js";
import { getNickname, getTripChecks, updateTripSummary } from "../collab/local.js";
import { renderTripDetail } from "./trip-detail.js";
import { toast } from "../utils/toast.js";
import { renderShiori } from "./shiori.js";

let unsubscribe = null;
let generation = 0;
let onlineHandler;

export function stopCollaborativeDetail() {
  generation++;
  unsubscribe?.(); unsubscribe = null;
  if (onlineHandler) { window.removeEventListener("online", onlineHandler); window.removeEventListener("offline", onlineHandler); onlineHandler = null; }
}

export function openCollaborativeDetail(tripId, tab = "itinerary") {
  stopCollaborativeDetail();
  const current = ++generation;
  let latest;
  const render = () => {
    if (!latest || current !== generation) return;
    const checks = getTripChecks(tripId);
    const trip = { ...latest, collaborative: true, packing: (latest.packing || []).map((item) => ({ ...item, checked: Boolean(checks[item.id]) })) };
    updateTripSummary(trip);
    if (tab === "shiori") { renderShiori(trip); return; }
    const collaboration = {
      saveItem: (item) => saveCollaborativeItem(tripId, item, getNickname()),
      deleteItem: (itemId) => deleteCollaborativeItem(tripId, itemId, getNickname()),
    };
    renderTripDetail(trip, tab, { schemaVersion: 1, trips: [trip] }, false, collaboration);
  };
  onlineHandler = render;
  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", onlineHandler);
  watchCollaborativeTrip(tripId, (trip) => {
    if (current !== generation) return;
    if (!trip) { stopCollaborativeDetail(); toast("この旅行は、つくった人によって削除されました"); location.hash = "#/"; return; }
    latest = trip; render();
  }, () => {
    if (current === generation && !latest) toast("共同旅行を読み込めませんでした");
  }).then((unsubscribeFn) => {
    if (current !== generation) unsubscribeFn(); else unsubscribe = unsubscribeFn;
  }).catch(() => { if (current === generation) toast("共同旅行を読み込めませんでした"); });
}
