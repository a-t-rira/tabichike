import { createId } from "../models.js";
import { saveData } from "../store.js";
import { escapeHTML } from "../utils/dom.js";
import { formatShortDate, localDateString, dayDifference } from "../utils/date.js";
import { toast } from "../utils/toast.js";
import { confirmDialog } from "../utils/dialog.js";

const CATS = { move:["🚃","交通費","#3BA7E0"], stay:["🏨","宿泊費","#7B6CD9"], food:["🍙","食費","#E8A317"], sight:["🎟️","観光・体験","#FF6B3D"], shopping:["🛍️","おみやげ・買い物","#F2668B"], other:["💴","その他","#7A7F8C"] };

export function renderExpenses(trip, data, rerender, target, collaboration = null) {
  trip.expenses ||= [];
  const expenses = trip.expenses;
  const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const budget = trip.budget;
  const ratio = budget > 0 ? total / budget : 0;
  const groups = Object.entries(CATS).map(([key, [emoji, name, color]]) => ({ key, emoji, name, color, total: expenses.filter((item) => item.category === key).reduce((sum, item) => sum + Number(item.amount || 0), 0) })).filter((group) => group.total > 0).sort((a, b) => b.total - a.total);
  const dates = Array.from({ length: dayDifference(trip.startDate, trip.endDate) + 1 }, (_, i) => { const date = new Date(`${trip.startDate}T00:00:00`); date.setDate(date.getDate() + i); return localDateString(date); });
  const allDates = [...new Set(expenses.map((item) => item.date).filter(Boolean))].sort();
  const dateGroups = allDates.map((date) => ({ date, items: expenses.filter((item) => item.date === date) })).filter((group) => group.items.length).concat([{ date: null, items: expenses.filter((item) => !item.date) }]).filter((group) => group.items.length);
  const noBudget = collaboration ? `<span class="budget-link">予算未設定</span>` : `<a href="#/trip/${encodeURIComponent(trip.id)}/edit" class="budget-link">予算を決める →</a>`;
  target.innerHTML = `<section class="expense-summary"><span class="expense-eyebrow">TOTAL SPENT</span><strong class="expense-total">¥${total.toLocaleString("ja-JP")}</strong>${budget != null ? `<div class="budget-line"><span>予算 ¥${Number(budget).toLocaleString("ja-JP")}</span><span class="${ratio > 1 ? "over-budget" : ""}">${ratio > 1 ? `予算を ¥${(total - budget).toLocaleString("ja-JP")} オーバー` : `のこり ¥${(budget - total).toLocaleString("ja-JP")}`}</span></div><div class="budget-track ${ratio > 1 ? "is-over" : ratio >= .8 ? "is-warning" : ""}"><span style="width:${Math.min(100, ratio * 100)}%"></span></div>` : noBudget}</section>${groups.length ? `<section class="expense-breakdown"><h2>カテゴリ別内訳</h2>${groups.map((group) => `<div class="expense-category" style="--cc:${group.color}"><div><span>${group.emoji} ${group.name}</span><b>¥${group.total.toLocaleString("ja-JP")}</b></div><div class="category-track"><span style="width:${total ? group.total / total * 100 : 0}%"></span></div></div>`).join("")}</section>` : ""}${expenses.length ? dateGroups.map((group) => `<section class="expense-day"><h2>${group.date ? escapeHTML(formatShortDate(group.date)) : "日付なし"}</h2><div class="expense-list">${group.items.map((item) => { const [emoji] = CATS[item.category] || CATS.other; return `<button class="expense-row" type="button" data-edit="${escapeHTML(item.id)}"><span class="expense-item-icon">${emoji}</span><span class="expense-item-title">${escapeHTML(item.title)}</span><strong>¥${Number(item.amount).toLocaleString("ja-JP")}</strong></button>`; }).join("")}</div></section>`).join("") : `<div class="empty-state"><div class="empty-illustration" aria-hidden="true">💴</div><p>交通費や宿代をメモしておくと、旅の合計がひと目でわかります！</p><button class="primary-button" type="button" data-add>費用を追加</button></div>`}`;

  const open = (item = null) => expenseDialog(trip, data, dates, item, rerender, collaboration);
  target.onclick = (event) => {
    if (event.target.closest("[data-add]")) { open(); return; }
    const edit = event.target.closest("[data-edit]");
    if (edit) open(expenses.find((item) => item.id === edit.dataset.edit));
  };
  const detail = target.closest(".detail-page");
  if (detail) { detail.querySelector(".detail-fab")?.remove(); detail.insertAdjacentHTML("beforeend", `<button class="fab detail-fab" type="button" aria-label="費用を追加">＋</button>`); detail.querySelector(".detail-fab").onclick = () => open(); }
}

