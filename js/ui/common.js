import { durationLabel, TRIP_COLORS } from "../models.js";
import { dayDifference, formatShortDate, localDateString } from "../utils/date.js";
import { escapeHTML } from "../utils/dom.js";

export function header(title, { back = "", right = "" } = {}) {
  const cleanBack = back;
  return `<header class="app-header">
    <div class="header-side ${cleanBack ? "has-back" : ""}">${cleanBack ? `<a class="back-row" href="${cleanBack}" aria-label="戻る"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></a>` : ""}</div>
    <h1>${escapeHTML(title)}</h1>
    <div class="header-side">${right}</div>
  </header>`;
}

export function tripStatus(trip) {
  const today = localDateString();
  if (today < trip.startDate) return { kind: "future", days: dayDifference(today, trip.startDate) };
  if (today <= trip.endDate) return { kind: "current", day: dayDifference(trip.startDate, today) + 1 };
  return { kind: "past", days: dayDifference(trip.endDate, today) };
}

export function ticket(trip, { index = 0, interactive = true } = {}) {
  const status = tripStatus(trip);
  const planned = trip.items?.length ?? 0;
  const done = trip.items?.filter((item) => item.done).length ?? 0;
  let hash = 0;
  for (const character of trip.id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  const stops = [];
  let offset = 0;
  while (offset < 84) {
    hash = (hash * 1103515245 + 12345) >>> 0;
    const width = 1 + ((hash >>> 16) % 3);
    const gap = 1 + ((hash >>> 9) % 2);
    stops.push(`#fff ${offset}px ${offset + width}px`, `transparent ${offset + width}px ${offset + width + gap}px`);
    offset += width + gap;
  }
  const colorName = Object.hasOwn(TRIP_COLORS, trip.color) ? trip.color : "sunset";
  const barcode = `linear-gradient(90deg,${stops.join(",")})`;
  const stub = status.kind === "past"
    ? `<span class="s-k">ARRIVED</span><span class="s-big word">${escapeHTML(formatShortDate(trip.endDate).split("(")[0])}</span>`
    : status.kind === "current"
      ? `<span class="s-k">NOW</span><span class="s-big word">ON<br>TRIP</span>`
      : `<span class="s-k">DAYS TO GO</span><span class="s-big">${status.days}</span>`;
  const chips = [`<span class="chip">${escapeHTML(durationLabel(trip.startDate, trip.endDate))}</span>`];
  if (planned && status.kind !== "future") chips.push(`<span class="chip stamp-chip">● スタンプ ${done}/${planned}</span>`);
  const interactionAttributes = interactive ? `data-href="#/trip/${encodeURIComponent(trip.id)}" role="link" tabindex="0"` : "";
  const actionMenu = interactive ? `<details class="ticket-actions"><summary class="t-more" aria-label="${escapeHTML(trip.title)}のメニュー"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></summary>
            <div class="ticket-action-menu"><a href="#/trip/${encodeURIComponent(trip.id)}/edit">編集</a><button type="button" data-copy-trip="${escapeHTML(trip.id)}">複製</button><button type="button" data-delete-trip="${escapeHTML(trip.id)}">削除</button></div>
          </details>` : "";
  return `<article class="ticket-wrap ${status.kind === "past" ? "is-past" : ""}" style="--tc:var(--c-${colorName});--i:${index}" ${interactionAttributes} aria-label="${escapeHTML(trip.title)}の旅行詳細">
    <div class="ticket">
      <div class="t-main">
        <div class="t-top"><span class="t-label">BOARDING PASS</span>
          ${actionMenu}
        </div>
        <div class="t-dest">${escapeHTML(trip.destination || trip.title)}</div>
        ${trip.destination ? `<div class="t-title">${escapeHTML(trip.title)}</div>` : ""}
        <div class="t-dates"><div><span class="t-k">DEPART</span><span class="t-v">${escapeHTML(formatShortDate(trip.startDate).split("(")[0])}<small>(${escapeHTML(formatShortDate(trip.startDate).split("(")[1]?.replace(")", "") || "")})</small></span></div><div class="t-route" aria-hidden="true"></div><div><span class="t-k">RETURN</span><span class="t-v">${escapeHTML(formatShortDate(trip.endDate).split("(")[0])}<small>(${escapeHTML(formatShortDate(trip.endDate).split("(")[1]?.replace(")", "") || "")})</small></span></div></div>
        <div class="t-chips">${chips.join("")}</div>
      </div>
      <div class="t-stub">${stub}<span class="barcode" style="background:${barcode}" aria-hidden="true"></span></div>
    </div>
    ${status.kind === "past" ? `<div class="stamp"><b>VISITED</b><span>${escapeHTML(formatShortDate(trip.endDate).split("(")[0])}</span></div>` : ""}
  </article>`;
}

export function departureBoard(trips) {
  const today = localDateString();
  const sorted = [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const active = sorted.find((trip) => trip.startDate <= today && trip.endDate >= today);
  const next = active || sorted.find((trip) => trip.startDate > today);
  if (!next) return `<div class="board" data-href="#/trip/new" role="link" tabindex="0" aria-live="polite" aria-label="次の旅行を計画">
    ${boardTop()}<div class="board-head"><span>DESTINATION</span><span>STATUS</span></div>
    <div class="board-row"><div><div class="board-dest">NO DEPARTURES</div><div class="board-sub">これからの旅行はありません</div></div></div>
    <div class="board-cta">次の旅行を計画しよう <span aria-hidden="true">→</span></div></div>`;
  const status = tripStatus(next);
  const travelDay = status.kind === "current" ? status.day : 0;
  const preDeparture = status.kind === "future";
  const count = preDeparture ? String(status.days) : travelDay === 1 ? "TODAY" : String(travelDay);
  const small = !preDeparture;
  const unit = preDeparture ? `<span class="u-ja">日</span><span class="u-en">DAYS TO GO</span>` : travelDay === 1 ? "" : `<span class="u-ja">日目</span><span class="u-en">DAY ${travelDay} OF ${durationDays(next)}</span>`;
  const boardStatus = preDeparture ? "ON SCHEDULE" : travelDay === 1 ? "BOARDING" : "ON TRIP";
  const sub = preDeparture
    ? `${next.title} · ${formatShortDate(next.startDate).replace("/", "/")} 発`
    : travelDay === 1 ? `${next.title} · いってらっしゃい！` : `${next.title} · ${durationLabel(next.startDate, next.endDate)}`;
  return `<div class="board" data-href="#/trip/${encodeURIComponent(next.id)}" role="link" tabindex="0" aria-live="polite" aria-label="${escapeHTML(next.title)}の旅行詳細">
    ${boardTop()}<div class="board-head"><span>DESTINATION</span><span>STATUS</span></div>
    <div class="board-row"><div><div class="board-dest">${escapeHTML(next.destination || next.title)}</div><div class="board-sub">${escapeHTML(sub)}</div></div>
      <div class="board-status ${travelDay === 1 ? "blink" : ""}"><span class="dot"></span><span>${boardStatus}</span></div></div>
    <div class="board-count" ${travelDay === 1 ? "data-today" : ""}>${preDeparture ? '<div class="board-pre">あと</div>' : ""}<div class="flaps ${small ? "small" : ""}" data-flaps>${[...count].map((digit, i) => `<span class="flap ${preDeparture ? "tick" : ""}" style="animation-delay:${i * .05}s">${escapeHTML(digit)}</span>`).join("")}</div><div class="board-unit">${unit}</div></div>
  </div>`;
}

function durationDays(trip) {
  return Math.round((new Date(`${trip.endDate}T00:00:00`) - new Date(`${trip.startDate}T00:00:00`)) / 86400000) + 1;
}

function boardTop() {
  return `<div class="board-top"><span class="board-title"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.5 19h19v2h-19zM22.07 9.64c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.43-1.93.51 4.14 7.17-4.97 1.33-1.97-1.54-1.45.39 2.59 4.49L21 11.49c.81-.23 1.28-1.05 1.07-1.85z"/></svg><span class="ja">出発</span><span class="bar"></span><span class="en">DEPARTURES</span></span><span class="board-clock" data-clock></span></div>`;
}
