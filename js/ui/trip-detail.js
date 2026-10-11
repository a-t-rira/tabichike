import { appRoot, escapeHTML } from "../utils/dom.js";
import { formatShortDate, localDateString, dayDifference } from "../utils/date.js";
import { durationLabel } from "../models.js";
import { header, tripStatus } from "./common.js";
import { confirmDialog } from "../utils/dialog.js";
import { renderItinerary } from "./tab-itinerary.js";
import { renderPacking } from "./tab-packing.js";
import { renderExpenses } from "./tab-expenses.js";
import { showTripShareSheet } from "./share-sheet.js";
import { showConversionSheet, showInviteSheet } from "./collab-sheet.js";
import { toast } from "../utils/toast.js";

const tabs = [["itinerary", "旅程", ""], ["packing", "持ち物", "packing"], ["expenses", "費用", "expenses"]];

export function renderTripDetail(trip, tab = "itinerary", data = null, autoScroll = true, collaborative = null) {
  const status = tripStatus(trip);
  const badge = status.kind === "future" ? `あと${status.days}日` : status.kind === "current" ? "旅行中！" : "";
  const packing = trip.packing || [];
  const checked = packing.filter((item) => item.checked).length;
  const menu = `<button class="icon-button" id="trip-menu" type="button" aria-label="旅行メニュー" aria-expanded="false"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button>`;
  const label = (key, text) => key === "packing" ? `${text} <small>${checked}/${packing.length}</small>` : key === "expenses" ? `${text} <small>${trip.expenses?.length || 0}</small>` : `${text} <small>${trip.items?.length || 0}</small>`;
  const rootData = data || { schemaVersion: 1, trips: [trip] };
  appRoot().innerHTML = `<div class="app-shell detail-page ${collaborative ? "is-collaborative" : ""}" style="--tc:var(--c-${escapeHTML(trip.color || "sunset")})">
    ${header(trip.title, { back: "#/", right: menu })}
    <main class="page-content detail-content">
      <div class="summary-band"><span class="summary-pin">${pinSvg()} </span><div class="summary-text"><strong>${escapeHTML(trip.destination || "行き先未設定")}</strong><small>${escapeHTML(formatShortDate(trip.startDate))}〜${escapeHTML(formatShortDate(trip.endDate))} · ${escapeHTML(durationLabel(trip.startDate, trip.endDate))}</small>${collaborative ? `<small class="collab-updated">👥 みんなで編集中 · ${escapeHTML(trip.updatedBy || "だれか")}が${escapeHTML(relativeUpdate(trip.updatedAt))}に更新</small>` : ""}</div>${badge ? `<span class="summary-status ${status.kind === "current" ? "is-now" : ""}">${badge}</span>` : ""}</div>${collaborative && !navigator.onLine ? `<div class="offline-band">オフラインです。つながったら自動で送ります</div>` : ""}
      <nav class="trip-tabs" aria-label="旅行の内容" role="tablist">${tabs.map(([key, text, suffix]) => `<a class="trip-tab" role="tab" href="#/trip/${encodeURIComponent(trip.id)}${suffix ? `/${suffix}` : ""}" aria-selected="${tab === key}">${label(key, text)}</a>`).join("")}</nav>
      <section id="tab-content" class="detail-tab-content"></section>
      <a class="primary-button shiori-link" href="#/trip/${encodeURIComponent(trip.id)}/shiori"><span aria-hidden="true">📖</span> しおりを見る</a>
    </main>
    <div id="trip-menu-popover" class="trip-menu-popover" hidden>${collaborative ? `<button type="button" id="invite-members">メンバーを招待</button><button type="button" id="leave-collab">この旅行から抜ける</button><button type="button" id="copy-collab">ひとりの旅行にもどす</button>${collaborative.isOwner ? `<button type="button" id="delete-collab" class="menu-danger">みんなの旅行を削除</button>` : ""}` : `<button type="button" id="enable-collab">みんなで編集する <small class="beta-label">BETA</small></button><a href="#/trip/${encodeURIComponent(trip.id)}/edit">旅行を編集</a>`}<button type="button" id="share-trip">旅行を共有</button><a href="#/trip/${encodeURIComponent(trip.id)}/shiori">しおりを見る</a>${collaborative ? "" : `<button type="button" id="delete-trip" class="menu-danger">この旅行を削除</button>`}</div>
  </div>`;
  const container = document.getElementById("tab-content");
  if (tab === "packing") renderPacking(trip, rootData, () => renderTripDetail(trip, tab, rootData, false, collaborative), container, collaborative);
  else if (tab === "expenses") renderExpenses(trip, rootData, () => renderTripDetail(trip, tab, rootData, false, collaborative), container, collaborative);
  else renderItinerary(trip, rootData, () => renderTripDetail(trip, tab, rootData, false, collaborative), container, autoScroll, collaborative);
  const button = document.getElementById("trip-menu");
  button.addEventListener("click", () => { const popover = document.getElementById("trip-menu-popover"); popover.hidden = !popover.hidden; button.setAttribute("aria-expanded", String(!popover.hidden)); });
  document.getElementById("share-trip").addEventListener("click", () => { document.getElementById("trip-menu-popover").hidden = true; showTripShareSheet(trip); });
  document.getElementById("invite-members")?.addEventListener("click", () => { document.getElementById("trip-menu-popover").hidden = true; showInviteSheet(trip.id, trip); });
  document.getElementById("leave-collab")?.addEventListener("click", async () => {
    if (!await confirmDialog({ title: "この旅行から抜けますか？", message: "ほかのメンバーの旅行は消えません。招待リンクがあれば、また参加できます。", confirmLabel: "抜ける" })) return;
    collaborative.leave(); location.hash = "#/";
  });
  document.getElementById("copy-collab")?.addEventListener("click", () => { if (collaborative.copySolo()) location.hash = "#/"; });
  document.getElementById("delete-collab")?.addEventListener("click", async () => {
    if (!await confirmDialog({ title: "この旅行を全員の端末から削除しますか？", message: "メンバー全員の画面からも消えます。元に戻せません。", confirmLabel: "削除する", danger: true })) return;
    collaborative.leave(); location.hash = "#/";
    collaborative.deleteTrip().catch(() => { collaborative.restore(); toast("いまサーバーが混み合っているため保存できませんでした。時間をおいてお試しください"); location.hash = `#/trip/${encodeURIComponent(trip.id)}`; });
  });
  document.getElementById("enable-collab")?.addEventListener("click", () => { document.getElementById("trip-menu-popover").hidden = true; showConversionSheet(trip); });
  document.getElementById("delete-trip")?.addEventListener("click", async () => {
    if (await confirmDialog({ title: "この旅行を削除しますか？", message: `「${trip.title}」の旅程・持ち物・費用がすべて消えます。元に戻せません。`, confirmLabel: "削除する", danger: true })) document.dispatchEvent(new CustomEvent("tabichike:delete-trip", { detail: trip.id }));
  });
}

function relativeUpdate(value) {
  if (!value) return "たった今";
  const milliseconds = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(milliseconds / 60000);
  return minutes < 1 ? "たった今" : minutes < 60 ? `${minutes}分前` : `${Math.floor(minutes / 60)}時間前`;
}

function pinSvg() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`; }