function expenseDialog(trip, data, dates, item, rerender, collaboration) {
  const dialog = document.createElement("dialog");
  dialog.className = "bottom-sheet";
  const today = localDateString();
  const defaultDate = trip.startDate <= today && trip.endDate >= today ? today : "";
  const dateOptions = [...new Set([...dates, ...(item?.date && !dates.includes(item.date) ? [item.date] : [])])];
  dialog.innerHTML = `<h2>${item ? "費用を編集" : "費用を追加"}</h2><form class="sheet-form"><label>なにに<input name="title" maxlength="30" required placeholder="例：新幹線" value="${escapeHTML(item?.title || "")}"></label><label>金額<div class="money-input"><span>¥</span><input name="amount" type="number" inputmode="numeric" min="1" max="9999999" step="1" required placeholder="例：12000" value="${item?.amount ?? ""}"></div></label><fieldset><legend>カテゴリ</legend><div class="category-choices">${Object.entries(CATS).map(([key, [emoji, name]]) => `<button type="button" class="category-choice" data-category="${key}" aria-pressed="${(item?.category || "other") === key}">${emoji}<small>${name}</small></button>`).join("")}</div></fieldset><label>日にち<select name="date"><option value="">日付なし</option>${dateOptions.map((date) => `<option value="${date}" ${(item?.date || defaultDate) === date ? "selected" : ""}>${dates.includes(date) ? `${dates.indexOf(date) + 1}日目 ` : ""}${formatShortDate(date)}</option>`).join("")}</select></label><label>メモ<textarea name="memo" maxlength="100">${escapeHTML(item?.memo || "")}</textarea></label><p class="sheet-error" aria-live="polite"></p><button class="primary-button" type="submit">保存</button>${collaboration && item ? `<button class="danger-button" type="button" data-delete-expense>削除</button>` : ""}</form>`;
  document.body.append(dialog); dialog.showModal();
  const form = dialog.querySelector("form");
  let category = item?.category || "other";
  dialog.querySelectorAll("[data-category]").forEach((button) => button.onclick = () => { category = button.dataset.category; dialog.querySelectorAll("[data-category]").forEach((choice) => choice.setAttribute("aria-pressed", String(choice === button))); });
  form.onsubmit = (event) => {
    event.preventDefault();
    const title = form.elements.title.value.trim(); const amountText = form.elements.amount.value; const amount = Number(amountText);
    const error = !title ? "なにに使ったか入れてください" : !/^\d+$/.test(amountText) || amount < 1 ? "1円以上の整数で入れてください" : amount > 9999999 ? "金額が大きすぎます" : "";
    form.querySelector(".sheet-error").textContent = error; if (error) return;
    const next = { id: item?.id || createId(), date: form.elements.date.value || null, title, amount, category, memo: form.elements.memo.value.trim() };
    if (collaboration) collaboration.saveExpense(next).catch(() => saveError());
    else { trip.expenses = item ? trip.expenses.map((entry) => entry.id === item.id ? next : entry) : [...trip.expenses, next]; persist(trip, data, rerender); }
    dialog.close();
  };
  form.querySelector("[data-delete-expense]")?.addEventListener("click", async () => {
    if (!await confirmDialog({ title: "この費用を削除しますか？", confirmLabel: "削除する", danger: true })) return;
    collaboration.deleteExpense(item.id).catch(() => saveError());
    dialog.close();
    toast("費用を削除しました", "元に戻す", () => collaboration.saveExpense(item).catch(() => saveError()));
  });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  function saveError() { toast("いまサーバーが混み合っているため保存できませんでした。時間をおいてお試しください"); }
}

function persist(trip, data, rerender) { trip.updatedAt = new Date().toISOString(); if (saveData({ ...data, trips: data.trips.map((entry) => entry.id === trip.id ? trip : entry) })) rerender(); }
