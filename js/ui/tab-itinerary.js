import { createId } from "../models.js";
import { saveData } from "../store.js";
import { escapeHTML } from "../utils/dom.js";
import { formatShortDate, localDateString, dayDifference } from "../utils/date.js";
import { toast } from "../utils/toast.js";
import { confirmDialog } from "../utils/dialog.js";

const CATS = { move: ["移動", "🚃", "#3BA7E0"], sight: ["観光", "📸", "#FF6B3D"], food: ["食事", "🍙", "#E8A317"], stay: ["宿", "🏨", "#7B6CD9"], other: ["その他", "📌", "#7A7F8C"] };
const ICONS = {
  move: '<path d="M8 3h8a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a4 4 0 0 1 4-4Z"/><path d="M4 11h16M8 21l2-4M16 21l-2-4"/><circle cx="8" cy="14" r=".6" fill="currentColor"/><circle cx="16" cy="14" r=".6" fill="currentColor"/>',
  sight: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3.5"/>',
  food: '<path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2M6 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  stay: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  other: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
};
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function renderItinerary(trip, data, rerender, target, autoScroll = true) {
  const today = localDateString();
  const days = Array.from({ length: dayDifference(trip.startDate, trip.endDate) + 1 }, (_, i) => {
    const d = new Date(`${trip.startDate}T00:00:00`); d.setDate(d.getDate() + i); return localDateString(d);
  });
  const items = trip.items || [];
  if (!items.length) target.innerHTML = `<div class="empty-state"><div class="empty-illustration" aria-hidden="true">🗺️</div><p>行きたい場所を入れて、旅のルートをつくりましょう！</p><button class="primary-button" type="button" data-add-item>予定を追加</button></div>`;
  else target.innerHTML = days.map((date, index) => {
    const dayItems = items.filter((item) => item.date === date).sort((a,b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
    const allDone = dayItems.length > 0 && dayItems.every((item) => item.done);
    const futureToday = date === today ? dayItems.filter((item) => item.time && item.time >= `${String(new Date().getHours()).padStart(2,"0")}:${String(new Date().getMinutes()).padStart(2,"0")}`).sort((a,b) => a.time.localeCompare(b.time))[0] : null;
    return `<section class="day ${date === today ? "is-today" : ""}" data-day="${date}"><div class="day-head"><div class="day-no"><span class="k">DAY</span><span class="n">${index + 1}</span></div><div class="day-date">${escapeHTML(formatShortDate(date))}</div>${date === today ? `<span class="today-badge">今日</span>` : ""}${allDone ? `<span class="day-complete">DAY COMPLETE</span>` : ""}</div>${dayItems.length ? `<div class="timeline">${dayItems.map((item) => itemCard(item, date, item === futureToday, today)).join("")}</div>` : `<div class="empty-day">予定はまだありません<br><button type="button" data-add-item="${date}">＋ この日に追加</button></div>`}</section>`;
  }).join("");
  const add = (date = null, item = null) => openItemDialog(trip, data, days, date, item, rerender);
  target.onclick = async (event) => {
    const button = event.target.closest("[data-add-item]"); if (button) { add(button.dataset.addItem || null); return; }
    const stamp = event.target.closest(".go-btn,.visited");
    if (stamp) {
      const item = items.find((entry) => entry.id === stamp.dataset.id); if (!item) return;
      const removing = item.done; item.done = !item.done;
      const section = stamp.closest(".day"); const sectionItems = items.filter((entry) => entry.date === section.dataset.day);
      const completedNow = !removing && sectionItems.length && sectionItems.every((entry) => entry.done);
      if (saveData({ ...data, trips: data.trips.map((t) => t.id === trip.id ? trip : t) })) {
        rerender();
        if (removing) toast("スタンプを外しました", "元に戻す", () => { item.done = true; if (saveData({ ...data, trips: data.trips.map((t) => t.id === trip.id ? trip : t) })) rerender(); });
        else if (completedNow && !reduceMotion) setTimeout(() => document.querySelector(`[data-day="${section.dataset.day}"] .day-complete`)?.classList.add("press"), 750);
        if (!removing && !reduceMotion) document.querySelector(`.visited[data-id="${item.id}"]`)?.classList.add("press");
      }
      return;
    }
    const card = event.target.closest(".itinerary-card"); if (card) { add(null, items.find((entry) => entry.id === card.dataset.id)); }
  };
  const fab = document.querySelector(".detail-page .detail-fab"); fab?.remove();
  if (items.length) target.insertAdjacentHTML("beforeend", "");
  if (autoScroll && trip.items.length && trip.startDate <= today && trip.endDate >= today) requestAnimationFrame(() => document.querySelector(".day.is-today")?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" }));
  // A shared fixed add button is rendered by the detail frame for the active tab.
  const detail = target.closest(".detail-page");
  if (detail) { detail.insertAdjacentHTML("beforeend", `<button class="fab detail-fab" type="button" aria-label="予定を追加">＋</button>`); detail.querySelector(".detail-fab").onclick = () => add(); }
}

function itemCard(item, date, isNext, today) {
  const [, , color] = CATS[item.category] || CATS.other;
  const icon = ICONS[item.category] || ICONS.other;
  const time = item.time ? `${item.time}${item.endTime ? `<small>〜${escapeHTML(item.endTime)}</small>` : ""}` : "未定";
  const stamp = date <= today ? item.done ? `<button class="visited" data-id="${escapeHTML(item.id)}" aria-label="スタンプを外す">VISITED<span>${escapeHTML(formatShortDate(date).split("(")[0])}</span></button>` : `<button class="go-btn" data-id="${escapeHTML(item.id)}" aria-label="行った！スタンプを押す">行った？</button>` : "";
  return `<div class="item ${isNext ? "is-next" : ""}" style="--cc:${color}"><div class="time ${item.time ? "" : "tbd"}">${time}</div><div class="pin-col"><span class="cat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></span></div><article class="card itinerary-card" data-id="${escapeHTML(item.id)}">${isNext ? `<div class="next-tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17.8 19.2-1.8-8.2 3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>NEXT</div>` : ""}<div class="c-title">${escapeHTML(item.title)}${item.done ? `<span class="check">✓</span>` : ""}</div>${item.place ? `<div class="c-place">${placePin()}${escapeHTML(item.place)}</div>` : ""}${item.memo ? `<div class="c-memo">${escapeHTML(item.memo)}</div>` : ""}<div class="stamp-slot">${stamp}</div></article></div>`;
}

function placePin() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`; }

async function openItemDialog(trip, data, days, date, item, rerender) {
  const dialog = makeSheet(item ? "予定を編集" : "予定を追加");
  const options = days.map((day, index) => `<option value="${day}" ${day === (item?.date || date || (trip.startDate <= localDateString() && trip.endDate >= localDateString() ? localDateString() : days[0]) ) ? "selected" : ""}>${index + 1}日目 ${formatShortDate(day)}</option>`).join("");
  dialog.innerHTML += `<form class="sheet-form"><label>日にち<select name="date">${options}</select></label><div class="form-grid"><label>開始時刻<input name="time" type="time" value="${escapeHTML(item?.time || "")}"></label><label>終了時刻<input name="endTime" type="time" value="${escapeHTML(item?.endTime || "")}" ${item?.time ? "" : "disabled"}></label></div><fieldset><legend>カテゴリ</legend><div class="category-choices">${Object.entries(CATS).map(([key,[name,emoji]]) => `<button type="button" class="category-choice" data-category="${key}" aria-pressed="${(item?.category || "sight") === key}">${emoji}<small>${name}</small></button>`).join("")}</div></fieldset><label>やること<input name="title" maxlength="40" required placeholder="例：清水寺" value="${escapeHTML(item?.title || "")}"></label><label>場所<input name="place" maxlength="60" placeholder="例：京都市東山区" value="${escapeHTML(item?.place || "")}"></label><label>メモ<textarea name="memo" maxlength="200">${escapeHTML(item?.memo || "")}</textarea></label><p class="sheet-error" aria-live="polite"></p><button class="primary-button" type="submit">保存</button>${item ? `<button class="danger-button" type="button" data-remove>削除</button>` : ""}</form>`;
  document.body.append(dialog); dialog.showModal(); const form = dialog.querySelector("form"); let category = item?.category || "sight";
  const timeInput = form.elements.time; timeInput.oninput = () => { form.elements.endTime.disabled = !timeInput.value; if (!timeInput.value) form.elements.endTime.value = ""; };
  dialog.querySelectorAll("[data-category]").forEach((button) => button.onclick = () => { category = button.dataset.category; dialog.querySelectorAll("[data-category]").forEach((b) => b.setAttribute("aria-pressed", String(b === button))); });
  form.onsubmit = (event) => { event.preventDefault(); const error = !form.elements.title.value.trim() ? "やることを入れてください" : timeInput.value && form.elements.endTime.value && form.elements.endTime.value <= timeInput.value ? "終了時刻は開始時刻より後にしてください" : ""; form.querySelector(".sheet-error").textContent = error; if (error) return;
    const nextItem = { id: item?.id || createId(), date: form.elements.date.value, time: timeInput.value || null, endTime: timeInput.value ? form.elements.endTime.value || null : null, title: form.elements.title.value.trim(), category, place: form.elements.place.value.trim(), memo: form.elements.memo.value.trim(), done: item?.done || false };
    trip.items = item ? trip.items.map((row) => row.id === item.id ? nextItem : row) : [...trip.items, nextItem]; persist(trip,data,rerender); dialog.close();
  };
  form.querySelector("[data-remove]")?.addEventListener("click", async () => { if (await confirmDialog({title:"この予定を削除しますか？", confirmLabel:"削除する", danger:true})) { trip.items = trip.items.filter((row) => row.id !== item.id); persist(trip,data,rerender); dialog.close(); } });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); }); dialog.addEventListener("close", () => dialog.remove(), { once:true });
}
function persist(trip,data,rerender) { trip.updatedAt = new Date().toISOString(); if (saveData({...data,trips:data.trips.map((t)=>t.id===trip.id?trip:t)})) rerender(); }
function makeSheet(title) { const d=document.createElement("dialog"); d.className="bottom-sheet"; d.innerHTML=`<h2>${title}</h2>`; return d; }
