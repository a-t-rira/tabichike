import { durationLabel } from "../models.js";
import { escapeHTML } from "../utils/dom.js";
import { formatShortDate, localDateString, dayDifference } from "../utils/date.js";
import { header } from "./common.js";
import { toast } from "../utils/toast.js";

const PACKING_CATEGORIES = [["valuables", "貴重品"], ["devices", "電子機器"], ["clothes", "衣類"], ["toiletries", "洗面・衛生"], ["other", "その他"]];
const ROUTE_COLORS = { move: "#3BA7E0", sight: "#FF6B3D", food: "#E8A317", stay: "#7B6CD9", other: "#7A7F8C" };

export function renderShiori(trip) {
  const shortId = String(trip.id || "").slice(0, 8).toUpperCase();
  const dates = tripDays(trip);
  const items = trip.items || [];
  const doneCount = items.filter((item) => item.done).length;
  const ended = trip.endDate < localDateString();
  const expensesTotal = (trip.expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const showTotal = (trip.expenses || []).length > 0;
  const hasBudgetPage = trip.budget != null || showTotal || Boolean(trip.memo?.trim());
  const mrzLineOne = padMrz(`P<TRAVEL<<${shortId}`);
  const mrzLineTwo = padMrz("TABICHIKE<<");
  const groupedItems = dates.map((date, index) => ({ date, index: index + 1, items: items.filter((item) => item.date === date).sort(compareItems) }));
  const itinerary = groupedItems.map((day) => `<div class="s-day"><div class="s-dh"><span class="d">DAY ${day.index}</span><span class="dt">${escapeHTML(formatShortDate(day.date).split("(")[0])}<small>(${escapeHTML(formatShortDate(day.date).split("(")[1]?.replace(")", "") || "")})</small></span></div>${day.items.length ? `<div class="rows">${day.items.map((item) => `<div class="row" style="--cc:${ROUTE_COLORS[item.category] || ROUTE_COLORS.other}"><span class="r-time ${item.time ? "" : "tbd"}">${item.time ? `${escapeHTML(item.time)}${item.endTime ? `〜${escapeHTML(item.endTime)}` : ""}` : "未定"}</span><span class="r-title">${escapeHTML(item.title)}${item.place ? `<span class="r-place">${escapeHTML(item.place)}</span>` : ""}</span>${item.done ? `<span class="mini-stamp">VISITED</span>` : `<span></span>`}</div>`).join("")}</div>` : `<div class="free">フリー</div>`}</div>`).join("");
  const packing = PACKING_CATEGORIES.map(([key, label]) => {
    const matching = (trip.packing || []).filter((item) => item.category === key);
    return matching.length ? `<div class="pk-g"><h3>${label}</h3><ul>${matching.map((item) => `<li>${escapeHTML(item.name)}</li>`).join("")}</ul></div>` : "";
  }).join("");
  const stampSummary = ended && doneCount > 0 ? `<div class="collected">スタンプ <b>${doneCount}/${items.length}</b> あつめました</div>` : "";
  const budgetMemo = hasBudgetPage ? `<section class="page shiori-end-page">${trip.budget != null || showTotal ? `<div class="ph"><span class="en">BUDGET</span><span class="ja">予算</span></div><div class="budget">${trip.budget != null ? `<div class="b-box"><div class="f-k">BUDGET<small>予算</small></div><div class="f-v">¥${Number(trip.budget).toLocaleString("ja-JP")}</div></div>` : ""}${showTotal ? `<div class="b-box"><div class="f-k">TOTAL<small>いまの合計</small></div><div class="f-v">¥${expensesTotal.toLocaleString("ja-JP")}</div></div>` : ""}</div>` : ""}${trip.memo?.trim() ? `<div class="ph memo-heading"><span class="en">MEMO</span><span class="ja">メモ</span></div><div class="memo">${escapeHTML(trip.memo.trim())}</div>` : ""}<div class="credit">たびチケでつくりました</div></section>` : `<div class="credit shiori-final-credit">たびチケでつくりました</div>`;

  appRootMarkup(trip, `
    <header class="top">
      <a class="icon-btn" href="#/trip/${encodeURIComponent(trip.id)}" aria-label="旅行詳細へ戻る"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></a>
      <h1>しおり</h1><span></span>
    </header>
    <div class="actions"><button class="act primary" type="button" data-print><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>印刷・PDF</button><button class="act" type="button" data-copy><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>テキストでコピー</button></div>
    <div class="pages">
      <section class="cover"><div><div class="cv-en">TRAVEL PASSPORT</div><div class="cv-ja">旅のしおり</div></div><svg class="emblem" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="50" cy="50" r="46" stroke-width="1"/><circle cx="50" cy="50" r="32"/><ellipse cx="50" cy="50" rx="14" ry="32"/><path d="M18 50h64M22 34h56M22 66h56M50 18v64"/><path d="M50 4l2.2 4.4L57 9l-3.5 3.3.9 4.7L50 14.8 45.6 17l.9-4.7L43 9l4.8-.6z" fill="currentColor" stroke="none"/><path d="M30 88h40" stroke-width="1"/></svg><div><div class="cv-title">${escapeHTML(trip.title)}</div><div class="cv-sub">${escapeHTML(formatLongDate(trip.startDate))} — ${escapeHTML(formatLongDate(trip.endDate))}</div></div></section>
      <section class="page info"><div class="info-head"><span class="t">PASSPORT<small>旅券</small></span><span class="no">No. ${escapeHTML(shortId)}</span></div><div class="fields"><div class="field full"><div class="f-k">DESTINATION<small>行き先</small></div><div class="f-v big">${escapeHTML(trip.destination || "")}</div></div><div class="field"><div class="f-k">DATE OF DEPARTURE<small>出発日</small></div><div class="f-v num">${shortDateWithWeekday(trip.startDate)}</div></div><div class="field"><div class="f-k">DATE OF RETURN<small>帰る日</small></div><div class="f-v num">${shortDateWithWeekday(trip.endDate)}</div></div><div class="field"><div class="f-k">DURATION<small>日数</small></div><div class="f-v">${escapeHTML(durationLabel(trip.startDate, trip.endDate))}</div></div>${trip.members?.length ? `<div class="field"><div class="f-k">TRAVELERS<small>メンバー</small></div><div class="f-v">${escapeHTML(trip.members.join("、"))}</div></div>` : ""}</div><div class="stamp bon"><i>たびチケ</i><b>BON VOYAGE</b><span>${escapeHTML(formatLongDate(trip.startDate))}</span></div><div class="mrz">${escapeHTML(mrzLineOne)}<br>${escapeHTML(mrzLineTwo)}</div></section>
      <section class="page shiori-itinerary"><div class="ph"><span class="en">ITINERARY</span><span class="ja">旅程</span></div>${itinerary}${stampSummary}<div class="page-no">— 3 —</div></section>
      <section class="page shiori-packing"><div class="ph"><span class="en">CHECKLIST</span><span class="ja">持ち物</span></div><div class="pk-groups">${packing}</div><div class="page-no">— 4 —</div></section>
      ${budgetMemo}
    </div>`);

  document.querySelector("[data-print]").addEventListener("click", () => window.print());
  document.querySelector("[data-copy]").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(plainText(trip, dates, items)); toast("コピーしました"); }
    catch { toast("コピーできませんでした"); }
  });
}

