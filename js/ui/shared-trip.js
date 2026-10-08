import { appRoot } from "../utils/dom.js";
import { decodeSharePayload, createSharedPreviewTrip, createImportedTrip } from "../utils/share.js";
import { saveData } from "../store.js";
import { confirmDialog } from "../utils/dialog.js";
import { toast } from "../utils/toast.js";
import { renderShiori } from "./shiori.js";

export async function renderSharedTrip(token, data) {
  try {
    const payload = await decodeSharePayload(token);
    const trip = createSharedPreviewTrip(payload);
    renderShiori(trip, { shared: true, sharedAt: payload.sharedAt, onImport: () => importSharedTrip(payload, data) });
  } catch {
    renderInvalidShare();
  }
}

async function importSharedTrip(payload, data) {
  const alreadyImported = data.trips.some((trip) => trip.importedFrom?.sharedAt === payload.sharedAt && trip.importedFrom?.title === payload.trip.title);
  if (alreadyImported && !await confirmDialog({ title: "この旅行はもう取り込んでいます", message: "もう1つ別の旅行として追加しますか？", confirmLabel: "追加する" })) return;
  const trip = createImportedTrip(payload);
  if (!saveData({ ...data, trips: [...data.trips, trip] })) return;
  toast("旅行を取り込みました ✈️");
  location.hash = `#/trip/${encodeURIComponent(trip.id)}`;
}

function renderInvalidShare() {
  appRoot().innerHTML = `<div class="app-shell shiori-shell"><div class="wrap shiori-view"><header class="top"><a class="icon-btn" href="#/" aria-label="ホームへ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/></svg></a><h1>共有された旅行</h1><span></span></header><div class="empty-state share-invalid"><div class="empty-illustration" aria-hidden="true">🎫</div><p>このリンクは開けませんでした。リンクが途中で切れていないか、送ってくれた人に確認してください。</p><a class="primary-button" href="#/">ホームへ</a></div></div></div>`;
}
