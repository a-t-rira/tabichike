import { BASIC_PACKING, createPackingItem, createTrip, durationLabel, TRIP_COLORS, validateTrip } from "../models.js";
import { saveData } from "../store.js";
import { appRoot, escapeHTML } from "../utils/dom.js";
import { localDateString } from "../utils/date.js";
import { toast } from "../utils/toast.js";
import { confirmDialog } from "../utils/dialog.js";
import { header, ticket } from "./common.js";

const COLOR_NAMES = { sunset: "サンセット", sky: "スカイ", mint: "ミント", rose: "ローズ", gold: "ゴールド" };

export function renderTripForm(data, tripId = null, returnTo = "#/") {
  const existing = tripId ? data.trips.find((trip) => trip.id === tripId) : null;
  if (tripId && !existing) return false;
  const today = localDateString();
  const draft = existing ? { ...existing, members: [...(existing.members || [])] } : createTrip({ startDate: today, endDate: today });
  let members = [...draft.members];
  let color = draft.color || "sunset";
  const escape = escapeHTML;
  const previewTrip = () => ({ ...draft, title: document.getElementById("title")?.value || "旅行のなまえ", destination: document.getElementById("destination")?.value || "", startDate: document.getElementById("startDate")?.value || today, endDate: document.getElementById("endDate")?.value || today, color });

  appRoot().innerHTML = `<div class="app-shell">
    ${header(existing ? "旅行を編集" : "新しい旅行", { back: existing ? returnTo : "#/", right: '<button type="button" class="header-save" id="save-top">保存</button>' })}
    <main class="page-content trip-form">
      <div class="form-preview" id="form-preview">${ticket(previewTrip(), { interactive: false })}</div>
      <form id="trip-form" novalidate>
        <div class="form-field"><label for="title">旅行のなまえ *</label><input id="title" name="title" maxlength="80" placeholder="例：京都ひとり旅" value="${escape(draft.title)}" autocomplete="off"><p class="field-error" data-error="title"></p></div>
        <div class="form-field"><label for="destination">行き先</label><input id="destination" name="destination" maxlength="80" placeholder="例：京都" value="${escape(draft.destination)}"><p class="field-error" data-error="destination"></p></div>
        <div class="form-grid">
          <div class="form-field"><label for="startDate">出発日 *</label><input id="startDate" name="startDate" type="date" value="${escape(draft.startDate)}"><p class="field-error" data-error="startDate"></p></div>
          <div class="form-field"><label for="endDate">帰る日 *</label><input id="endDate" name="endDate" type="date" value="${escape(draft.endDate)}"><p class="field-error" data-error="endDate"></p></div>
        </div>
        <p class="duration-note" id="duration-note">${escape(durationLabel(draft.startDate, draft.endDate))}</p>
        <div class="form-field"><span class="field-label">一緒に行く人</span><div class="tag-list" id="member-list"></div><div class="tag-entry"><input id="member-input" maxlength="40" placeholder="例：たろう" aria-label="同行者の名前"><button type="button" id="member-add">追加</button></div><p class="field-error" data-error="members"></p></div>
        <div class="form-field"><label for="budget">予算</label><input id="budget" name="budget" type="number" inputmode="numeric" min="0" step="1" placeholder="例：50000" value="${draft.budget ?? ""}"><p class="field-error" data-error="budget"></p></div>
        <fieldset class="form-field color-field"><legend class="field-label">チケットの色</legend><div class="color-options">${Object.entries(TRIP_COLORS).map(([key, value]) => `<button type="button" class="color-choice" data-color="${key}" aria-label="${COLOR_NAMES[key]}" aria-pressed="${key === color}" style="background:${value}"></button>`).join("")}</div><p class="field-error" data-error="color"></p></fieldset>
        <div class="form-field"><label for="memo">メモ</label><textarea id="memo" name="memo" maxlength="600" placeholder="例：雨なら美術館に変更">${escape(draft.memo)}</textarea><p class="field-error" data-error="memo"></p></div>
        ${existing ? "" : `<label class="check-line"><input id="basic-packing" type="checkbox" checked>持ち物の基本セットを入れておく</label>`}
        <div class="form-actions"><button type="submit" class="primary-button">保存</button></div>
      </form>
    </main>
  </div>`;

  const form = document.getElementById("trip-form");
  const updateMemberList = () => {
    document.getElementById("member-list").innerHTML = members.map((name, index) => `<span class="tag">${escape(name)}<button type="button" data-remove-member="${index}" aria-label="${escape(name)}を削除">×</button></span>`).join("");
  };
  const updatePreview = () => {
    const preview = document.getElementById("form-preview");
    preview.innerHTML = ticket(previewTrip(), { interactive: false });
    document.getElementById("duration-note").textContent = durationLabel(document.getElementById("startDate").value, document.getElementById("endDate").value);
  };
  const addMember = () => {
    const input = document.getElementById("member-input");
    const value = input.value.trim();
    if (!value) return;
    if (members.length >= 10 || [...value].length > 20) {
      document.querySelector('[data-error="members"]').textContent = "同行者は10人まで、各20文字以内で入れてください";
      return;
    }
    members.push(value);
    input.value = "";
    document.querySelector('[data-error="members"]').textContent = "";
    updateMemberList();
  };
  updateMemberList();
  document.getElementById("member-add").addEventListener("click", addMember);
  document.getElementById("member-input").addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); addMember(); } });
  document.getElementById("member-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-member]");
    if (button) { members.splice(Number(button.dataset.removeMember), 1); updateMemberList(); }
  });
  document.querySelectorAll("[data-color]").forEach((button) => button.addEventListener("click", () => {
    color = button.dataset.color;
    document.querySelectorAll("[data-color]").forEach((choice) => choice.setAttribute("aria-pressed", String(choice === button)));
    updatePreview();
  }));
  ["title", "destination", "startDate", "endDate"].forEach((id) => document.getElementById(id).addEventListener("input", updatePreview));
  document.getElementById("startDate").addEventListener("change", () => {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate");
    if (start && end.value && end.value < start) end.value = start;
    updatePreview();
  });
  document.getElementById("save-top").addEventListener("click", () => form.requestSubmit());

  let initialSnapshot = JSON.stringify(formValues());
  form.dataset.initialSnapshot = initialSnapshot;
  function formValues() {
    return { title: document.getElementById("title").value, destination: document.getElementById("destination").value, startDate: document.getElementById("startDate").value, endDate: document.getElementById("endDate").value, members, memberDraft: document.getElementById("member-input").value, budgetText: document.getElementById("budget").value, color, memo: document.getElementById("memo").value, basicPackingChecked: document.getElementById("basic-packing")?.checked ?? null };
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = formValues();
    const errors = validateTrip(values);
    document.querySelectorAll("[data-error]").forEach((node) => { node.textContent = errors[node.dataset.error] || ""; });
    if (Object.keys(errors).length) {
      document.querySelector(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }
    const outOfRange = (existing?.items || []).filter((item) => item.date < values.startDate || item.date > values.endDate);
    if (outOfRange.length && !await confirmDialog({ title: "期間外になる予定があります", message: `${outOfRange.length}件の予定が新しい期間の外になります。最終日に移動しますか？`, confirmLabel: "最終日に移動して保存" })) return;
    const nextTrip = {
      ...draft, title: values.title.trim(), destination: values.destination.trim(), startDate: values.startDate, endDate: values.endDate,
      members: [...members], budget: values.budgetText === "" ? null : Number(values.budgetText), color, memo: values.memo.trim(), updatedAt: new Date().toISOString(),
      items: (draft.items || []).map((item) => outOfRange.includes(item) ? { ...item, date: values.endDate } : item),
    };
    if (!existing && document.getElementById("basic-packing")?.checked) nextTrip.packing = BASIC_PACKING.map(([name, category]) => createPackingItem(name, category));
    const trips = existing ? data.trips.map((trip) => trip.id === existing.id ? nextTrip : trip) : [...data.trips, nextTrip];
    if (!saveData({ ...data, trips })) return;
    initialSnapshot = JSON.stringify(formValues());
    form.dataset.initialSnapshot = initialSnapshot;
    if (existing) {
      toast("保存しました");
      location.hash = returnTo;
    } else {
      toast("チケットを発券しました！✈️");
      location.hash = `#/trip/${encodeURIComponent(nextTrip.id)}`;
    }
  });

  window.onbeforeunload = (event) => {
    if (JSON.stringify(formValues()) !== initialSnapshot) {
      event.preventDefault();
      event.returnValue = "";
    }
  };
  return true;
}