function appRootMarkup(trip, body) {
  const root = document.getElementById("app");
  root.innerHTML = `<div class="app-shell shiori-shell" style="--tc:var(--c-${escapeHTML(trip.color || "sunset")})"><div class="wrap shiori-view">${body}</div></div>`;
}

function tripDays(trip) {
  const length = Math.max(1, dayDifference(trip.startDate, trip.endDate) + 1);
  return Array.from({ length }, (_, index) => { const date = new Date(`${trip.startDate}T00:00:00`); date.setDate(date.getDate() + index); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; });
}
function compareItems(a, b) { return (a.time || "99:99").localeCompare(b.time || "99:99"); }
function formatLongDate(value) { if (!value) return ""; const [year, month, day] = value.split("-"); return `${year}.${month}.${day}`; }
function shortDateWithWeekday(value) { const date = new Date(`${value}T00:00:00`); const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]; return `<span>${date.getMonth()+1}/${date.getDate()}</span><small>(${weekday})</small>`; }
function padMrz(value) { return `${value}${"<".repeat(Math.max(0, 44 - value.length))}`; }

function plainText(trip, dates, items) {
  const lines = [`【${trip.title}】`, `📍${trip.destination || ""}　${formatShortDate(trip.startDate)}〜${formatShortDate(trip.endDate)}　${durationLabel(trip.startDate, trip.endDate)}`, ""];
  dates.forEach((date, index) => {
    lines.push(`■${index + 1}日目 ${formatShortDate(date)}`);
    const dayItems = items.filter((item) => item.date === date).sort(compareItems);
    if (!dayItems.length) lines.push("フリー");
    else dayItems.forEach((item) => lines.push(`${item.time ? `${item.time}${item.endTime ? `〜${item.endTime}` : ""}` : "未定"} ${item.title}`));
    lines.push("");
  });
  if (trip.packing?.length) lines.push("■持ち物", trip.packing.map((item) => item.name).join("、"), "");
  if (trip.memo?.trim()) lines.push("■メモ", trip.memo.trim());
  return lines.join("\n").trim();
}
